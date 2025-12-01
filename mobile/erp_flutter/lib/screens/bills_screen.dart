import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:dio/dio.dart';
import 'package:erp_flutter/api_client.dart';
import 'package:android_intent_plus/android_intent.dart';
import 'dart:io' show Platform;
import 'package:flutter/services.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

class BillsScreen extends StatefulWidget {
  final ApiClient client;
  final dynamic auth;
  const BillsScreen({super.key, required this.client, this.auth});

  @override
  State<BillsScreen> createState() => _BillsScreenState();
}

class _BillsScreenState extends State<BillsScreen> {
  List<dynamic> bills = [];
  Map<String, dynamic> settings = {};
  int page = 1;
  int totalPages = 1;
  bool loading = false;
  String? error;
  final TextEditingController searchController = TextEditingController();
  String searchTerm = '';

  @override
  void initState() {
    super.initState();
    load(page: 1);
    loadSettings();
  }

  Future<void> loadSettings() async {
    try {
      settings = await widget.client.getSettings();
    } catch (_) {}
    if (!mounted) return;
    setState(() {});
  }

  Future<void> load({int page = 1}) async {
    setState(() { loading = true; error = null; });
    try {
      final res = await widget.client.getBills(page: page, limit: 20);
      final data = res['data'] as List<dynamic>? ?? [];
      final pagination = res['pagination'] as Map<String, dynamic>? ?? {};
      bills = data;
      this.page = (pagination['page'] as int?) ?? page;
      totalPages = (pagination['totalPages'] as int?) ?? 1;
    } catch (e) {
      error = 'Failed to load bills';
    }
    if (!mounted) return;
    setState(() { loading = false; });
  }

  Uri billPdfUrl(dynamic bill) {
    final id = bill['_id'] ?? bill['id'];
    final t = (widget.auth?.tenantId as String?) ?? '';
    final q = t.isNotEmpty ? '?tenantId=$t' : '';
    return Uri.parse('${widget.client.baseUrl}/api/bill-pdf/$id$q');
  }

  Future<Uri> resolveBillUrl(dynamic bill) async {
    final id = bill['_id'] ?? bill['id'];
    final t = (widget.auth?.tenantId as String?) ?? '';
    final q = t.isNotEmpty ? '?tenantId=$t' : '';
    final candidates = [
      Uri.parse('${widget.client.baseUrl}/api/bill-pdf/$id$q'),
      Uri.parse('${widget.client.baseUrl}/api/public-receipt/$id$q'),
      Uri.parse('${widget.client.baseUrl}/api/receipt-simple/$id$q'),
      Uri.parse('${widget.client.baseUrl}/api/receipt/$id$q'),
    ];
    for (final u in candidates) {
      try {
        final resp = await widget.client.dio.get(u.path, options: Options(validateStatus: (s) => s != null));
        if ((resp.statusCode ?? 0) >= 200 && (resp.statusCode ?? 0) < 400) {
          return u;
        }
      } catch (_) {}
    }
    return candidates.first;
  }

  Future<void> openPdf(dynamic bill) async {
    final url = await resolveBillUrl(bill);
    if (!mounted) return;
    if (Platform.isAndroid) {
      try {
        final intent = AndroidIntent(
          action: 'action_view',
          data: url.toString(),
          package: 'com.android.chrome',
        );
        await intent.launch();
        return;
      } catch (_) {}
      try {
        final generic = AndroidIntent(
          action: 'action_view',
          data: url.toString(),
        );
        await generic.launch();
        return;
      } catch (_) {}
    }
    try {
      final ok = await launchUrl(url, mode: LaunchMode.externalApplication);
      if (!ok) {
        throw Exception('External launch failed');
      }
    } catch (_) {
      await Clipboard.setData(ClipboardData(text: url.toString()));
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Unable to open. Link copied: $url')));
    }
  }

