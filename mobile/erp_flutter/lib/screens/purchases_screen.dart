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
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            itemCount: purchases.length,
            itemBuilder: (context, i) {
              final p = purchases[i] as Map<String, dynamic>;
              final po = (p['poNumber'] ?? '').toString();
              final supplier = (p['supplierName'] ?? '').toString();
              final items = (p['items'] as List?)?.length ?? 0;
              final orderDate = formatDate(p['orderDate']);
              final total = (p['total'] ?? 0).toString();
              final status = (p['status'] ?? '').toString();
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(child: Text('Order ID: $po', style: const TextStyle(fontWeight: FontWeight.w600))),
                          Text('₹ $total', style: const TextStyle(fontWeight: FontWeight.w600)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Expanded(child: Text('Supplier: $supplier')),
                          Text('Items: $items'),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Expanded(child: Text('Order Date: $orderDate')),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              color: status == 'completed' ? Colors.green.shade100 : status == 'pending' ? Colors.orange.shade100 : Colors.grey.shade200,
                            ),
                            child: Text(status, style: TextStyle(color: status == 'completed' ? Colors.green.shade800 : status == 'pending' ? Colors.orange.shade800 : Colors.grey.shade800)),
                          ),
                        ],
                      ),
                    ],
                  ),
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
}
