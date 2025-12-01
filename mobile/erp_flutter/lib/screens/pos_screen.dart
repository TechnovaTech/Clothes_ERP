import 'package:flutter/material.dart';
import 'package:erp_flutter/api_client.dart';

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
    setState(() {});
  }

  void removeItem(dynamic id) {
    cart.removeWhere((e) => e['id'] == id);
    setState(() {});
  }

  @override
  void initState() {
    super.initState();
    loadProducts();
    loadEmployees();
    loadSettings();
    loadCustomers();
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
    setState(() {});
  }

  void clearCart() {
    cart.clear();
    discount = 0;
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
            : ListView.separated(
                padding: const EdgeInsets.all(12),
                itemCount: products.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, i) {
                  final p = products[i] as Map<String, dynamic>;
                  return Card(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      title: Text(p['name']?.toString() ?? '', maxLines: 1, overflow: TextOverflow.ellipsis),
                      subtitle: Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Row(
                          children: [
                            Text('₹ ${(p['price'] ?? 0).toString()}', style: const TextStyle(color: Colors.black87)),
                            const SizedBox(width: 12),
                            Text('Stock ${(p['stock'] ?? 0).toString()}', style: const TextStyle(color: Colors.black54)),
                          ],
                        ),
                      ),
                      trailing: IconButton(icon: const Icon(Icons.add_circle_outline), onPressed: () => addToCart(p)),
                      onTap: () => addToCart(p),
                    ),
                  );
                },
              );

    Widget details = ListView(
      padding: const EdgeInsets.only(bottom: 12),
      children: [
        Padding(
          padding: const EdgeInsets.all(8),
          child: Row(
            children: [
              OutlinedButton(onPressed: cart.isEmpty ? null : holdBill, child: const Text('Hold')),
              const SizedBox(width: 8),
              OutlinedButton(onPressed: cart.isEmpty ? null : clearCart, child: const Text('Clear')),
              const Spacer(),
              Text('Items ${cart.length}')
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
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Subtotal'),
                  Text('₹ $subtotal'),
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
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Row(
                    children: [
                      Text('Include Tax${settings['taxRate'] != null ? ' (${settings['taxRate']}%)' : ''}'),
                      const SizedBox(width: 8),
                      Switch(value: includeTax, onChanged: (v) { setState(() { includeTax = v; }); }),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Tax'),
                  Text('₹ $taxAmount'),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Total'),
                  Text('₹ $totalAmount'),
                ],
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
                                const SizedBox(height: 16),
                                ElevatedButton(onPressed: () { Navigator.pop(context); submitSale(); }, child: const Text('Process Payment')),
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

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(8),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  decoration: const InputDecoration(hintText: 'Search products', prefixIcon: Icon(Icons.search), border: OutlineInputBorder()),
                  onChanged: (v) {
                    query = v;
                  },
                  onSubmitted: (_) => loadProducts(),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(onPressed: loadProducts, child: const Text('Search'))
              ,
              const SizedBox(width: 8),
              OutlinedButton(
                onPressed: cart.isEmpty
                    ? null
                    : () async {
                        await showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          builder: (context) {
                            final inset = MediaQuery.of(context).viewInsets.bottom;
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
                                      separatorBuilder: (_, __) => const SizedBox(height: 6),
                                      itemBuilder: (context, i) {
                                        final it = cart[i];
                                        return ListTile(
                                          title: Text(it['name'].toString(), maxLines: 1, overflow: TextOverflow.ellipsis),
                                          subtitle: Text('₹ ${asNum(it['price'])}'),
                                          trailing: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              IconButton(icon: const Icon(Icons.remove_circle_outline), onPressed: () { updateQuantity(it['id'], asInt(it['quantity']) - 1); }),
                                              Text('${it['quantity']}'),
                                              IconButton(icon: const Icon(Icons.add_circle_outline), onPressed: () { updateQuantity(it['id'], asInt(it['quantity']) + 1); }),
                                              IconButton(icon: const Icon(Icons.delete_outline), onPressed: () { removeItem(it['id']); }),
                                            ],
                                          ),
                                        );
                                      },
                                    ),
                                  ),
                                  const SizedBox(height: 8),
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
                child: Text('Cart (${cart.length})'),
              )
            ],
          ),
        ),
        if (error != null) Padding(padding: const EdgeInsets.all(8), child: Text(error!, style: const TextStyle(color: Colors.red))),
        Expanded(child: step == 0 ? productList : details),
        if (step == 0)
          SafeArea(
            top: false,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(color: Colors.grey.shade100, boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 6)]),
              child: Row(
                children: [
                  OutlinedButton(onPressed: cart.isEmpty ? null : holdBill, child: const Text('Hold')),
                  const SizedBox(width: 8),
                  OutlinedButton(onPressed: cart.isEmpty ? null : clearCart, child: const Text('Clear')),
                  const Spacer(),
                  Flexible(child: Text('Subtotal ₹ $subtotal', overflow: TextOverflow.ellipsis)),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: cart.isEmpty ? null : () { setState(() { step = 1; }); },
                    style: ElevatedButton.styleFrom(visualDensity: VisualDensity.compact),
                    child: const Text('Next'),
                  ),
                ],
              ),
            ),
          )
      ],
    );
  }
}
