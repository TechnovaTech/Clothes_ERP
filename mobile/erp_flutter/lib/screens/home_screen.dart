import 'package:flutter/material.dart';
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

  final titles = const [
    'POS', 'Inventory', 'Customers', 'Bills', 'Purchases', 'Analytics'
  ];

  @override
  Widget build(BuildContext context) {
    final pages = [
      POSScreen(client: widget.client),
      InventoryScreen(client: widget.client),
      CustomersScreen(client: widget.client),
      BillsScreen(client: widget.client, auth: widget.auth),
      PurchasesScreen(client: widget.client),
      AnalyticsScreen(client: widget.client),
    ];

    return Scaffold(
      appBar: AppBar(title: Text(titles[index])),
      drawer: Drawer(
        child: Column(
          children: [
            const DrawerHeader(
              child: ListTile(
                title: Text('ERP'),
                subtitle: Text('Tenant App'),
              ),
            ),
            Expanded(
              child: ListView(
                children: [
                  ListTile(leading: const Icon(Icons.point_of_sale), title: const Text('POS'), selected: index == 0, onTap: () { setState(() { index = 0; }); Navigator.pop(context); }),
                  ListTile(leading: const Icon(Icons.inventory), title: const Text('Inventory'), selected: index == 1, onTap: () { setState(() { index = 1; }); Navigator.pop(context); }),
                  ListTile(leading: const Icon(Icons.people), title: const Text('Customers'), selected: index == 2, onTap: () { setState(() { index = 2; }); Navigator.pop(context); }),
                  ListTile(leading: const Icon(Icons.receipt_long), title: const Text('Bills'), selected: index == 3, onTap: () { setState(() { index = 3; }); Navigator.pop(context); }),
                  ListTile(leading: const Icon(Icons.shopping_cart), title: const Text('Purchases'), selected: index == 4, onTap: () { setState(() { index = 4; }); Navigator.pop(context); }),
                  ListTile(leading: const Icon(Icons.bar_chart), title: const Text('Analytics'), selected: index == 5, onTap: () { setState(() { index = 5; }); Navigator.pop(context); }),
                ],
              ),
            ),
          ],
        ),
      ),
      body: pages[index],
    );
  }
}
