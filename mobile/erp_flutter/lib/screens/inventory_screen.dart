import 'package:flutter/material.dart';
import 'package:erp_flutter/api_client.dart';

class InventoryScreen extends StatefulWidget {
  final ApiClient client;
  const InventoryScreen({super.key, required this.client});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  List<dynamic> items = [];
  bool loading = false;
  String? error;
  final TextEditingController searchController = TextEditingController();
  String searchTerm = '';
  String filter = 'all'; // all | low | out
  String sortBy = 'name'; // name | stock | price
  int lowStockThreshold = 5;

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
      final r = await widget.client.getInventory();
      setState(() {
        items = r;
      });
    } catch (e) {
      setState(() {
        error = 'Failed to load inventory';
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

    List<dynamic> filtered = items.where((raw) {
      final it = raw as Map<String, dynamic>;
      final name = (it['name'] ?? '').toString().toLowerCase();
      final sku = (it['sku'] ?? '').toString().toLowerCase();
      final category = (it['Category'] ?? it['category'] ?? '').toString().toLowerCase();
      final q = searchTerm.toLowerCase().trim();
      if (q.isNotEmpty) {
        if (!(name.contains(q) || sku.contains(q) || category.contains(q))) return false;
      }
      final stock = (it['stock'] ?? it['quantity'] ?? 0) as int;
      if (filter == 'low' && !(stock > 0 && stock <= lowStockThreshold)) return false;
      if (filter == 'out' && stock > 0) return false;
      return true;
    }).toList();

    filtered.sort((a, b) {
      final x = a as Map<String, dynamic>;
      final y = b as Map<String, dynamic>;
      switch (sortBy) {
        case 'stock':
          return ((y['stock'] ?? y['quantity'] ?? 0) as int)
              .compareTo(((x['stock'] ?? x['quantity'] ?? 0) as int));
        case 'price':
          return ((y['price'] ?? 0) as num).compareTo(((x['price'] ?? 0) as num));
        case 'name':
        default:
          return (x['name'] ?? '').toString().toLowerCase().compareTo((y['name'] ?? '').toString().toLowerCase());
      }
    });

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: searchController,
                      onChanged: (v) => setState(() { searchTerm = v; }),
                      decoration: const InputDecoration(
                        hintText: 'Search inventory...',
                        prefixIcon: Icon(Icons.search),
                        border: InputBorder.none,
                      ),
                    ),
                  ),
                  PopupMenuButton<String>(
                    icon: const Icon(Icons.sort),
                    onSelected: (v) => setState(() { sortBy = v; }),
                    itemBuilder: (context) => const [
                      PopupMenuItem(value: 'name', child: Text('Sort by Name')),
                      PopupMenuItem(value: 'stock', child: Text('Sort by Stock')),
                      PopupMenuItem(value: 'price', child: Text('Sort by Price')),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Wrap(
            spacing: 8,
            children: [
              FilterChip(
                label: const Text('All'),
                selected: filter == 'all',
                onSelected: (_) => setState(() { filter = 'all'; }),
              ),
              FilterChip(
                label: const Text('Low stock'),
                selected: filter == 'low',
                onSelected: (_) => setState(() { filter = 'low'; }),
              ),
              FilterChip(
                label: const Text('Out of stock'),
                selected: filter == 'out',
                onSelected: (_) => setState(() { filter = 'out'; }),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: filtered.length,
            itemBuilder: (context, i) {
              final it = filtered[i] as Map<String, dynamic>;
              final name = (it['name'] ?? '').toString();
              final sku = (it['sku'] ?? '').toString();
              final stock = (it['stock'] ?? it['quantity'] ?? 0) as int;
              final price = (it['price'] ?? 0) as num;
              final cost = (it['Cost Price'] ?? it['cost price'] ?? it['costPrice'] ?? it['costprice'] ?? 0) as num;
              final category = (it['Category'] ?? it['category'] ?? '').toString();
              final margin = price > 0 && cost > 0 ? (((price - cost) / price) * 100) : 0;
              final sColor = _stockColor(stock);
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                clipBehavior: Clip.antiAlias,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 6,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(colors: [sColor.withOpacity(0.8), sColor.withOpacity(0.4)]),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(child: Text(name, style: const TextStyle(fontWeight: FontWeight.w700))),
                              Text('₹ ${price.toStringAsFixed(0)}', style: TextStyle(fontWeight: FontWeight.w700, color: theme.colorScheme.primary)),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Expanded(child: Text('SKU: ${sku.isNotEmpty ? sku : '-'}')),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(color: sColor.withOpacity(0.12), borderRadius: BorderRadius.circular(16)),
                                child: Row(children: [
                                  Icon(Icons.inventory, size: 16, color: sColor),
                                  const SizedBox(width: 6),
                                  Text('Stock $stock', style: TextStyle(color: sColor, fontWeight: FontWeight.w600)),
                                ]),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Expanded(child: Text(category.isNotEmpty ? category : 'Category -')),
                              Text('Margin ${margin.toStringAsFixed(1)}%', style: const TextStyle(fontWeight: FontWeight.w600)),
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
      ],
    );
  }

  Color _stockColor(int stock) {
    if (stock <= 0) return Colors.red;
    if (stock <= lowStockThreshold) return Colors.orange;
    return Colors.green;
  }
}
