import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:erp_flutter/api_client.dart';
import 'package:erp_flutter/auth/auth_service.dart';
import 'package:erp_flutter/config.dart';
import 'package:erp_flutter/screens/home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  bool loading = false;
  String? error;
  bool rememberMe = false;

  @override
  void initState() {
    super.initState();
    _loadSaved();
  }

  Future<void> _loadSaved() async {
    final prefs = await SharedPreferences.getInstance();
    rememberMe = prefs.getBool('remember_me') ?? false;
    if (rememberMe) {
      emailController.text = prefs.getString('email') ?? '';
      passwordController.text = prefs.getString('password') ?? '';
      if (emailController.text.isNotEmpty && passwordController.text.isNotEmpty) {
        submit();
      }
    }
    if (!mounted) return;
    setState(() {});
  }

  void submit() async {
    setState(() {
      loading = true;
      error = null;
    });
    final client = ApiClient(AppConfig.defaultBaseUrl);
    final auth = AuthService(client);
    final ok = await auth.login(emailController.text.trim(), passwordController.text);
    if (!mounted) return;
    if (ok && auth.tenantId != null) {
      if (rememberMe) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool('remember_me', true);
        await prefs.setString('email', emailController.text.trim());
        await prefs.setString('password', passwordController.text);
      } else {
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove('remember_me');
        await prefs.remove('email');
        await prefs.remove('password');
      }
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => HomeScreen(client: client, auth: auth)),
      );
    } else {
      setState(() {
        error = 'Login failed';
      });
    }
    setState(() {
      loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 380),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const FlutterLogo(size: 72),
                    const SizedBox(height: 12),
                    const Text('Retailians', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 16),
                    Card(
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade300)),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          children: [
                            TextField(
                              controller: emailController,
                              decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: passwordController,
                              decoration: const InputDecoration(labelText: 'Password', border: OutlineInputBorder()),
                              obscureText: true,
                            ),
                            const SizedBox(height: 8),
                            CheckboxListTile(
                              value: rememberMe,
                              onChanged: (v) { setState(() { rememberMe = v ?? false; }); },
                              title: const Text('Remember me'),
                              controlAffinity: ListTileControlAffinity.leading,
                              contentPadding: EdgeInsets.zero,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (error != null) Text(error!, style: const TextStyle(color: Colors.red)),
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: loading ? null : submit,
                        child: loading
                            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                            : const Text('Login'),
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
