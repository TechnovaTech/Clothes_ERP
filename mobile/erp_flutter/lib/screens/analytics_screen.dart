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
  List<dynamic> dailyProfit = [];
  List<dynamic> monthlyNetProfit = [];
  Map<String, dynamic> summary = {};
  bool loading = false;
  String? error;
  int days = 30;

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    setState(() { loading = true; error = null; });
    try {
      final sales = widget.client.getAnalytics(type: 'daily-sales', days: days);
      final profit = widget.client.getAnalytics(type: 'daily-profit', days: days);
      final monthly = widget.client.getAnalytics(type: 'monthly-profit', days: days);
      final summaryRes = widget.client.getAnalyticsSummary(days: days);
      final results = await Future.wait([sales, profit, monthly, summaryRes]);
      dailySales = results[0] as List<dynamic>;
      dailyProfit = results[1] as List<dynamic>;
      monthlyNetProfit = results[2] as List<dynamic>;
      summary = results[3] as Map<String, dynamic>;
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

    final todayStr = DateTime.now().toIso8601String().split('T').first;
    final todaysSales = (dailySales.firstWhere(
      (d) => (d as Map<String, dynamic>)['_id'] == todayStr,
      orElse: () => const {},
    ) as Map<String, dynamic>);
    final todaysProfit = (dailyProfit.firstWhere(
      (d) => (d as Map<String, dynamic>)['date'] == todayStr,
      orElse: () => const {},
    ) as Map<String, dynamic>);
    final salesGrowth = ((summary['recentTrends'] ?? {})['salesGrowth'] ?? 0) as num;
    final profitGrowth = ((summary['recentTrends'] ?? {})['profitGrowth'] ?? 0) as num;
    final profitMargin = (summary['profitMargin'] ?? 0) as num;
    final totalExpenses = (summary['totalExpenses'] ?? 0) as num;
    final scheme = Theme.of(context).colorScheme;

    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 8),
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          child: Row(
            children: [
              const Text('Analytics', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const Spacer(),
              DropdownButton<int>(
                value: days,
                items: const [
                  DropdownMenuItem(value: 7, child: Text('Last 7 days')),
                  DropdownMenuItem(value: 30, child: Text('Last 30 days')),
                  DropdownMenuItem(value: 90, child: Text('Last 90 days')),
                ],
                onChanged: (v) async {
                  if (v == null) return;
                  setState(() { days = v; loading = true; });
                  await load();
                },
              )
            ],
          ),
        ),

        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            children: [
              _statCard(
                title: "Today's Sales",
                value: '₹${(todaysSales['totalSales'] ?? 0).toString()}',
                subtitle: salesGrowth != 0 ? '${salesGrowth.toStringAsFixed(1)}% from last period' : null,
                icon: Icons.trending_up,
                color: scheme.primary,
              ),
              _statCard(
                title: "Today's Profit",
                value: '₹${(todaysProfit['totalProfit'] ?? 0).toString()}',
                subtitle: profitGrowth != 0 ? '${profitGrowth.toStringAsFixed(1)}% from last period' : null,
                icon: Icons.stacked_line_chart,
                color: ((todaysProfit['totalProfit'] ?? 0) as num) >= 0 ? Colors.green : Colors.red,
              ),
              _statCard(
                title: "Today's Orders",
                value: (todaysSales['totalTransactions'] ?? 0).toString(),
                subtitle: 'Avg ₹${((summary['totalRevenue'] ?? 0) is num && (summary['totalTransactions'] ?? 0) is num && (summary['totalTransactions'] ?? 0) != 0)
                    ? (((summary['totalRevenue'] ?? 0) as num) / ((summary['totalTransactions'] ?? 0) as num)).toStringAsFixed(0)
                    : '0'} per sale',
                icon: Icons.receipt_long,
                color: scheme.secondary,
              ),
              _statCard(
                title: 'Total Revenue',
                value: '₹${(summary['totalRevenue'] ?? 0).toString()}',
                icon: Icons.currency_rupee,
                color: Colors.indigo,
              ),
              _statCard(
                title: 'Total Profit',
                value: '₹${(summary['totalProfit'] ?? 0).toString()}',
                icon: Icons.payments,
                color: Colors.teal,
              ),
              _statCard(
                title: 'Total Expenses',
                value: '₹${totalExpenses.toString()}',
                subtitle: 'Business expenses in period',
                icon: Icons.shopping_bag,
                color: Colors.deepOrange,
              ),
              _statCard(
                title: 'Profit Margin',
                value: '${profitMargin.toStringAsFixed(1)}%',
                subtitle: profitMargin > 20 ? 'Healthy' : 'Monitor',
                icon: Icons.percent,
                color: profitMargin > 20 ? Colors.green : Colors.amber,
              ),
            ],
          ),
        ),

        Padding(
          padding: const EdgeInsets.all(12),
          child: const Text('Monthly Net Profit', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
        ),
        ...monthlyNetProfit.take(2).map((m) {
          final month = m as Map<String, dynamic>;
          return Card(
            margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            child: ListTile(
              title: Text(month['monthName']?.toString() ?? month['month']?.toString() ?? ''),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Revenue ₹${(month['revenue'] ?? 0).toString()} • Expenses ₹${(month['expenses'] ?? 0).toString()}'),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          height: 6,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(4),
                            gradient: LinearGradient(colors: [Colors.orange.shade400, Colors.green.shade500]),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text('${(month['profitMargin'] ?? 0).toStringAsFixed(1)}%'),
                    ],
                  )
                ],
              ),
              trailing: Text(
                '₹${(month['netProfit'] ?? 0).toString()}',
                style: TextStyle(
                  color: ((month['netProfit'] ?? 0) as num) >= 0 ? Colors.green : Colors.red,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          );
        }).toList(),

        Padding(
          padding: const EdgeInsets.all(12),
          child: const Text('Recent Days', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
        ),
        ...dailyProfit.take(7).map((d) {
          final day = d as Map<String, dynamic>;
          return Card(
            margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            child: Container(
              decoration: BoxDecoration(
                border: Border(
                  left: BorderSide(
                    color: ((day['totalProfit'] ?? 0) as num) >= 0 ? Colors.green : Colors.red,
                    width: 4,
                  ),
                ),
              ),
              child: ListTile(
                leading: Icon(
                  ((day['totalProfit'] ?? 0) as num) >= 0 ? Icons.trending_up : Icons.trending_down,
                  color: ((day['totalProfit'] ?? 0) as num) >= 0 ? Colors.green : Colors.red,
                ),
                title: Text(day['date']?.toString() ?? ''),
                subtitle: Text('Revenue ₹${(day['totalRevenue'] ?? 0)} • Cost ₹${(day['totalCost'] ?? 0)}'),
                trailing: Text(
                  '₹${(day['totalProfit'] ?? 0)}',
                  style: TextStyle(
                    color: ((day['totalProfit'] ?? 0) as num) >= 0 ? Colors.green : Colors.red,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ],
    );
  }

  Widget _statCard({
    required String title,
    required String value,
    String? subtitle,
    required IconData icon,
    required Color color,
  }) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [color.withOpacity(0.15), color.withOpacity(0.05)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: color.withOpacity(0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 12, color: Colors.black54)),
                  const SizedBox(height: 4),
                  Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(subtitle, style: TextStyle(fontSize: 11, color: color.withOpacity(0.8))),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
