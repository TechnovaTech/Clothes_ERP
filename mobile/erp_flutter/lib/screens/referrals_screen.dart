import 'package:flutter/material.dart';
import 'package:erp_flutter/api_client.dart';

class ReferralsScreen extends StatelessWidget {
  final ApiClient client;
  const ReferralsScreen({super.key, required this.client});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Referrals - coming soon'));
  }
}
