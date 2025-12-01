import 'package:flutter/material.dart';
import 'package:erp_flutter/api_client.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:android_intent_plus/android_intent.dart';
import 'dart:io' show Platform;
import 'package:flutter/services.dart';

class CustomersScreen extends StatefulWidget {
  final ApiClient client;
  final dynamic auth;
  const CustomersScreen({super.key, required this.client, this.auth});

  @override
  State<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends State<CustomersScreen> {
  List<dynamic> customers = [];
  bool loading = false;
  String? error;
  final TextEditingController searchController = TextEditingController();
  String searchTerm = '';
  bool historyLoading = false;
  List<dynamic> history = [];

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final r = await widget.client.getCustomers();
      setState(() {
        customers = r;
      });
    } catch (e) {
      setState(() {
        error = 'Failed to load customers';
      });
    }
    setState(() {
      loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    if (error != null) return Center(child: Text(error!));
    final theme = Theme.of(context);
    final filtered = customers.where((raw) {
      final c = raw as Map<String, dynamic>;
      final name = (c['name'] ?? '').toString().toLowerCase();
      final phone = (c['phone'] ?? '').toString().toLowerCase();
      final q = searchTerm.toLowerCase().trim();
      if (q.isEmpty) return true;
      return name.contains(q) || phone.contains(q);
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
                  hintText: 'Search customers...',
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
              final c = filtered[i] as Map<String, dynamic>;
              final name = (c['name'] ?? '').toString();
              final phone = (c['phone'] ?? '').toString();
              final orders = (c['orderCount'] ?? 0) as int;
              final spent = (c['totalSpent'] ?? 0) as num;
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                clipBehavior: Clip.antiAlias,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 6,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(colors: [Colors.indigo.withOpacity(0.8), Colors.indigo.withOpacity(0.4)]),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(children: [
                            Expanded(child: Text(name, style: const TextStyle(fontWeight: FontWeight.w700))),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(color: Colors.blue.withOpacity(0.12), borderRadius: BorderRadius.circular(16)),
                              child: Row(children: [
                                const Icon(Icons.receipt_long, size: 16, color: Colors.blue),
                                const SizedBox(width: 6),
                                Text('Orders $orders', style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.w600)),
                              ]),
                            ),
                          ]),
                          const SizedBox(height: 6),
                          Row(children: [
                            Expanded(child: Text(phone.isNotEmpty ? phone : 'No phone')), 
                            Text('₹ ${spent.toStringAsFixed(0)}', style: TextStyle(fontWeight: FontWeight.w700, color: theme.colorScheme.primary)),
                          ]),
                          const SizedBox(height: 8),
                          Row(children: [
                            TextButton(
                              onPressed: () => _openHistory(c['id']?.toString() ?? ''),
                              child: const Text('View bills'),
                            ),
                          ]),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Future<void> _openHistory(String customerId) async {
    setState(() { historyLoading = true; });
    try {
      history = await widget.client.getCustomerPurchaseHistory(customerId);
    } catch (_) {
      history = [];
    }
    setState(() { historyLoading = false; });
    if (!mounted) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return SafeArea(
          child: SizedBox(
            height: MediaQuery.of(context).size.height * 0.75,
            child: historyLoading
                ? const Center(child: CircularProgressIndicator())
                : Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          children: [
                            const Text('Customer Bills', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                            const Spacer(),
                            IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
                          ],
                        ),
                      ),
                      Expanded(
                        child: ListView.builder(
                          itemCount: history.length,
                          itemBuilder: (context, i) {
                            final b = history[i] as Map<String, dynamic>;
                            final billNo = (b['billNo'] ?? '').toString();
                            final total = (b['total'] ?? 0).toString();
                            final dateStr = (b['createdAt'] ?? '').toString();
                            final method = (b['paymentMethod'] ?? '').toString();
                            return Card(
                              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              child: ListTile(
                                title: Text('Bill #$billNo'),
                                subtitle: Text('$dateStr • ${method.toUpperCase()}'),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text('₹ $total', style: const TextStyle(fontWeight: FontWeight.w700)),
                                    const SizedBox(width: 12),
                                    IconButton(
                                      icon: const Icon(Icons.picture_as_pdf),
                                      onPressed: () => _openPdf(b['id']?.toString() ?? ''),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
          ),
        );
      },
    );
  }

  Future<void> _openPdf(String id) async {
    final t = (widget.auth?.tenantId as String?) ?? '';
    final q = t.isNotEmpty ? '?tenantId=$t' : '';
    final url = Uri.parse('${widget.client.baseUrl}/api/bill-pdf/$id$q');
    if (Platform.isAndroid) {
      try {
        final intent = AndroidIntent(action: 'action_view', data: url.toString(), package: 'com.android.chrome');
        await intent.launch();
        return;
      } catch (_) {}
      try {
        final generic = AndroidIntent(action: 'action_view', data: url.toString());
        await generic.launch();
        return;
      } catch (_) {}
    }
    try {
      final ok = await launchUrl(url, mode: LaunchMode.externalApplication);
      if (!ok) throw Exception('External launch failed');
    } catch (_) {
      await Clipboard.setData(ClipboardData(text: url.toString()));
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Unable to open. Link copied: $url')));
    }
  }
}
