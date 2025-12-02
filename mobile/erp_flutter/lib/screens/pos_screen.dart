import 'package:flutter/material.dart';
import 'package:erp_flutter/api_client.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'dart:async';

class POSScreen extends StatefulWidget {
  final ApiClient client;
  const POSScreen({super.key, required this.client});

  @override
  State<POSScreen> createState() => _POSScreenState();
}

class _POSScreenState extends State<POSScreen> {
  List<dynamic> products = [];
  List<Map<String, dynamic>> cart = [];
  String query = '';
  bool loading = false;
  String? error;
  num discount = 0;
  bool includeTax = true;
  String paymentMethod = 'cash';
  List<dynamic> employees = [];
  String selectedStaff = '';
  List<Map<String, dynamic>> heldBills = [];
  Map<String, dynamic> settings = {};
  String customerName = '';
  String customerPhone = '';
  String customerAddress = '';
  String customerGst = '';
  List<dynamic> customers = [];
  bool customersLoading = false;
  final TextEditingController customerNameController = TextEditingController();
  final TextEditingController customerPhoneController = TextEditingController();
  final TextEditingController customerAddressController = TextEditingController();
  final TextEditingController customerGstController = TextEditingController();
  int step = 0;
  static const double _hPadding = 12;
  static const double _vPadding = 8;
  final TextEditingController posSearchController = TextEditingController();
  Timer? _searchDebounce;

  Color _stockColor(int stock) {
    if (stock <= 0) return Colors.red;
    if (stock <= 5) return Colors.orange;
    return Colors.green;
  }

