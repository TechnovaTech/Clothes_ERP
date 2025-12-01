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
    return ListView.builder(
      itemCount: items.length,
      itemBuilder: (context, i) {
        final it = items[i] as Map<String, dynamic>;
        return ListTile(
          title: Text(it['name']?.toString() ?? ''),
          subtitle: Text('SKU ${it['sku']?.toString() ?? ''} • Stock ${it['stock'] ?? 0}'),
          trailing: Text('₹ ${(it['price'] ?? 0).toString()}'),
        );
      },
    );
  }
}
