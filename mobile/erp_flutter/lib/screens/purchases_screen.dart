import 'package:flutter/material.dart';
import 'package:erp_flutter/api_client.dart';

class PurchasesScreen extends StatefulWidget {
  final ApiClient client;
  const PurchasesScreen({super.key, required this.client});

  @override
  State<PurchasesScreen> createState() => _PurchasesScreenState();
}

class _PurchasesScreenState extends State<PurchasesScreen> {
  List<dynamic> purchases = [];
  int page = 1;
  int totalPages = 1;
  bool loading = false;
  String? error;
  final TextEditingController searchController = TextEditingController();
  String searchTerm = '';
  String statusFilter = 'all';
  static const double _hPadding = 12;
  static const double _vPadding = 8;

  num asNum(dynamic v) {
    if (v is num) return v;
    final s = v?.toString() ?? '';
    return num.tryParse(s) ?? 0;
  }

  @override
  void initState() {
    super.initState();
    load(page: 1);
  }

  Future<void> load({int page = 1}) async {
    setState(() { loading = true; error = null; });
    try {
      final res = await widget.client.getPurchases(page: page, limit: 20);
      final data = res['data'] as List<dynamic>? ?? [];
      final pagination = res['pagination'] as Map<String, dynamic>? ?? {};
      purchases = data;
      this.page = (pagination['page'] as int?) ?? page;
      totalPages = (pagination['totalPages'] as int?) ?? 1;
    } catch (e) {
      error = 'Failed to load purchases';
    }
    if (!mounted) return;
    setState(() { loading = false; });
  }

  String formatDate(dynamic v) {
    try {
      final d = DateTime.tryParse(v?.toString() ?? '');
      if (d != null) {
        return '${d.day.toString().padLeft(2,'0')}/${d.month.toString().padLeft(2,'0')}/${d.year}';
      }
    } catch (_) {}
    return (v ?? '').toString();
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    if (error != null) return Center(child: Text(error!));
    final theme = Theme.of(context);
    final filtered = purchases.where((raw) {
      final p = raw as Map<String, dynamic>;
      final po = (p['poNumber'] ?? '').toString().toLowerCase();
      final supplier = (p['supplierName'] ?? '').toString().toLowerCase();
      final status = (p['status'] ?? '').toString().toLowerCase();
      final items = (p['items'] as List?)?.map((i) => (i as Map<String, dynamic>)['name']?.toString().toLowerCase() ?? '').join(' ') ?? '';
      final q = searchTerm.toLowerCase().trim();
      final matchesSearch = q.isEmpty || po.contains(q) || supplier.contains(q) || status.contains(q) || items.contains(q);
      final matchesStatus = statusFilter == 'all' || status.contains(statusFilter);
      return matchesSearch && matchesStatus;
    }).toList();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(_hPadding, _vPadding, _hPadding, 0),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: searchController,
                      onChanged: (v) => setState(() { searchTerm = v; }),
                      decoration: const InputDecoration(
                        hintText: 'Search purchases...',
                        prefixIcon: Icon(Icons.search),
                        border: InputBorder.none,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  DropdownButton<String>(
                    value: statusFilter,
                    items: const [
                      DropdownMenuItem(value: 'all', child: Text('All')),
                      DropdownMenuItem(value: 'received', child: Text('Received')),
                      DropdownMenuItem(value: 'ordered', child: Text('Ordered')),
                      DropdownMenuItem(value: 'pending', child: Text('Pending')),
                      DropdownMenuItem(value: 'cancelled', child: Text('Cancelled')),
                    ],
                    onChanged: (v) => setState(() { statusFilter = v ?? 'all'; }),
                  ),
                ],
              ),
            ),
          ),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: filtered.length,
            itemBuilder: (context, i) {
              final p = filtered[i] as Map<String, dynamic>;
              final po = (p['poNumber'] ?? '').toString();
              final supplier = (p['supplierName'] ?? '').toString();
              final items = (p['items'] as List?)?.length ?? 0;
              final orderDate = formatDate(p['orderDate']);
              final total = asNum(p['total'] ?? 0).toStringAsFixed(0);
              final status = (p['status'] ?? '').toString();
              final sColor = _statusColor(status);
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: _hPadding, vertical: 8),
                clipBehavior: Clip.antiAlias,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(child: Text('Order #$po', style: const TextStyle(fontWeight: FontWeight.w700))),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: sColor.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Row(
                                  children: [
                                    Icon(Icons.circle, size: 8, color: sColor),
                                    const SizedBox(width: 6),
                                    Text(status, style: TextStyle(color: sColor, fontWeight: FontWeight.w600)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(child: Text('Supplier: $supplier')),
                              Text('Items: $items'),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(child: Text('Order Date: $orderDate')),
                              Text('₹ $total', style: TextStyle(fontWeight: FontWeight.w700, color: theme.colorScheme.primary)),
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

  Color _statusColor(String status) {
    final s = status.toLowerCase();
    if (s.contains('complete') || s == 'received') return Colors.green;
    if (s.contains('pending') || s == 'ordered') return Colors.orange;
    if (s.contains('cancel')) return Colors.red;
    return Colors.blueGrey;
  }

  
}