  Future<void> sendWhatsApp(dynamic bill) async {
    final phoneRaw = (bill['customerPhone'] ?? '').toString();
    final phone = phoneRaw.replaceAll(RegExp(r'[^\d]'), '');
    if (phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Customer phone missing')));
      return;
    }
    final url = await resolveBillUrl(bill);
    final storeName = (settings['storeName'] ?? 'STORE').toString();
    final msg = '*$storeName*\n\n'
        '*Bill No:* ${bill['billNo'] ?? ''}\n'
        '*Customer:* ${bill['customerName'] ?? 'Walk-in Customer'}\n'
        '*Date:* ${bill['createdAt'] ?? ''}\n\n'
        '*TOTAL:* Rs${(bill['total'] ?? 0).toString()}\n'
        '*Payment:* ${bill['paymentMethod'] ?? 'cash'}\n\n'
        'Download Bill (PDF): ${url.toString()}';
    final wa = Uri.parse('https://wa.me/$phone?text=${Uri.encodeComponent(msg)}');
    await launchUrl(wa, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    if (error != null) return Center(child: Text(error!));
    final theme = Theme.of(context);
    final filtered = bills.where((raw) {
      final b = raw as Map<String, dynamic>;
      final billNo = (b['billNo'] ?? '').toString().toLowerCase();
      final customer = (b['customerName'] ?? '').toString().toLowerCase();
      final payment = (b['paymentMethod'] ?? '').toString().toLowerCase();
      final q = searchTerm.toLowerCase().trim();
      if (q.isEmpty) return true;
      return billNo.contains(q) || customer.contains(q) || payment.contains(q);
    }).toList();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              child: TextField(
                controller: searchController,
                onChanged: (v) => setState(() { searchTerm = v; }),
                decoration: const InputDecoration(
                  hintText: 'Search bills...',
                  prefixIcon: Icon(Icons.search),
                  border: InputBorder.none,
                ),
              ),
            ),
          ),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: filtered.length,
            itemBuilder: (context, i) {
              final b = filtered[i] as Map<String, dynamic>;
              final billNo = (b['billNo'] ?? '').toString();
              final customer = (b['customerName'] ?? 'Walk-in Customer').toString();
              final total = (b['total'] ?? 0).toString();
              final method = (b['paymentMethod'] ?? '').toString();
              final dateStr = (b['createdAt'] ?? '').toString();
              final mColor = _methodColor(method);
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                clipBehavior: Clip.antiAlias,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 6,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(colors: [mColor.withOpacity(0.8), mColor.withOpacity(0.4)]),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(child: Text('Bill #$billNo', style: const TextStyle(fontWeight: FontWeight.w700))),
                              Text('₹ $total', style: TextStyle(fontWeight: FontWeight.w700, color: theme.colorScheme.primary)),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Expanded(child: Text(customer)),
                              Text(dateStr),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: mColor.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Row(
                                  children: [
                                    Icon(Icons.payments, size: 16, color: mColor),
                                    const SizedBox(width: 6),
                                    Text(method.toUpperCase(), style: TextStyle(color: mColor, fontWeight: FontWeight.w600)),
                                  ],
                                ),
                              ),
                              const Spacer(),
                              IconButton(
                                icon: const Icon(Icons.picture_as_pdf),
                                onPressed: () => openPdf(b),
                                iconSize: 20,
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints.tightFor(width: 36, height: 36),
                                visualDensity: VisualDensity.compact,
                              ),
                              IconButton(
                                icon: const FaIcon(FontAwesomeIcons.whatsapp, color: Colors.green),
                                onPressed: () => sendWhatsApp(b),
                                iconSize: 20,
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints.tightFor(width: 36, height: 36),
                                visualDensity: VisualDensity.compact,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.all(8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Page $page/$totalPages'),
                Row(children: [
                  IconButton(onPressed: page > 1 ? () => load(page: page - 1) : null, icon: const Icon(Icons.chevron_left)),
                  IconButton(onPressed: page < totalPages ? () => load(page: page + 1) : null, icon: const Icon(Icons.chevron_right)),
                ])
              ],
            ),
          ),
        )
      ],
    );
  }

  Color _methodColor(String method) {
    final m = method.toLowerCase();
    if (m.contains('cash')) return Colors.green;
    if (m.contains('upi')) return Colors.blue;
    if (m.contains('card')) return Colors.purple;
    return Colors.teal;
  }
}
