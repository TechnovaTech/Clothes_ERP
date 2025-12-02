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
  static const double _hPadding = 12;
  static const double _vPadding = 8;

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
      padding: const EdgeInsets.symmetric(vertical: _vPadding),
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: _hPadding),
          child: _heroHeader(
            scheme: scheme,
            title: 'Analytics',
            days: days,
            totalRevenue: (summary['totalRevenue'] ?? 0) as num,
            totalProfit: (summary['totalProfit'] ?? 0) as num,
            profitMargin: profitMargin,
            onChangeDays: (v) async {
              if (v == null) return;
              setState(() { days = v; loading = true; });
              await load();
            },
          ),
        ),

        Padding(
          padding: const EdgeInsets.only(left: _hPadding),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _kpiCard(
                  color: scheme.primary,
                  icon: Icons.trending_up,
                  title: "Today's Sales",
                  value: '₹${(todaysSales['totalSales'] ?? 0).toString()}',
                  subtitle: salesGrowth != 0 ? '${salesGrowth.toStringAsFixed(1)}% vs last' : null,
                ),
                _kpiCard(
                  color: ((todaysProfit['totalProfit'] ?? 0) as num) >= 0 ? scheme.tertiary : scheme.error,
                  icon: Icons.stacked_line_chart,
                  title: "Today's Profit",
                  value: '₹${(todaysProfit['totalProfit'] ?? 0).toString()}',
                  subtitle: profitGrowth != 0 ? '${profitGrowth.toStringAsFixed(1)}% vs last' : null,
                ),
                _kpiCard(
                  color: scheme.secondary,
                  icon: Icons.receipt_long,
                  title: "Today's Orders",
                  value: (todaysSales['totalTransactions'] ?? 0).toString(),
                  subtitle: 'Avg ₹${((summary['totalRevenue'] ?? 0) is num && (summary['totalTransactions'] ?? 0) is num && (summary['totalTransactions'] ?? 0) != 0)
                      ? (((summary['totalRevenue'] ?? 0) as num) / ((summary['totalTransactions'] ?? 0) as num)).toStringAsFixed(0)
                      : '0'} per sale',
                ),
                _kpiCard(
                  color: scheme.primary,
                  icon: Icons.currency_rupee,
                  title: 'Total Revenue',
                  value: '₹${(summary['totalRevenue'] ?? 0).toString()}',
                ),
                _kpiCard(
                  color: scheme.tertiary,
                  icon: Icons.payments,
                  title: 'Total Profit',
                  value: '₹${(summary['totalProfit'] ?? 0).toString()}',
                ),
                _kpiCard(
                  color: scheme.secondary,
                  icon: Icons.shopping_bag,
                  title: 'Total Expenses',
                  value: '₹${totalExpenses.toString()}',
                  subtitle: 'Business expenses',
                ),
                _kpiCard(
                  color: profitMargin > 20 ? scheme.tertiary : scheme.error,
                  icon: Icons.percent,
                  title: 'Profit Margin',
                  value: '${profitMargin.toStringAsFixed(1)}%',
                  subtitle: profitMargin > 20 ? 'Healthy' : 'Monitor',
                ),
              ].map((w) => Padding(padding: const EdgeInsets.only(right: 12), child: w)).toList(),
            ),
          ),
        ),

        Padding(
          padding: const EdgeInsets.fromLTRB(_hPadding, 16, _hPadding, 8),
          child: Text('Monthly Net Profit', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: scheme.onSurface)),
        ),
        ...monthlyNetProfit.take(2).map((m) {
          final month = m as Map<String, dynamic>;
          return Card(
            margin: const EdgeInsets.symmetric(horizontal: _hPadding, vertical: 8),
            child: ListTile(
              title: Text(month['monthName']?.toString() ?? month['month']?.toString() ?? ''),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Revenue ₹${(month['revenue'] ?? 0).toString()} • Expenses ₹${(month['expenses'] ?? 0).toString()}', style: TextStyle(color: scheme.onSurfaceVariant)),
                  const SizedBox(height: 6),
                  Text('${(month['profitMargin'] ?? 0).toStringAsFixed(1)}%'),
                ],
              ),
              trailing: Text(
                '₹${(month['netProfit'] ?? 0).toString()}',
                style: TextStyle(
                  color: ((month['netProfit'] ?? 0) as num) >= 0 ? scheme.tertiary : scheme.error,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          );
        }).toList(),

        Padding(
          padding: const EdgeInsets.fromLTRB(_hPadding, 16, _hPadding, 8),
          child: Text('Recent Days', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: scheme.onSurface)),
        ),
        ...dailyProfit.take(7).map((d) {
          final day = d as Map<String, dynamic>;
          return Card(
            margin: const EdgeInsets.symmetric(horizontal: _hPadding, vertical: 8),
            child: ListTile(
              leading: Icon(
                ((day['totalProfit'] ?? 0) as num) >= 0 ? Icons.trending_up : Icons.trending_down,
                color: ((day['totalProfit'] ?? 0) as num) >= 0 ? scheme.tertiary : scheme.error,
              ),
              title: Text(day['date']?.toString() ?? ''),
              subtitle: Text('Revenue ₹${(day['totalRevenue'] ?? 0)} • Cost ₹${(day['totalCost'] ?? 0)}', style: TextStyle(color: scheme.onSurfaceVariant)),
              trailing: Text(
                '₹${(day['totalProfit'] ?? 0)}',
                style: TextStyle(
                  color: ((day['totalProfit'] ?? 0) as num) >= 0 ? scheme.tertiary : scheme.error,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          );
        }).toList(),
      ],
    );
  }

  

  Widget _kpiCard({
    required Color color,
    required IconData icon,
    required String title,
    required String value,
    String? subtitle,
  }) {
    return SizedBox(
      width: 220,
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            border: Border(
              top: BorderSide(color: color, width: 3),
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 2),
                    Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700), maxLines: 1, overflow: TextOverflow.ellipsis),
                    if (subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(subtitle, style: TextStyle(fontSize: 11, color: color.withValues(alpha: 0.8)), maxLines: 1, overflow: TextOverflow.ellipsis),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _heroHeader({
    required ColorScheme scheme,
    required String title,
    required int days,
    required num totalRevenue,
    required num totalProfit,
    required num profitMargin,
    required ValueChanged<int?> onChangeDays,
  }) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Container(
        padding: const EdgeInsets.all(16),
        color: scheme.primaryContainer,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(child: Text(title, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: scheme.onPrimaryContainer))),
                DropdownButton<int>(
                  value: days,
                  dropdownColor: scheme.surface,
                  items: const [
                    DropdownMenuItem(value: 7, child: Text('Last 7 days')),
                    DropdownMenuItem(value: 30, child: Text('Last 30 days')),
                    DropdownMenuItem(value: 90, child: Text('Last 90 days')),
                  ],
                  onChanged: onChangeDays,
                )
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(child: _heroStat(label: 'Revenue', value: '₹${totalRevenue.toStringAsFixed(0)}', color: scheme.primary, textColor: scheme.onPrimaryContainer)),
                Expanded(child: _heroStat(label: 'Profit', value: '₹${totalProfit.toStringAsFixed(0)}', color: scheme.tertiary, textColor: scheme.onPrimaryContainer)),
                Expanded(child: _heroStat(label: 'Margin', value: '${profitMargin.toStringAsFixed(1)}%', color: profitMargin > 20 ? scheme.tertiary : scheme.error, textColor: scheme.onPrimaryContainer)),
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _heroStat({
    required String label,
    required String value,
    required Color color,
    required Color textColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 12, color: textColor.withValues(alpha: 0.8))),
          const SizedBox(height: 2),
          Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: textColor)),
        ],
      ),
    );
  }
}
