import 'package:flutter/material.dart';
import 'package:erp_flutter/api_client.dart';

class HRScreen extends StatefulWidget {
  final ApiClient client;
  const HRScreen({super.key, required this.client});

  @override
  State<HRScreen> createState() => _HRScreenState();
}

class _HRScreenState extends State<HRScreen> {
  List<dynamic> employees = [];
  bool loading = false;
  String? error;

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    setState(() { loading = true; error = null; });
    try {
      employees = await widget.client.getEmployees();
    } catch (e) {
      error = 'Failed to load employees';
    }
    if (!mounted) return;
    setState(() { loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    if (error != null) return Center(child: Text(error!));
    return ListView.builder(
      itemCount: employees.length,
      itemBuilder: (context, i) {
        final e = employees[i] as Map<String, dynamic>;
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: ListTile(
            title: Text(e['name']?.toString() ?? ''),
            subtitle: Text('Phone ${e['phone'] ?? ''} • Role ${e['role'] ?? ''}'),
            trailing: Text('Salary ₹${(e['salary'] ?? 0).toString()}'),
          ),
        );
      },
    );
  }
}
