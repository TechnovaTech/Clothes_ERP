import 'package:erp_flutter/api_client.dart';

class AuthService {
  final ApiClient client;
  Map<String, dynamic>? session;
  String? lastError;

  AuthService(this.client);

  Future<bool> login(String email, String password) async {
    try {
      final s = await client.login(email, password);
      if (s == null) {
        lastError = 'Unable to login. Check credentials or server availability.';
        return false;
      }
      session = s;
      lastError = null;
      return true;
    } catch (_) {
      lastError = 'Network error. Please verify connectivity to server.';
      return false;
    }
  }

  String? get tenantId {
    final u = session != null ? session!['user'] as Map<String, dynamic>? : null;
    return u != null ? u['tenantId'] as String? : null;
  }
}
