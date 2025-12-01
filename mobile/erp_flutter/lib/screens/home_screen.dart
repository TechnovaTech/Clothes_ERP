import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:typed_data';
import 'package:erp_flutter/api_client.dart';
import 'package:erp_flutter/auth/auth_service.dart';
import 'package:erp_flutter/screens/pos_screen.dart';
import 'package:erp_flutter/screens/inventory_screen.dart';
import 'package:erp_flutter/screens/customers_screen.dart';
import 'package:erp_flutter/screens/bills_screen.dart';
import 'package:erp_flutter/screens/purchases_screen.dart';
import 'package:erp_flutter/screens/analytics_screen.dart';

class HomeScreen extends StatefulWidget {
  final ApiClient client;
  final AuthService auth;
  const HomeScreen({super.key, required this.client, required this.auth});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int index = 0;
  Map<String, dynamic> settings = {};
  Uint8List? logoBytes;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  final titles = const [
    'POS', 'Inventory', 'Customers', 'Bills', 'Purchases', 'Analytics'
  ];

  @override
  Widget build(BuildContext context) {
    final pages = [
      POSScreen(client: widget.client),
      InventoryScreen(client: widget.client),
      CustomersScreen(client: widget.client, auth: widget.auth),
      BillsScreen(client: widget.client, auth: widget.auth),
      PurchasesScreen(client: widget.client),
      AnalyticsScreen(client: widget.client),
    ];

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        final isDrawerOpen = _scaffoldKey.currentState?.isDrawerOpen == true;
        if (isDrawerOpen) {
          _scaffoldKey.currentState?.openEndDrawer();
          return;
        }
        if (index != 0) {
          setState(() { index = 0; });
          return;
        }
      },
      child: Scaffold(
        key: _scaffoldKey,
        appBar: AppBar(title: Text(titles[index])),
        drawer: Drawer(
          child: Column(
            children: [
            DrawerHeader(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Theme.of(context).colorScheme.primary.withValues(alpha: 0.12), Colors.transparent],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Builder(builder: (context) {
                    final logoUrl = '${widget.client.baseUrl}/logo.png';
                    return CircleAvatar(
                      radius: 24,
                      backgroundColor: Colors.grey.shade200,
                      backgroundImage: logoBytes != null
                          ? MemoryImage(logoBytes!)
                          : NetworkImage(logoUrl) as ImageProvider<Object>?,
                      child: (logoBytes == null)
                          ? ClipOval(child: Image.asset('android/app/src/logo.png', fit: BoxFit.cover))
                          : null,
                    );
                  }),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          (settings['storeName'] ?? '').toString().isNotEmpty ? settings['storeName'].toString() : 'Store',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          (settings['address'] ?? '').toString(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12, color: Colors.black54),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          [settings['phone'] ?? '', settings['email'] ?? ''].where((e) => e != null && e.toString().isNotEmpty).map((e) => e.toString()).join(' · '),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12, color: Colors.black54),
                        ),
                        const SizedBox(height: 6),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                children: [
                  _navTile(icon: Icons.point_of_sale, label: 'POS', selected: index == 0, onTap: () { setState(() { index = 0; }); Navigator.pop(context); }),
                  _navTile(icon: Icons.inventory, label: 'Inventory', selected: index == 1, onTap: () { setState(() { index = 1; }); Navigator.pop(context); }),
                  _navTile(icon: Icons.people, label: 'Customers', selected: index == 2, onTap: () { setState(() { index = 2; }); Navigator.pop(context); }),
                  _navTile(icon: Icons.receipt_long, label: 'Bills', selected: index == 3, onTap: () { setState(() { index = 3; }); Navigator.pop(context); }),
                  _navTile(icon: Icons.shopping_cart, label: 'Purchases', selected: index == 4, onTap: () { setState(() { index = 4; }); Navigator.pop(context); }),
                  _navTile(icon: Icons.bar_chart, label: 'Analytics', selected: index == 5, onTap: () { setState(() { index = 5; }); Navigator.pop(context); }),
                ],
              ),
            ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                child: InkWell(
                  onTap: _openTechnova,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.public, size: 16, color: Theme.of(context).colorScheme.primary),
                      const SizedBox(width: 6),
                      Text(
                        'Powered by Technova Technologies',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.primary),
                      ),
                      const SizedBox(width: 6),
                      Icon(Icons.open_in_new, size: 14, color: Theme.of(context).colorScheme.primary),
                    ],
                  ),
                ),
              ),
            )
          ],
        ),
      ),
      body: pages[index],
    ),
    );
  }

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    try {
      settings = await widget.client.getSettings();
    } catch (_) {
      settings = {};
    }
    await _loadLogoBytes();
    if (!mounted) return;
    setState(() {});
  }

  Future<void> _loadLogoBytes() async {
    final candidates = [
      '${widget.client.baseUrl}/logo.png',
      '${widget.client.baseUrl}/public/logo.png',
    ];
    Uint8List? found;
    for (final url in candidates) {
      try {
        final resp = await widget.client.dio.get(url, options: Options(responseType: ResponseType.bytes, headers: {'Accept': 'image/*'}));
        if (resp.statusCode == 200 && resp.data is List<int>) {
          found = Uint8List.fromList((resp.data as List<int>));
          break;
        }
      } catch (_) {}
    }
    logoBytes = found;
  }

  Widget _navTile({required IconData icon, required String label, required bool selected, required VoidCallback onTap}) {
    final cs = Theme.of(context).colorScheme;
    return ListTile(
      leading: Icon(icon, color: selected ? cs.primary : null),
      title: Text(label, style: TextStyle(color: selected ? cs.primary : null, fontWeight: selected ? FontWeight.w600 : FontWeight.normal)),
      selected: selected,
      selectedTileColor: cs.primary.withValues(alpha: 0.08),
      onTap: onTap,
      trailing: Icon(Icons.chevron_right, color: selected ? cs.primary : Colors.black26),
      dense: true,
    );
  }

  Future<void> _openTechnova() async {
    final url = Uri.parse('https://www.technovatechnologies.com/');
    await launchUrl(url, mode: LaunchMode.externalApplication);
  }
}
