import 'package:flutter/material.dart';
import 'package:erp_flutter/api_client.dart';

class SettingsScreen extends StatelessWidget {
  final ApiClient client;
  const SettingsScreen({super.key, required this.client});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Settings'));
  }
}
