import 'package:flutter/material.dart';
import 'package:erp_flutter/api_client.dart';

class LeavesScreen extends StatefulWidget {
  final ApiClient client;
  const LeavesScreen({super.key, required this.client});

  @override
  State<LeavesScreen> createState() => _LeavesScreenState();
}

class _LeavesScreenState extends State<LeavesScreen> {
  List<dynamic> leaves = [];
  int page = 1;
  int totalPages = 1;
  bool loading = false;
  String? error;

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load({int p = 1}) async {
    setState(() { loading = true; error = null; });
    try {
      final res = await widget.client.getLeaves(page: p, limit: 20);
      final data = res['data'] as List<dynamic>;
      final pagination = res['pagination'] as Map<String, dynamic>;
      leaves = data;
      page = (pagination['page'] as int?) ?? p;
      totalPages = (pagination['totalPages'] as int?) ?? 1;
    } catch (e) {
      error = 'Failed to load leaves';
    }
    if (!mounted) return;
    setState(() { loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    if (error != null) return Center(child: Text(error!));
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            itemCount: leaves.length,
            itemBuilder: (context, i) {
              final l = leaves[i] as Map<String, dynamic>;
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: ListTile(
                  title: Text(l['employeeName']?.toString() ?? 'Employee'),
                  subtitle: Text('${l['startDate'] ?? ''} → ${l['endDate'] ?? ''} • ${l['status'] ?? ''}'),
                ),
              );
            },
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Page $page/$totalPages'),
              Row(children: [
                IconButton(onPressed: page > 1 ? () => load(p: page - 1) : null, icon: const Icon(Icons.chevron_left)),
                IconButton(onPressed: page < totalPages ? () => load(p: page + 1) : null, icon: const Icon(Icons.chevron_right)),
              ])
            ],
          ),
        )
      ],
    );
  }
}
