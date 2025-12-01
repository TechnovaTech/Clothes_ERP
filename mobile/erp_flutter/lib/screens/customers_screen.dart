import 'package:flutter/material.dart';
import 'package:erp_flutter/api_client.dart';

class CustomersScreen extends StatefulWidget {
  final ApiClient client;
  const CustomersScreen({super.key, required this.client});

  @override
  State<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends State<CustomersScreen> {
  List<dynamic> customers = [];
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
    return ListView.builder(
      itemCount: customers.length,
      itemBuilder: (context, i) {
        final c = customers[i] as Map<String, dynamic>;
        return ListTile(
          title: Text(c['name']?.toString() ?? ''),
          subtitle: Text(c['phone']?.toString() ?? ''),
          trailing: Text('Orders ${(c['orderCount'] ?? 0).toString()}'),
        );
      },
    );
  }
}
