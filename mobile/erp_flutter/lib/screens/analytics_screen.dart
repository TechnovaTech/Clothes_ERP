import 'package:flutter/material.dart';
import 'package:erp_flutter/api_client.dart';

class AnalyticsScreen extends StatefulWidget {
  final ApiClient client;
  const AnalyticsScreen({super.key, required this.client});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  List<dynamic> dailySales = [];
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
      dailySales = await widget.client.getAnalytics(type: 'daily-sales', days: 14);
    } catch (e) {
      error = 'Failed to load analytics';
    }
    if (!mounted) return;
    setState(() { loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    if (error != null) return Center(child: Text(error!));
    return ListView.builder(
      itemCount: dailySales.length,
      itemBuilder: (context, i) {
        final d = dailySales[i] as Map<String, dynamic>;
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: ListTile(
            title: Text(d['date']?.toString() ?? ''),
            subtitle: Text('Revenue ₹${(d['totalRevenue'] ?? 0)} • Profit ₹${(d['totalProfit'] ?? 0)}'),
          ),
        );
      },
    );
  }
}
