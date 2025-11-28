"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Search,
  ShoppingCart,
  Scan,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  User,
  Printer,
  Download,
  Pause,
  X,
  UserPlus,
  Edit,
} from "lucide-react"
import { showToast } from "@/lib/toast"
import { FeatureGuard } from "@/components/feature-guard"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { useLanguage } from "@/lib/language-context"
import { translateName } from "@/lib/name-translator"
import { formatDateToDDMMYYYY } from "@/lib/date-utils"

interface Product {
  id: string
  name: string
  sku: string
  price: number
  barcode: string
  category: string
  size?: string
  color?: string
  stock: number
  image?: string
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  total: number
  gstRate?: number
}



export default function POSPage() {
  const { t, language } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [tenantFields, setTenantFields] = useState<any[]>([])
  const [settings, setSettings] = useState({ 
    storeName: 'Store', 
    taxRate: 10,
    cessRate: 0, 
    currency: 'INR',
    address: '',
    phone: '',
    gst: '',
    email: '',
    terms: '',
    whatsappMessage: '',
    deletePassword: 'admin123',
    billFormat: 'professional',
    logo: ''
  })
  const [customerName, setCustomerName] = useState<string>("")
  const [customerPhone, setCustomerPhone] = useState<string>("")
  const [discount, setDiscount] = useState(0)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isBillModalOpen, setIsBillModalOpen] = useState(false)
  const [heldBills, setHeldBills] = useState<any[]>([])
  const [completedSale, setCompletedSale] = useState<any>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash')
  const [customers, setCustomers] = useState<any[]>([])
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState<string>('')
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
  const [customerFormData, setCustomerFormData] = useState({ name: '', phone: '', email: '', address: '' })
  const [employees, setEmployees] = useState<any[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>('')
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [barcodeBuffer, setBarcodeBuffer] = useState('')
  const [lastKeyTime, setLastKeyTime] = useState(0)
  const [includeTax, setIncludeTax] = useState(true)
  const [includeCess, setIncludeCess] = useState(true)
  const [gstRateOverride, setGstRateOverride] = useState(false)
  const [billGstRate, setBillGstRate] = useState<number | ''>('')
  const [whatsappStatus, setWhatsappStatus] = useState<any>(null)
  const [qrCode, setQrCode] = useState<string>('')


  // Fetch settings
  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    }
  }

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      if (response.ok) {
        const result = await response.json()
        const data = result.data || result || []
        setEmployees(data)
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    }
  }

  // Check WhatsApp status
  const checkWhatsAppStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/status')
      const data = await response.json()
      setWhatsappStatus(data)
      
      // Always try to get QR if not ready
      if (!data.ready) {
        try {
          const qrResponse = await fetch('/api/whatsapp/status', { method: 'POST' })
          const qrData = await qrResponse.json()
          if (qrData.qr) {
            setQrCode(qrData.qr)
          }
        } catch (qrError) {
          console.log('QR fetch failed, retrying...')
        }
      }
    } catch (error) {
      console.log('Status check failed, service may be starting...')
      // Don't set error immediately, let it retry
    }
  }



  // Fetch tenant fields
  const fetchTenantFields = async () => {
    try {
      const response = await fetch('/api/tenant-fields')
      if (response.ok) {
        const data = await response.json()
        setTenantFields(data.fields || [])
      }
    } catch (error) {
      console.error('Failed to fetch tenant fields:', error)
    }
  }

  // Fetch products from inventory API
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/inventory?limit=10000')
      if (response.ok) {
        const result = await response.json()
        const data = result.data || result || []
        setProducts(data)
        setFilteredProducts(data)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Search products locally
  const searchProducts = (query: string) => {
    if (!query.trim()) {
      setFilteredProducts(products)
      return
    }
    
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.sku.toLowerCase().includes(query.toLowerCase()) ||
      (product.barcode && product.barcode.toLowerCase().includes(query.toLowerCase())) ||
      product.category.toLowerCase().includes(query.toLowerCase()) ||
      ((product as any).brand && (product as any).brand.toLowerCase().includes(query.toLowerCase()))
    )
    setFilteredProducts(filtered)
  }

  useEffect(() => {
    fetchTenantFields()
    fetchProducts()
    fetchSettings()
    fetchCustomers()
    fetchEmployees()
    checkWhatsAppStatus()
    
    const interval = setInterval(checkWhatsAppStatus, 5000)
    
    // Listen for physical barcode scanner input
    const handleKeyPress = (e: KeyboardEvent) => {
      const currentTime = Date.now()
      const timeDiff = currentTime - lastKeyTime
      
      // If time between keystrokes is very short (< 50ms), it's likely a barcode scanner
      if (timeDiff < 50 && e.key !== 'Enter') {
        setBarcodeBuffer(prev => prev + e.key)
        setLastKeyTime(currentTime)
        e.preventDefault()
      } else if (e.key === 'Enter' && barcodeBuffer.length > 3) {
        // Process the scanned barcode
        handleBarcodeScan(barcodeBuffer)
        setBarcodeBuffer('')
        e.preventDefault()
      } else if (timeDiff > 100) {
        // Reset buffer if too much time has passed
        setBarcodeBuffer(e.key === 'Enter' ? '' : e.key)
        setLastKeyTime(currentTime)
      }
    }
    
    // Add event listener for barcode scanner
    document.addEventListener('keypress', handleKeyPress)
    
    return () => {
      document.removeEventListener('keypress', handleKeyPress)
      clearInterval(interval)
    }
  }, [lastKeyTime, barcodeBuffer])

  useEffect(() => {
    searchProducts(searchTerm)
  }, [searchTerm, products])

  // Get field value using tenant configuration
  const getFieldValue = (product: any, fieldName: string) => {
    const field = tenantFields.find(f => f.name === fieldName)
    if (!field) return null
    
    // Try different field name variations
    return product[fieldName] || product[fieldName.toLowerCase()] || product[fieldName.replace(/\s+/g, '_').toLowerCase()] || null
  }

  const addToCart = (product: any) => {
    const currentStock = product.stock || 0
    const existingItem = cart.find((item) => item.id === product.id)
    const currentCartQty = existingItem ? existingItem.quantity : 0
    
    // Check stock availability
    if (currentStock <= 0) {
      showToast.error(`${t('outOfStock')}: ${product.name || 'Product'}`)
      return
    }
    
    if (currentCartQty >= currentStock) {
      showToast.error(`${t('insufficientStock')}: ${t('available')} ${currentStock}`)
      return
    }
    
    const displayPrice = product.price
    // Get product name from configured fields or fallback to productname
    let productName = 'Unnamed Product'
    if (tenantFields.length === 0) {
      productName = (product as any).productname || product.name || 'Unnamed Product'
    } else {
      const nameField = tenantFields.find(f => 
        f.name.toLowerCase() === 'medicine' || 
        f.name.toLowerCase() === 'product name' ||
        f.name.toLowerCase() === 'name' ||
        (f.name.toLowerCase().includes('name') && !f.name.toLowerCase().includes('id'))
      )
      productName = nameField ? getFieldValue(product, nameField.name) || (product as any).productname || product.name : (product as any).productname || product.name || 'Unnamed Product'
    }
    
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * displayPrice }
            : item,
        ),
      )
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          name: productName,
          price: displayPrice,
          quantity: 1,
          total: displayPrice,
        },
      ])
    }
  }

  // Handle barcode scan
  const handleBarcodeScan = async (barcode: string) => {
    try {
      // Search for product by barcode
      const product = products.find(p => p.barcode === barcode)
      
      if (product) {
        if ((product.stock || 0) <= 0) {
          showToast.error(`${t('outOfStock')}: ${product.name}`)
          return
        }
        addToCart(product)
        showToast.success(`${t('added')} ${product.name} ${t('toCart')}`)
      } else {
        // Try to fetch from API if not in current products list
        const response = await fetch(`/api/pos/search?q=${encodeURIComponent(barcode)}`)
        if (response.ok) {
          const searchResults = await response.json()
          const foundProduct = searchResults.find((p: any) => p.barcode === barcode)
          
          if (foundProduct) {
            if ((foundProduct.stock || 0) <= 0) {
              showToast.error(`${t('outOfStock')}: ${foundProduct.name}`)
              return
            }
            addToCart(foundProduct)
            showToast.success(`${t('added')} ${foundProduct.name} ${t('toCart')}`)
          } else {
            showToast.error(`${t('productNotFound')}: ${barcode}`)
          }
        } else {
          showToast.error(`${t('productNotFound')}: ${barcode}`)
        }
      }
    } catch (error) {
      console.error('Barcode scan error:', error)
      showToast.error(t('errorProcessingBarcode'))
    }
  }

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(cart.filter((item) => item.id !== id))
    } else {
      // Check stock availability for the product
      const product = products.find(p => p.id === id)
      if (product && newQuantity > (product.stock || 0)) {
        showToast.error(`${t('insufficientStock')}: ${t('available')} ${product.stock || 0}`)
        return
      }
      
      setCart(
        cart.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity, total: newQuantity * item.price } : item,
        ),
      )
    }
  }

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id))
  }

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.total) || 0), 0)
  const discountPercent = Number(discount) || 0
  const taxRatePercent = Number(gstRateOverride ? (billGstRate === '' ? settings.taxRate : billGstRate) : settings.taxRate) || 0
  const cessRatePercent = Number(settings.cessRate) || 0
  const discountAmount = (subtotal * discountPercent) / 100
  
  // Calculate tax per item based on individual GST rates
  const tax = includeTax ? cart.reduce((sum, item) => {
    const itemGstRate = item.gstRate !== undefined ? item.gstRate : taxRatePercent
    const itemSubtotal = Number(item.total) || 0
    const itemDiscount = (itemSubtotal * discountPercent) / 100
    return sum + ((itemSubtotal - itemDiscount) * (itemGstRate / 100))
  }, 0) : 0
  
  const cess = includeCess ? (subtotal - discountAmount) * (cessRatePercent / 100) : 0
  const total = subtotal - discountAmount + tax + cess

  const holdBill = () => {
    if (cart.length > 0) {
      const billId = `HOLD-${Date.now()}`
      setHeldBills([
        ...heldBills,
        {
          id: billId,
          items: [...cart],
          subtotal,
          discount,
          total,
          customerName,
          customerPhone,
          timestamp: new Date(),
        },
      ])
      setCart([])
      setDiscount(0)
      setCustomerName("")
      setCustomerPhone("")
    }
  }

  const clearCart = () => {
    setCart([])
    setDiscount(0)
    setCustomerName("")
    setCustomerPhone("")
  }

  return (
    <MainLayout title={t('pos')}>
      <FeatureGuard feature="pos">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Product Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('customerInformation')}</CardTitle>
                {/* <Button variant="outline" size="sm" onClick={() => {
                  setEditingCustomer(null)
                  setCustomerFormData({ name: '', phone: '', email: '', address: '' })
                  setIsCustomerDialogOpen(true)
                }}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Customer
                </Button> */}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="staffSelect">{t('staffMember')}</Label>
                  <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectStaff')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      {Array.isArray(employees) && employees.map((emp) => (
                        <SelectItem key={emp._id} value={emp.employeeId}>
                          {emp.name} ({emp.employeeId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerName">{t('customerName')}</Label>
                  <Input 
                    id="customerName" 
                    placeholder={t('enterCustomerName')} 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">{t('phoneNumber')}</Label>
                  <Input 
                    id="customerPhone" 
                    placeholder={t('enterPhoneNumber')} 
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('productSelection')}</CardTitle>
                  <CardDescription>{t('searchAndAddProducts')}</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    onClick={() => setIsScannerOpen(true)}
                  >
                    <Scan className="w-4 h-4 mr-2" />
                    {t('scanBarcode')}
                  </Button>
                  
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('searchByNameSKU')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchTerm.trim()) {
                      // If search term looks like a barcode (numbers/alphanumeric), focus on exact match
                      const isBarcode = /^[A-Za-z0-9]+$/.test(searchTerm.trim())
                      if (isBarcode) {
                        handleBarcodeScan(searchTerm.trim())
                        setSearchTerm('')
                      } else if (filteredProducts.length === 1) {
                        addToCart(filteredProducts[0])
                        setSearchTerm('')
                      }
                    }
                  }}
                  className="pl-10"
                />
              </div>

              {loading ? (
                <div className="text-center py-8">{t('loadingProducts')}</div>
              ) : (
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {Array.isArray(filteredProducts) && filteredProducts.map((product) => {
                    return (
                      <div
                        key={product.id}
                        className={`flex items-center justify-between p-3 border rounded-lg ${(product.stock || 0) <= 0 ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-accent cursor-pointer'}`}
                        onClick={() => (product.stock || 0) > 0 && addToCart(product)}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {product.name || (product as any).productname || (product as any).medicine || 'No Name'}
                          </h4>
                          <p className={`text-sm ${(product.stock || 0) <= 0 ? 'text-red-500 font-medium' : (product.stock || 0) <= 5 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                            {t('stock')}: {product.stock || 0} {(product.stock || 0) <= 0 ? '(Out of Stock)' : (product.stock || 0) <= 5 ? '(Low Stock)' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">₹ {(Number((product as any).Price || (product as any).price || product.price) || 0).toFixed(2)}</p>
                          <Badge variant="outline" className="text-xs">
                            {(product as any).Barcode || (product as any).barcode || product.barcode || t('noBarcode')}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Held Bills */}
          {heldBills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('heldBills')} ({heldBills.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {heldBills.map((bill) => (
                    <Button
                      key={bill.id}
                      variant="outline"
                      className="w-full justify-between bg-transparent"
                      onClick={() => {
                        setCart(bill.items)
                        setDiscount(bill.discount)
                        setCustomerName(bill.customerName || "")
                        setCustomerPhone(bill.customerPhone || "")
                        setHeldBills(heldBills.filter((b) => b.id !== bill.id))
                      }}
                    >
                      <span>{bill.id}</span>
                      <span>₹ {Number(bill.total || 0).toFixed(2)}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Cart & Checkout */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span>{t('cart')} ({cart.length})</span>
                </CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={holdBill}>
                    <Pause className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearCart}>
                    {t('clearCart')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t('cartIsEmpty')}</p>
              ) : (
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-2">
                          <h5 className="font-medium text-sm leading-tight">{item.name}</h5>
                          {editingItemId === item.id ? (
                            <Input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              onBlur={() => {
                                if (editPrice && !isNaN(Number(editPrice))) {
                                  const updatedPrice = Number(editPrice)
                                  setCart(cart.map(cartItem => 
                                    cartItem.id === item.id 
                                      ? { ...cartItem, price: updatedPrice, total: updatedPrice * cartItem.quantity }
                                      : cartItem
                                  ))
                                }
                                setEditingItemId(null)
                                setEditPrice('')
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur()
                                }
                              }}
                              className="text-xs h-6 w-20"
                              autoFocus
                            />
                          ) : (
                            <p 
                              className="text-xs text-muted-foreground cursor-pointer" 
                              onClick={() => {
                                setEditingItemId(item.id)
                                setEditPrice(item.price.toString())
                              }}
                            >
                              ₹ {(Number(item.price) || 0).toFixed(2)} {t('each')}
                            </p>
                          )}
                          <div className="mt-2 flex items-center space-x-2">
                            <Label className="text-xs">GST</Label>
                            <Select
                              value={item.gstRate != null ? String(item.gstRate) : 'inherit'}
                              onValueChange={(val) => {
                                setCart(cart.map(ci => ci.id === item.id ? { ...ci, gstRate: (val === 'inherit' ? undefined : Number(val)) } : ci))
                              }}
                            >
                              <SelectTrigger className="h-7 w-28 text-xs" />
                              <SelectContent>
                                <SelectItem value="inherit">Inherit</SelectItem>
                                <SelectItem value="0">0%</SelectItem>
                                <SelectItem value="5">5%</SelectItem>
                                <SelectItem value="9">9%</SelectItem>
                                <SelectItem value="12">12%</SelectItem>
                                <SelectItem value="18">18%</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">₹ {Number(item.total || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                            <Plus className="w-3 h-3" />
                          </Button>

                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* WhatsApp section removed as requested */}

          {/* Customer & Billing */}
          <Card>
            <CardHeader>
              <CardTitle>{t('customerAndBilling')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">


              <div className="space-y-2">
                <Label htmlFor="discount">{t('discount')} (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  value={discount === 0 ? '' : discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeTax"
                      checked={includeTax}
                      onCheckedChange={(checked) => setIncludeTax(checked as boolean)}
                    />
                    <Label htmlFor="includeTax" className="text-sm font-medium">
                      Include Tax ({settings.taxRate}%)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeCess"
                      checked={includeCess}
                      onCheckedChange={(checked) => setIncludeCess(checked as boolean)}
                    />
                    <Label htmlFor="includeCess" className="text-sm font-medium">
                      Include CESS ({settings.cessRate}%)
                    </Label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="gstOverride"
                      checked={gstRateOverride}
                      onCheckedChange={(checked) => setGstRateOverride(checked as boolean)}
                    />
                    <Label htmlFor="gstOverride" className="text-sm font-medium">
                      Override Bill GST
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm">Bill GST (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={billGstRate === '' ? '' : billGstRate}
                      onChange={(e) => setBillGstRate((e.target.value === '' ? '' : Math.max(0, Math.min(100, Number(e.target.value) || 0))))}
                      placeholder={String(settings.taxRate)}
                      className="h-8 w-28 text-xs"
                      disabled={!gstRateOverride}
                    />
                  </div>
                </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t('subtotal')}:</span>
                  <span>₹ {subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{t('discount')} ({discount}%):</span>
                    <span>-₹ {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {includeTax && settings.taxRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>{t('tax')}:</span>
                    <span>₹ {tax.toFixed(2)}</span>
                  </div>
                )}
                {includeCess && settings.cessRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>CESS:</span>
                    <span>₹ {cess.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>{t('total')}:</span>
                  <span>₹ {total.toFixed(2)}</span>
                </div>
              </div>

              <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" disabled={cart.length === 0}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    {t('processPayment')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('paymentProcessing')}</DialogTitle>
                    <DialogDescription>{t('completeTransaction')}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">₹ {total.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">{t('totalAmount')}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant={selectedPaymentMethod === 'cash' ? 'default' : 'outline'} 
                        className="flex flex-col items-center p-6 h-20"
                        onClick={() => setSelectedPaymentMethod('cash')}
                      >
                        <Banknote className="w-8 h-8 mb-2" />
                        <span className="text-sm font-medium">{t('cash')}</span>
                      </Button>
                      <Button 
                        variant={selectedPaymentMethod === 'online' ? 'default' : 'outline'} 
                        className="flex flex-col items-center p-6 h-20"
                        onClick={() => setSelectedPaymentMethod('online')}
                      >
                        <Smartphone className="w-8 h-8 mb-2" />
                        <span className="text-sm font-medium">{t('online')}</span>
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amountReceived">{t('amountReceived')}</Label>
                      <Input id="amountReceived" type="number" placeholder={total.toFixed(2)} />
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        className="flex-1"
                        onClick={async () => {
                          try {
                            // Create/update customer first
                            if (customerName.trim()) {
                              try {
                                // Get customer fields to map correctly
                                const fieldsResponse = await fetch('/api/customer-fields')
                                let customerData: any = {}
                                
                                if (fieldsResponse.ok) {
                                  const fields = await fieldsResponse.json()
                                  // Map name to the first name-like field
                                  const nameField = fields.find((f: any) => 
                                    f.name.toLowerCase().includes('name') && 
                                    !f.name.toLowerCase().includes('id')
                                  )
                                  // Map phone to phone field
                                  const phoneField = fields.find((f: any) => 
                                    f.name.toLowerCase() === 'phone'
                                  )
                                  
                                  if (nameField) customerData[nameField.name] = customerName.trim()
                                  if (phoneField && customerPhone?.trim()) customerData[phoneField.name] = customerPhone.trim()
                                } else {
                                  // Fallback to phone field structure
                                  customerData = {
                                    name: customerName.trim(),
                                    phone: customerPhone?.trim() || null
                                  }
                                }
                                
                                const customerResponse = await fetch('/api/customers', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(customerData)
                                })
                                if (!customerResponse.ok) {
                                  console.error('Failed to create/update customer')
                                }
                              } catch (error) {
                                console.error('Customer API error:', error)
                              }
                            }
                            
                            const saleData = {
                              items: cart.map(item => ({
                                id: item.id,
                                name: item.name,
                                price: item.price,
                                quantity: item.quantity,
                                total: item.total,
                                gstRate: item.gstRate
                              })),
                              customerName,
                              customerPhone,
                              subtotal,
                              discount,
                              discountAmount,
                              tax,
                              cess,
                              total,
                              paymentMethod: selectedPaymentMethod,
                              taxRate: includeTax ? (gstRateOverride ? (billGstRate === '' ? settings.taxRate : Number(billGstRate)) : settings.taxRate) : 0,
                              cessRate: includeCess ? settings.cessRate : 0,
                              storeName: settings.storeName,
                              staffMember: selectedStaff || 'admin',
                              includeTax,
                              includeCess,
                              gstRateOverride,
                              billGstRate: gstRateOverride ? (billGstRate === '' ? settings.taxRate : Number(billGstRate)) : undefined
                            }
                            
                            const response = await fetch('/api/pos/sales', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(saleData)
                            })
                            
                            if (response.ok) {
                              const result = await response.json()
                              setCompletedSale({
                                ...result,
                                date: new Date(result.createdAt),
                                items: cart
                              })
                              setIsPaymentDialogOpen(false)
                              setIsBillModalOpen(true)
                              fetchProducts()
                              showToast.success(language === 'en' ? 'Sale completed successfully!' : language === 'gu' ? 'વેચાણ સફળતાપૂર્વક પૂર્ણ થયું!' : 'बिक्री सफलतापूर्वक पूर्ण हुई!')
                            } else {
                              const errorData = await response.json()
                              if (errorData.error === 'Stock validation failed' && errorData.details) {
                                showToast.error(`Stock Error: ${errorData.details.join(', ')}`)
                                // Refresh products to get updated stock
                                fetchProducts()
                              } else {
                                showToast.error(`${t('failedToProcessSale')}: ${errorData.error || t('unknownError')}`)
                              }
                              console.error('Sale error:', errorData)
                            }
                          } catch (error) {
                            console.error('Failed to process sale:', error)
                            showToast.error(`${t('networkError')}: ${t('failedToProcessSale')}`)
                          }
                        }}
                      >
                        {t('completeSale')}
                      </Button>
                      
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bill Modal */}
      <Dialog open={isBillModalOpen} onOpenChange={setIsBillModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('saleComplete')}</DialogTitle>
            <DialogDescription>{t('transactionCompleted')}</DialogDescription>
          </DialogHeader>
          {completedSale && completedSale.billNo && (
            <div className="py-4">
              {/* Bill Preview using selected design */}
              <iframe 
                src={`/api/bill-pdf/${completedSale._id || completedSale.id}`}
                style={{width: '100%', height: '500px', border: '1px solid #ddd', borderRadius: '8px'}}
                title="Bill Preview"
              />

              {/* Action Buttons */}
              <div className="flex space-x-2 mt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    const billId = completedSale._id || completedSale.id
                    window.open(`/api/bill-pdf/${billId}`, '_blank')
                  }}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  {t('printBill')}
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (!completedSale.customerPhone) {
                      showToast.error(t('customerPhoneRequired'))
                      return
                    }
                    
                    const billId = completedSale._id || completedSale.id
                    const pdfLink = `${window.location.origin}/api/bill-pdf/${billId}`
                    const phone = completedSale.customerPhone.replace(/[^\d]/g, '')
                    const message = `*${settings.storeName || 'STORE'}*

*Bill No:* ${completedSale.billNo}
*Customer:* ${completedSale.customerName || 'Walk-in Customer'}
*Date:* ${new Date(completedSale.createdAt).toLocaleDateString('en-IN')}
*Time:* ${new Date(completedSale.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}

*ITEMS PURCHASED:*
${completedSale.items.map((item: any) => `• ${item.name} x${item.quantity} = Rs${(Number(item.total) || 0).toFixed(2)}`).join('\n')}

*Subtotal:* Rs${(Number(completedSale.subtotal) || 0).toFixed(2)}
*Discount:* Rs${(Number(completedSale.discountAmount) || 0).toFixed(2)}
*Tax:* Rs${(Number(completedSale.tax) || 0).toFixed(2)}
*TOTAL AMOUNT: Rs${(Number(completedSale.total) || 0).toFixed(2)}*
*Payment Method:* ${completedSale.paymentMethod || 'cash'}

*View Your Receipt:*
${pdfLink}

thanks for shopping

come again

${settings.address || ''}
Contact: ${settings.phone || ''}`
                    
                    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
                    window.open(whatsappUrl, '_blank')
                    showToast.success('Opening WhatsApp...')
                  }}
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  {t('sendWhatsApp')}
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => {
                    setIsBillModalOpen(false)
                    clearCart()
                  }}
                >
                  {t('newSale')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner */}
      <BarcodeScanner 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScan}
      />
      </FeatureGuard>
    </MainLayout>
  )
}
