import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:cookie_jar/cookie_jar.dart';

class ApiClient {
  final Dio dio;
  final CookieJar cookieJar;
  final String baseUrl;

  ApiClient(this.baseUrl)
      : dio = Dio(BaseOptions(baseUrl: baseUrl)),
        cookieJar = CookieJar() {
    dio.interceptors.add(CookieManager(cookieJar));
  }

  Future<Map<String, dynamic>?> login(String email, String password) async {
    // Fetch CSRF token required by NextAuth
    final csrf = await dio.get('/api/auth/csrf');
    if (csrf.statusCode != 200) {
      return null;
    }
    final token = (csrf.data as Map<String, dynamic>)['csrfToken'] as String?;
    if (token == null || token.isEmpty) {
      return null;
    }

    final resp = await dio.post(
      '/api/auth/callback/credentials',
      data: {
        'csrfToken': token,
        'email': email,
        'password': password,
        'redirect': 'false',
        'callbackUrl': baseUrl,
      },
      options: Options(
        contentType: Headers.formUrlEncodedContentType,
        followRedirects: false,
        validateStatus: (s) => s != null && s < 500,
      ),
    );

    // When redirect=false, NextAuth returns 200 with JSON; otherwise may return 302
    if (resp.statusCode == null || (resp.statusCode! >= 400)) {
      return null;
    }

    final session = await dio.get('/api/auth/session');
    if (session.statusCode == 200) {
      final data = session.data as Map<String, dynamic>;
      return data;
    }
    return null;
  }

  Future<List<dynamic>> getProducts() async {
    try {
      final pos = await dio.get('/api/pos/products');
      if (pos.statusCode == 200 && pos.data is List) {
        return (pos.data as List).cast<dynamic>();
      }
    } catch (_) {}
    try {
      final r = await dio.get('/api/inventory', queryParameters: {'limit': 10000});
      if (r.statusCode == 200 && r.data is Map<String, dynamic>) {
        final m = (r.data as Map<String, dynamic>);
        final list = (m['data'] as List?);
        if (list != null) return list.cast<dynamic>();
      }
    } catch (_) {}
    return [];
  }

  Future<List<dynamic>> searchProducts(String q) async {
    final r = await dio.get('/api/pos/search', queryParameters: {'q': q});
    return (r.data as List).cast<dynamic>();
  }

  Future<Response> createSale(Map<String, dynamic> payload) async {
    return await dio.post('/api/pos/sales', data: payload);
  }

  Future<Map<String, dynamic>> getBills({int page = 1, int limit = 20}) async {
    final r = await dio.get('/api/pos/sales', queryParameters: {'page': page, 'limit': limit});
    final data = r.data;
    if (data is Map<String, dynamic>) return data;
    // Fallback if API returns array directly
    return {
      'data': (data as List?)?.cast<dynamic>() ?? [],
      'pagination': {'page': page, 'totalPages': 1}
    };
  }

  Future<List<dynamic>> getInventory() async {
    final r = await dio.get('/api/inventory');
    final m = (r.data as Map<String, dynamic>);
    return (m['data'] as List).cast<dynamic>();
  }

  Future<List<dynamic>> getCustomers() async {
    final r = await dio.get('/api/customers');
    final m = (r.data as Map<String, dynamic>);
    return (m['data'] as List).cast<dynamic>();
  }

  Future<List<dynamic>> getCustomerPurchaseHistory(String customerId) async {
    final r = await dio.get('/api/customers/$customerId/purchase-history');
    if (r.data is List) {
      return (r.data as List).cast<dynamic>();
    }
    return [];
  }

  Future<Map<String, dynamic>> getPurchases({int page = 1, int limit = 20}) async {
    final r = await dio.get('/api/purchases', queryParameters: {'page': page, 'limit': limit});
    return (r.data as Map<String, dynamic>);
  }

  Future<Map<String, dynamic>> getLeaves({int page = 1, int limit = 20}) async {
    final r = await dio.get('/api/leaves', queryParameters: {'page': page, 'limit': limit});
    return (r.data as Map<String, dynamic>);
  }

  Future<List<dynamic>> getEmployees() async {
    final r = await dio.get('/api/employees');
    final m = (r.data as Map<String, dynamic>);
    return (m['data'] as List).cast<dynamic>();
  }

  Future<List<dynamic>> getAnalytics({required String type, int days = 30}) async {
    final r = await dio.get('/api/analytics', queryParameters: {'type': type, 'days': days});
    return (r.data as List).cast<dynamic>();
  }

  Future<Map<String, dynamic>> getAnalyticsSummary({int days = 30}) async {
    final r = await dio.get('/api/analytics/summary', queryParameters: {'days': days});
    if (r.data is Map<String, dynamic>) {
      return (r.data as Map<String, dynamic>);
    }
    return {};
  }

  Future<Map<String, dynamic>> getSettings() async {
    final r = await dio.get('/api/settings');
    if (r.data is Map<String, dynamic>) {
      return (r.data as Map<String, dynamic>);
    }
    return {};
  }
}
