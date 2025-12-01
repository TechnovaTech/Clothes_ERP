import 'package:erp_flutter/api_client.dart';

class AuthService {
  final ApiClient client;
  Map<String, dynamic>? session;

  AuthService(this.client);

  Future<bool> login(String email, String password) async {
    final s = await client.login(email, password);
    if (s == null) {
      return false;
    }
    session = s;
    return true;
  }

  String? get tenantId {
    final u = session != null ? session!['user'] as Map<String, dynamic>? : null;
    return u != null ? u['tenantId'] as String? : null;
  }
}
