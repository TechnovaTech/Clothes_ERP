import 'package:flutter/material.dart';
import 'package:erp_flutter/api_client.dart';

class PurchasesScreen extends StatelessWidget {
  final ApiClient client;
  const PurchasesScreen({super.key, required this.client});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Purchases'));
  }
}