  Future<void> _saveCart() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('pos_cart', jsonEncode(cart));
    } catch (_) {}
  }

  Future<void> _loadCart() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString('pos_cart');
      if (raw != null && raw.isNotEmpty) {
        final decoded = jsonDecode(raw);
        if (decoded is List) {
          cart = decoded.map<Map<String, dynamic>>((e) => (e as Map).map((k, v) => MapEntry(k.toString(), v))).toList();
        }
      }
    } catch (_) {}
    if (!mounted) return;
    setState(() {});
  }

  num asNum(dynamic v) {
    if (v is num) return v;
    if (v == null) return 0;
    final n = num.tryParse(v.toString());
    return n ?? 0;
  }

  int asInt(dynamic v) {
    if (v is int) return v;
    if (v is num) return v.toInt();
    if (v == null) return 0;
    final n = int.tryParse(v.toString());
    return n ?? 0;
  }

  void updateQuantity(dynamic id, int newQuantity) {
    final idx = cart.indexWhere((e) => e['id'] == id);
    if (idx < 0) return;
    if (newQuantity <= 0) {
      cart.removeAt(idx);
    } else {
      cart[idx]['quantity'] = newQuantity;
      cart[idx]['total'] = newQuantity * asNum(cart[idx]['price']);
    }
    _saveCart();
    setState(() {});
  }

  void removeItem(dynamic id) {
    cart.removeWhere((e) => e['id'] == id);
    _saveCart();
    setState(() {});
  }

  @override
  void initState() {
    super.initState();
    loadProducts();
    loadEmployees();
    loadSettings();
    loadCustomers();
    _loadCart();
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    posSearchController.dispose();
    customerNameController.dispose();
    customerPhoneController.dispose();
    customerAddressController.dispose();
    customerGstController.dispose();
    super.dispose();
  }

  Future<void> loadProducts() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      List<dynamic> data;
      if (query.isEmpty) {
        data = await widget.client.getInventory();
      } else {
        data = await widget.client.searchProducts(query);
        if (data.isEmpty) {
          // Fallback search in inventory client-side
          final all = await widget.client.getInventory();
          data = all.where((p) {
            final m = p as Map<String, dynamic>;
            final q = query.toLowerCase();
            return (m['name']?.toString().toLowerCase().contains(q) ?? false) ||
                   (m['sku']?.toString().toLowerCase().contains(q) ?? false) ||
                   (m['barcode']?.toString().toLowerCase().contains(q) ?? false) ||
                   (m['category']?.toString().toLowerCase().contains(q) ?? false);
          }).toList();
        }
      }
      setState(() {
        products = data;
      });
    } catch (e) {
      setState(() {
        error = 'Failed to load products';
      });
    }
    setState(() {
      loading = false;
    });
  }

  Future<void> loadEmployees() async {
    try {
      employees = await widget.client.getEmployees();
    } catch (_) {}
  }

  Future<void> loadSettings() async {
    try {
      settings = await widget.client.getSettings();
      final tr = settings['taxRate'];
      final taxRateNum = tr is num ? tr : num.tryParse(tr?.toString() ?? '') ?? 0;
      includeTax = taxRateNum > 0;
    } catch (_) {}
    if (!mounted) return;
    setState(() {});
  }

  Future<void> loadCustomers() async {
    customersLoading = true;
    try {
      customers = await widget.client.getCustomersAll(limit: 1000);
    } catch (_) {
      customers = [];
    }
    customersLoading = false;
    if (!mounted) return;
    setState(() {});
  }

  String _pickField(Map<String, dynamic> c, List<String> keys) {
    for (final k in keys) {
      final v = c[k];
      if (v == null) continue;
      final s = v.toString().trim();
      if (s.isNotEmpty) return s;
    }
    // case-insensitive scan
    for (final entry in c.entries) {
      final key = entry.key.toString().toLowerCase();
      final val = entry.value?.toString().trim() ?? '';
      if (val.isEmpty) continue;
      for (final k in keys) {
        if (key == k.toLowerCase()) return val;
      }
    }
    return '';
  }

  void addToCart(Map<String, dynamic> p) {
    final idx = cart.indexWhere((e) => e['id'] == p['id']);
    if (idx >= 0) {
      cart[idx]['quantity'] = (cart[idx]['quantity'] as int) + 1;
      cart[idx]['total'] = (cart[idx]['quantity'] as int) * (cart[idx]['price'] as num);
    } else {
      final price = p['price'] is num ? (p['price'] as num) : num.tryParse(p['price']?.toString() ?? '') ?? 0;
      cart.add({
        'id': p['id'],
        'name': p['name'],
        'price': price,
        'quantity': 1,
        'total': price,
        'gstRate': null,
      });
    }
    _saveCart();
    setState(() {});
  }

  num get subtotal {
    return cart.fold<num>(0, (s, it) => s + asNum(it['total']));
  }

  num get discountAmount => (subtotal * discount) / 100;

  num get taxAmount {
    if (!includeTax) return 0;
    final discountPercent = discount;
    final defaultGst = asNum(settings['taxRate']);
    num sum = 0;
    for (final it in cart) {
      final itemSubtotal = asNum(it['price']) * asInt(it['quantity']);
      final itemDiscount = (itemSubtotal * discountPercent) / 100;
      final itemGstDyn = it['gstRate'];
      final itemGstRate = itemGstDyn is num ? itemGstDyn : defaultGst;
      sum += ((itemSubtotal - itemDiscount) * (itemGstRate / 100));
    }
    return sum;
  }

  num get totalAmount => subtotal - discountAmount + taxAmount;

  void holdBill() {
    if (cart.isEmpty) return;
    heldBills.add({
      'items': List<Map<String, dynamic>>.from(cart),
      'discount': discount,
    });
    cart.clear();
    discount = 0;
    _saveCart();
    setState(() {});
  }

  void clearCart() {
    cart.clear();
    discount = 0;
    _saveCart();
    setState(() {});
  }

  Future<void> submitSale() async {
    if (cart.isEmpty) return;
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final payload = {
        'items': cart,
        'customerName': customerName.isEmpty ? 'Walk-in Customer' : customerName,
        'customerPhone': customerPhone,
        'customerAddress': customerAddress,
        'customerGst': customerGst,
        'subtotal': subtotal,
        'discount': discount,
        'discountAmount': discountAmount,
        'tax': taxAmount,
        'cess': 0,
        'total': totalAmount,
        'paymentMethod': paymentMethod,
        'taxRate': (settings['taxRate'] ?? 0),
        'includeTax': includeTax,
        'includeCess': false,
        'staffMember': selectedStaff.isEmpty ? 'admin' : selectedStaff
      };
      final r = await widget.client.createSale(payload);
      if (!mounted) return;
      if (r.statusCode == 200 || r.statusCode == 201) {
        cart.clear();
        discount = 0;
        includeTax = true;
        paymentMethod = 'cash';
        selectedStaff = '';
        customerName = '';
        customerPhone = '';
        customerAddress = '';
        customerGst = '';
        customerNameController.clear();
        customerPhoneController.clear();
        customerAddressController.clear();
        customerGstController.clear();
        step = 0;
        _saveCart();
        setState(() {});
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sale created')));
      } else {
        setState(() {
          error = 'Failed to create sale';
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        error = 'Failed to create sale';
      });
    }
    setState(() {
      loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    Widget productList = loading
        ? const Center(child: CircularProgressIndicator())
        : products.isEmpty
            ? Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('No products found'),
                    const SizedBox(height: 8),
                    ElevatedButton(onPressed: loadProducts, child: const Text('Retry')),
                  ],
                ),
              )
            : LayoutBuilder(
                builder: (context, constraints) {
                  final isWide = constraints.maxWidth > 520;
                  if (isWide) {
                    return GridView.builder(
                      padding: const EdgeInsets.all(_hPadding),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 1.8,
                      ),
                      itemCount: products.length,
                      itemBuilder: (context, i) {
                        final p = products[i] as Map<String, dynamic>;
                        final name = p['name']?.toString() ?? '';
                        final priceNum = asNum(p['price'] ?? 0);
                        final stockInt = asInt(p['stock'] ?? p['quantity'] ?? 0);
                        final sColor = _stockColor(stockInt);
                        return Card(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700)),
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                      decoration: BoxDecoration(color: scheme.primary.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(16)),
                                      child: Row(children: [
                                        const Icon(Icons.currency_rupee, size: 16),
                                        const SizedBox(width: 4),
                                        Text(priceNum.toStringAsFixed(0), style: const TextStyle(fontWeight: FontWeight.w600)),
                                      ]),
                                    ),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                      decoration: BoxDecoration(color: sColor.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(16)),
                                      child: Row(children: [
                                        Icon(Icons.inventory_2, size: 16, color: sColor),
                                        const SizedBox(width: 4),
                                        Text('Stock $stockInt', style: TextStyle(color: sColor, fontWeight: FontWeight.w600)),
                                      ]),
                                    ),
                                  ],
                                ),
                                const Spacer(),
                                Align(
                                  alignment: Alignment.bottomRight,
                                  child: ElevatedButton.icon(
                                    onPressed: () => addToCart(p),
                                    icon: const Icon(Icons.add_circle_outline),
                                    label: const Text('Add'),
                                    style: ElevatedButton.styleFrom(visualDensity: VisualDensity.compact),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    );
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.all(_hPadding),
                    itemCount: products.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, i) {
                      final p = products[i] as Map<String, dynamic>;
                      final priceNum = asNum(p['price'] ?? 0);
                      final stockInt = asInt(p['stock'] ?? p['quantity'] ?? 0);
                      final sColor = _stockColor(stockInt);
                      return Card(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          title: Text(p['name']?.toString() ?? '', maxLines: 1, overflow: TextOverflow.ellipsis),
                          subtitle: Padding(
                            padding: const EdgeInsets.only(top: 6),
                            child: Row(
                              children: [
                                Text('₹ ${priceNum.toStringAsFixed(0)}', style: const TextStyle(color: Colors.black87)),
                                const SizedBox(width: 12),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(color: sColor.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)),
                                  child: Row(children: [
                                    Icon(Icons.inventory_2, size: 14, color: sColor),
                                    const SizedBox(width: 4),
                                    Text('Stock $stockInt', style: TextStyle(color: sColor)),
                                  ]),
                                ),
                              ],
                            ),
                          ),
                          trailing: IconButton(icon: const Icon(Icons.add_circle_outline), onPressed: () => addToCart(p)),
                          onTap: () => addToCart(p),
                        ),
                      );
                    },
                  );
                },
              );

  Widget details = ListView(
      padding: const EdgeInsets.only(bottom: 12),
      children: [
        Padding(
          padding: const EdgeInsets.all(_hPadding),
          child: Row(
            children: [
              OutlinedButton(onPressed: cart.isEmpty ? null : holdBill, child: const Text('Hold')),
              const SizedBox(width: 8),
              OutlinedButton(onPressed: cart.isEmpty ? null : clearCart, child: const Text('Clear')),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(color: scheme.primary.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(16)),
                child: Text('Items ${cart.length}', style: TextStyle(color: scheme.onSurface)),
              )
            ],
          ),
        ),
        ...cart.map((it) => Card(
              margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(it['name'].toString(), maxLines: 1, overflow: TextOverflow.ellipsis),
                        ),
                        Text('₹ ${it['total']}')
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Text('Qty ${it['quantity']} • ₹ ${it['price']}'),
                        const Spacer(),
                        DropdownButton<num?>(
                          value: it['gstRate'] as num?,
                          hint: const Text('GST'),
                          items: const [
                            DropdownMenuItem<num?>(value: null, child: Text('Inherit')),
                            DropdownMenuItem<num?>(value: 0, child: Text('0%')),
                            DropdownMenuItem<num?>(value: 5, child: Text('5%')),
                            DropdownMenuItem<num?>(value: 9, child: Text('9%')),
                            DropdownMenuItem<num?>(value: 12, child: Text('12%')),
                            DropdownMenuItem<num?>(value: 18, child: Text('18%')),
                            DropdownMenuItem<num?>(value: 28, child: Text('28%')),
                          ],
                          onChanged: (v) {
                            setState(() {
                              it['gstRate'] = v;
                            });
                          },
                        )
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.remove_circle_outline),
                          onPressed: () => updateQuantity(it['id'], asInt(it['quantity']) - 1),
                        ),
                        Text('${it['quantity']}'),
                        IconButton(
                          icon: const Icon(Icons.add_circle_outline),
                          onPressed: () => updateQuantity(it['id'], asInt(it['quantity']) + 1),
                        ),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(Icons.delete_outline),
                          onPressed: () => removeItem(it['id']),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            )),
        if (heldBills.isNotEmpty)
          SizedBox(
            height: 60,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: heldBills.length,
              itemBuilder: (context, i) {
                final hb = heldBills[i];
                return Padding(
                  padding: const EdgeInsets.all(6),
                  child: ActionChip(
                    label: Text('Held ${hb['items'].length}'),
                    onPressed: () {
                      cart = List<Map<String, dynamic>>.from(hb['items']);
                      discount = (hb['discount'] as num?) ?? 0;
                      heldBills.removeAt(i);
                      setState(() {});
                    },
                  ),
                );
              },
            ),
          ),
        Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Items'),
                          Text('${cart.length}')
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Subtotal'),
                          Text('₹ $subtotal', style: TextStyle(color: scheme.onSurface)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(labelText: 'Discount %', border: OutlineInputBorder()),
                              onChanged: (v) {
                                final d = num.tryParse(v) ?? 0;
                                discount = d;
                                setState(() {});
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          ChoiceChip(
                            label: Text('Include Tax${settings['taxRate'] != null ? ' (${settings['taxRate']}%)' : ''}'),
                            selected: includeTax,
                            onSelected: (v) { setState(() { includeTax = v; }); },
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Tax'),
                          Text('₹ $taxAmount', style: TextStyle(color: scheme.onSurfaceVariant)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Total'),
                          Text('₹ $totalAmount', style: TextStyle(fontWeight: FontWeight.w700, color: scheme.primary)),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                initialValue: selectedStaff.isEmpty ? null : selectedStaff,
                items: [
                  const DropdownMenuItem(value: 'admin', child: Text('Admin')),
                  ...employees.map((e) => DropdownMenuItem(
                        value: (e['employeeId'] ?? e['_id'] ?? '').toString(),
                        child: Text('${e['name'] ?? ''}'),
                      )),
                ],
                onChanged: (v) { selectedStaff = v ?? ''; },
                decoration: const InputDecoration(labelText: 'Staff', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextField(
                    controller: customerNameController,
                    decoration: const InputDecoration(labelText: 'Customer Name', border: OutlineInputBorder()),
                    onChanged: (v) { setState(() { customerName = v; }); },
                  ),
                  const SizedBox(height: 6),
                  Builder(builder: (context) {
                    final q = customerName.trim().toLowerCase();
                    if (q.isEmpty) return const SizedBox.shrink();
                    final matches = customers.where((raw) {
                      final c = raw as Map<String, dynamic>;
                      final name = (c['name'] ?? '').toString().toLowerCase();
                      final phone = (c['phone'] ?? '').toString().toLowerCase();
                      return name.contains(q) || phone.contains(q);
                    }).take(5).toList();
                    if (matches.isEmpty) return const SizedBox.shrink();
                    return Card(
                      margin: const EdgeInsets.only(top: 4),
                      child: ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: matches.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (context, i) {
                          final c = matches[i] as Map<String, dynamic>;
                          final name = (c['name'] ?? '').toString();
                          final phone = (c['phone'] ?? '').toString();
                          final spent = (c['totalSpent'] ?? 0).toString();
                          final orders = (c['orderCount'] ?? 0).toString();
                          return ListTile(
                            title: Text(name),
                            subtitle: Text(phone.isNotEmpty ? '$phone • Orders $orders' : 'Orders $orders'),
                            trailing: Text('₹ $spent'),
                            onTap: () {
                              customerName = name;
                              customerPhone = phone.split(',').map((p) => p.trim()).firstWhere((p) => p.isNotEmpty, orElse: () => '');
                              final address = _pickField(c, ['address', 'Address', 'addr', 'address1']);
                              final gst = _pickField(c, ['gst', 'GST', 'gstNo', 'gstno', 'gst_number', 'gstNumber', 'GST No']);
                              customerAddress = address;
                              customerGst = gst;
                              customerNameController.text = name;
                              customerPhoneController.text = customerPhone;
                              customerAddressController.text = customerAddress;
                              customerGstController.text = customerGst;
                              FocusScope.of(context).unfocus();
                              setState(() {});
                            },
                          );
                        },
                      ),
                    );
                  }),
                ],
              ),
              const SizedBox(height: 8),
              TextField(
                controller: customerPhoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(labelText: 'Phone Number', border: OutlineInputBorder()),
                onChanged: (v) { customerPhone = v; },
              ),
              const SizedBox(height: 8),
              TextField(
                controller: customerAddressController,
                decoration: const InputDecoration(labelText: 'Address', border: OutlineInputBorder()),
                maxLines: 2,
                onChanged: (v) { customerAddress = v; },
              ),
              const SizedBox(height: 8),
              TextField(
                controller: customerGstController,
                decoration: const InputDecoration(labelText: 'GST No.', border: OutlineInputBorder()),
                onChanged: (v) { customerGst = v; },
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  OutlinedButton(onPressed: () { setState(() { step = 0; }); }, child: const Text('Back')),
                  const Spacer(),
                  ElevatedButton(
                    onPressed: loading || cart.isEmpty ? null : () async {
                      if (selectedStaff.isEmpty && customerName.isEmpty && customerAddress.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter customer details or staff')));
                        return;
                      }
                      await showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        builder: (context) {
                          final inset = MediaQuery.of(context).viewInsets.bottom;
                          return Padding(
                            padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: inset + 16),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Card(
                                  child: Padding(
                                    padding: const EdgeInsets.all(12),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            const Text('Total'),
                                            Text('₹ $totalAmount'),
                                          ],
                                        ),
                                        const SizedBox(height: 8),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                          children: [
                                            ChoiceChip(
                                              label: const Text('Cash'),
                                              selected: paymentMethod == 'cash',
                                              onSelected: (_) { setState(() { paymentMethod = 'cash'; }); },
                                            ),
                                            ChoiceChip(
                                              label: const Text('Online'),
                                              selected: paymentMethod == 'online',
                                              onSelected: (_) { setState(() { paymentMethod = 'online'; }); },
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 16),
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton(
                                    onPressed: () { Navigator.pop(context); submitSale(); },
                                    child: Text(paymentMethod == 'online' ? 'Pay Online' : 'Pay Cash'),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      );
                    },
                    child: const Text('Proceed Payment'),
                  ),
                ],
              ),
            ],
          ),
        )
      ],
    );

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (step != 0) {
          setState(() { step = 0; });
          return;
        }
      },
      child: Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(_hPadding),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final isNarrow = constraints.maxWidth < 480;
              final searchField = TextField(
                controller: posSearchController,
                decoration: InputDecoration(
                  hintText: 'Search products',
                  border: const OutlineInputBorder(),
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: IconButton(icon: const Icon(Icons.clear), onPressed: () {
                    posSearchController.clear();
                    setState(() { query = ''; });
                    loadProducts();
                  }),
                ),
                onChanged: (v) {
                  query = v;
                  _searchDebounce?.cancel();
                  _searchDebounce = Timer(const Duration(milliseconds: 300), () { loadProducts(); });
                },
                onSubmitted: (_) => loadProducts(),
              );
              final cartButton = FilledButton.icon(
                onPressed: cart.isEmpty
                    ? null
                    : () async {
                        await showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          builder: (context) {
                            final inset = MediaQuery.of(context).viewInsets.bottom;
                            return StatefulBuilder(
                              builder: (context, setModalState) {
                                return Padding(
                                  padding: EdgeInsets.only(left: 12, right: 12, top: 12, bottom: inset + 12),
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                  const Text('Cart', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                                  const SizedBox(height: 8),
                                      Flexible(
                                        child: ListView.separated(
                                          shrinkWrap: true,
                                          itemCount: cart.length,
                                          separatorBuilder: (_, __) => const Divider(height: 1),
                                          itemBuilder: (context, i) {
                                            final it = cart[i];
                                            return ListTile(
                                              leading: CircleAvatar(child: Text('${asInt(it['quantity'])}')),
                                              title: Text(it['name'].toString(), maxLines: 1, overflow: TextOverflow.ellipsis),
                                              subtitle: Text('₹ ${asNum(it['price'])}'),
                                              trailing: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  IconButton(icon: const Icon(Icons.remove_circle_outline), onPressed: () { updateQuantity(it['id'], asInt(it['quantity']) - 1); setModalState((){}); }),
                                                  Text('${it['quantity']}'),
                                                  IconButton(icon: const Icon(Icons.add_circle_outline), onPressed: () { updateQuantity(it['id'], asInt(it['quantity']) + 1); setModalState((){}); }),
                                                  IconButton(icon: const Icon(Icons.delete_outline), onPressed: () { removeItem(it['id']); setModalState((){}); }),
                                                ],
                                              ),
                                            );
                                          },
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Card(
                                        child: Padding(
                                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                          child: Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              const Text('Subtotal'),
                                              Text('₹ $subtotal'),
                                            ],
                                          ),
                                        ),
                                      ),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text('Total ₹ $totalAmount'),
                                          ElevatedButton(onPressed: () { Navigator.pop(context); setState(() { step = 1; }); }, child: const Text('Checkout')),
                                        ],
                                      ),
                                    ],
                                  ),
                                );
                              },
                            );
                          },
                        );
                      },
                icon: const Icon(Icons.shopping_cart),
                label: Text('Cart (${cart.length})'),
              );
              if (isNarrow) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    searchField,
                    const SizedBox(height: 8),
                    Align(alignment: Alignment.centerRight, child: cartButton),
                  ],
                );
              }
              return Row(
                children: [
                  Expanded(child: searchField),
                  const SizedBox(width: 8),
                  cartButton,
                ],
              );
            },
          ),
        ),
        if (error != null) Padding(padding: const EdgeInsets.all(_hPadding), child: Text(error!, style: const TextStyle(color: Colors.red))),
        Expanded(child: step == 0 ? productList : details),
        if (step == 0)
          SafeArea(
            top: false,
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: _hPadding, vertical: _vPadding + 2),
              decoration: BoxDecoration(color: scheme.surface, boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 6)]),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final isNarrow = constraints.maxWidth < 420;
                  final holdBtn = OutlinedButton.icon(
                    onPressed: cart.isEmpty ? null : holdBill,
                    icon: const Icon(Icons.pause_circle_outline),
                    label: const Text('Hold'),
                  );
                  final clearBtn = OutlinedButton.icon(
                    onPressed: cart.isEmpty ? null : clearCart,
                    icon: const Icon(Icons.delete_sweep_outlined),
                    label: const Text('Clear'),
                  );
                  final subtotalChip = Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(color: scheme.primary.withValues(alpha: 0.10), borderRadius: BorderRadius.circular(18)),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.currency_rupee, size: 16),
                        const SizedBox(width: 4),
                        Flexible(child: Text('$subtotal', overflow: TextOverflow.ellipsis)),
                      ],
                    ),
                  );
                  final nextBtn = FilledButton.icon(
                    onPressed: cart.isEmpty ? null : () { setState(() { step = 1; }); },
                    icon: const Icon(Icons.arrow_right_alt),
                    label: const Text('Next'),
                  );
                  if (isNarrow) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(children: [holdBtn, const SizedBox(width: 8), clearBtn]),
                        const SizedBox(height: 8),
                        Row(children: [Flexible(child: subtotalChip), const Spacer(), nextBtn]),
                      ],
                    );
                  }
                  return Row(
                    children: [
                      holdBtn,
                      const SizedBox(width: 8),
                      clearBtn,
                      const Spacer(),
                      Flexible(child: subtotalChip),
                      const SizedBox(width: 8),
                      nextBtn,
                    ],
                  );
                },
              ),
            ),
          )
      ],
    ),
    );
  }
}
