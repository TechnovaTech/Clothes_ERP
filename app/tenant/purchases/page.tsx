"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { FeatureGuard } from "@/components/feature-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Plus, Edit, Trash2, Package, Truck, DollarSign, Clock, Check, Download, Upload, X } from "lucide-react"
import { showToast, confirmDelete } from "@/lib/toast"
import { useLanguage } from "@/lib/language-context"


interface Purchase {
  id: string
  poNumber: string
  supplierName: string
  supplierContact: string
  items: any[]
  subtotal: number
  tax: number
  total: number
  status: string
  orderDate: string
  expectedDelivery: string
  createdAt: string
}

export default function PurchasesPage() {
  const { t, language } = useLanguage()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 20
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null)
  const [purchaseToComplete, setPurchaseToComplete] = useState<Purchase | null>(null)
  const [selectedPurchases, setSelectedPurchases] = useState<string[]>([])
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)
  const [isClearAllOpen, setIsClearAllOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [dropdownData, setDropdownData] = useState({
    categories: [],
    sizes: [],
    colors: [],
    materials: [],
    brands: [],
    suppliers: []
  })
  const [inventoryItems, setInventoryItems] = useState<any[]>([])

  const [formData, setFormData] = useState({
    supplierName: '',
    supplierContact: '',
    supplierContactNo: '',
    orderDate: new Date().toISOString().split('T')[0],
    items: [{ name: '', sku: '', quantity: 0, unitPrice: 0, total: 0, updateInventory: true, selectedProductId: '' }],
    notes: ''
  })

  const fetchPurchases = async (page = 1) => {
    try {
      const response = await fetch(`/api/purchases?page=${page}&limit=${itemsPerPage}`)
      if (response.ok) {
        const result = await response.json()
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages)
          setTotalItems(result.pagination.total)
          setPurchases(result.data || [])
        } else {
          setPurchases(result.data || result || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch purchases:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDropdownData = async () => {
    try {
      const response = await fetch('/api/dropdown-data')
      if (response.ok) {
        const data = await response.json()
        setDropdownData({
          categories: data.categories || [],
          sizes: data.sizes || [],
          colors: data.colors || [],
          materials: data.materials || [],
          brands: data.brands || [],
          suppliers: data.suppliers || []
        })
      }
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error)
    }
  }

  const fetchInventoryItems = async () => {
    try {
      const response = await fetch('/api/inventory?limit=10000') // Get all items
      if (response.ok) {
        const result = await response.json()
        const data = result.data || result || []
        console.log('Inventory items fetched:', data.length, 'items')
        console.log('Sample items:', data.slice(0, 3))
        setInventoryItems(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Failed to fetch inventory items:', error)
      setInventoryItems([])
    }
  }





  const createPurchase = async () => {
    try {
      const purchaseData = {
        ...formData,
        poNumber: `PO-${Date.now()}`,
        status: 'pending'
      }
      
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchaseData)
      })
      
      if (response.ok) {
        fetchPurchases(currentPage)
        setIsCreateDialogOpen(false)
        resetForm()
        showToast.success(`✅ ${t('billUpdated')}`)
      } else {
        showToast.error(`❌ ${t('failedToUpdateBill')}`)
      }
    } catch (error) {
      console.error('Failed to create purchase:', error)
    }
  }

  const openCompleteDialog = (purchase: Purchase) => {
    setPurchaseToComplete(purchase)
    setIsCompleteDialogOpen(true)
  }

  const completePurchaseOrder = async () => {
    if (!purchaseToComplete) return
    
    try {
      const response = await fetch(`/api/purchases/${purchaseToComplete.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      })
      
      if (response.ok) {
        fetchPurchases(currentPage)
        setIsCompleteDialogOpen(false)
        setPurchaseToComplete(null)
        showToast.success(`✅ ${t('billUpdated')}`)
      } else {
        showToast.error(`❌ ${t('failedToUpdateBill')}`)
      }
    } catch (error) {
      console.error('Failed to complete purchase order:', error)
      showToast.error(`❌ ${t('errorUpdatingBill')}`)
    }
  }

  const editPurchase = (purchase: Purchase) => {
    console.log('Edit button clicked for purchase:', purchase.id)
    setSelectedPurchase(purchase)
    
    // Ensure items have proper structure with selectedProductId
    const formattedItems = (purchase.items || []).map(item => ({
      ...item,
      selectedProductId: item.selectedProductId || ''
    }))
    
    setFormData({
      supplierName: purchase.supplierName || '',
      supplierContact: purchase.supplierContact || '',
      supplierContactNo: (purchase as any).supplierContactNo || '',
      orderDate: purchase.orderDate || new Date().toISOString().split('T')[0],
      items: formattedItems,
      notes: (purchase as any).notes || ''
    })
    setIsEditDialogOpen(true)
  }

  const updatePurchase = async () => {
    if (!selectedPurchase) return
    try {
      const response = await fetch(`/api/purchases/${selectedPurchase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        fetchPurchases(currentPage)
        setIsEditDialogOpen(false)
        resetForm()
        showToast.success(`✅ ${t('billUpdated')}`)
      } else {
        showToast.error(`❌ ${t('failedToUpdateBill')}`)
      }
    } catch (error) {
      console.error('Failed to update purchase:', error)
      showToast.error(`❌ ${t('errorUpdatingBill')}`)
    }
  }

  const openDeleteDialog = (purchase: Purchase) => {
    setPurchaseToDelete(purchase)
    setIsDeleteDialogOpen(true)
  }

  const deletePurchase = async () => {
    if (!purchaseToDelete) return
    
    try {
      const response = await fetch(`/api/purchases/${purchaseToDelete.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchPurchases(currentPage)
        setIsDeleteDialogOpen(false)
        setPurchaseToDelete(null)
        showToast.success(`✅ ${t('billDeletedSuccess')}`)
      } else {
        showToast.error(`❌ ${t('failedToDeleteBill')}`)
      }
    } catch (error) {
      console.error('Failed to delete purchase:', error)
      showToast.error(`❌ ${t('errorDeletingBill')}`)
    }
  }

  const resetForm = () => {
    setFormData({
      supplierName: '',
      supplierContact: '',
      supplierContactNo: '',
      orderDate: new Date().toISOString().split('T')[0],
      items: [{ name: '', sku: '', quantity: 0, unitPrice: 0, total: 0, updateInventory: true, selectedProductId: '' }],
      notes: ''
    })
    setSelectedPurchase(null)
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', sku: '', quantity: 0, unitPrice: 0, total: 0, updateInventory: true, selectedProductId: '' }]
    }))
  }



  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({           
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value }
          // Always recalculate total when quantity or unitPrice changes
          const qty = field === 'quantity' ? (parseFloat(value) || 0) : (parseFloat(item.quantity) || 0)
          const price = field === 'unitPrice' ? (parseFloat(value) || 0) : (parseFloat(item.unitPrice) || 0)
          updatedItem.total = qty * price
          return updatedItem
        }
        return item
      })
    }))
  }

  useEffect(() => {
    fetchPurchases(1)
    fetchDropdownData()
    fetchInventoryItems()
  }, [])

  useEffect(() => {
    fetchPurchases(currentPage)
  }, [currentPage])

  const getProductDisplayName = (item: any) => {
    // Try all possible name field variations
    const nameFields = [
      'name', 'productname', 'product_name', 'ProductName', 'Product Name',
      'medicine', 'Medicine', 'item_name', 'itemName', 'title', 'Title'
    ]
    
    for (const field of nameFields) {
      if (item[field] && typeof item[field] === 'string' && item[field].trim()) {
        return item[field].trim()
      }
    }
    
    // Fallback to SKU or generic name
    return item.sku || item.SKU || 'Unnamed Product'
  }

  const selectInventoryItem = (index: number, selectedItem: any, productId: string) => {
    if (selectedItem) {
      const displayName = getProductDisplayName(selectedItem)
      updateItem(index, 'selectedProductId', productId)
      updateItem(index, 'name', displayName)
      updateItem(index, 'sku', selectedItem.sku)
      updateItem(index, 'unitPrice', selectedItem.costPrice || selectedItem.price || 0)
    }
  }

  const filteredPurchases = purchases.filter(purchase =>
    (purchase.poNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (purchase.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPurchases = purchases.length
  const pendingOrders = purchases.filter(p => p.status === 'pending').length
  const totalSpent = purchases.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0)
  const activeSuppliers = new Set(purchases.map(p => p.supplierName)).size

  if (loading) {
    return (
      <MainLayout title={t('purchaseManagement')}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('loading')}</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title={t('purchaseManagement')}>
      <FeatureGuard feature="purchases">
        <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalPurchases')}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPurchases}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('pendingOrders')}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalSpent')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalSpent.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('activeSuppliers')}</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSuppliers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle>{t('purchaseOrders')}</CardTitle>
                <CardDescription>{t('managePurchaseOrders')}</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedPurchases.length > 0 && (
                  <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteOpen(true)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('delete')} ({selectedPurchases.length})
                  </Button>
                )}
                {selectedPurchases.length === 0 && (
                  <Button variant="destructive" size="sm" onClick={() => setIsClearAllOpen(true)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('clearAll')}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={async () => {
                  try {
                    const response = await fetch('/api/purchases/export')
                    if (response.ok) {
                      const blob = await response.blob()
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `purchases_${new Date().toISOString().split('T')[0]}.csv`
                      a.click()
                      showToast.success(`✅ ${t('billsExportedSuccess').replace('{0}', 'Purchases')}`)
                    }
                  } catch (error) {
                    showToast.error(`❌ ${t('failedToExportBills')}`)
                  }
                }}>
                  <Upload className="w-4 h-4 mr-2" />
                  {t('exportCSV')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => document.getElementById('purchaseImportInput')?.click()} disabled={isImporting}>
                  <Download className="w-4 h-4 mr-2" />
                  {isImporting ? t('importing') : t('importCSV')}
                </Button>
                <input
                  id="purchaseImportInput"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setIsImporting(true)
                    const formData = new FormData()
                    formData.append('file', file)
                    try {
                      const response = await fetch('/api/purchases/import', {
                        method: 'POST',
                        body: formData
                      })
                      const result = await response.json()
                      if (response.ok) {
                        showToast.success(`✅ ${t('billsImportedSuccess').replace('{0}', String(result.imported))}`)
                        fetchPurchases(1)
                      } else {
                        showToast.error(result.error || `❌ ${t('failedToImportBills')}`)
                      }
                    } catch (error) {
                      showToast.error(`❌ ${t('errorImportingBills')}`)
                    } finally {
                      setIsImporting(false)
                      e.target.value = ''
                    }
                  }}
                />
                <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                setIsCreateDialogOpen(open)
                if (open) {
                  fetchInventoryItems() // Refresh inventory when dialog opens
                }
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('newPurchaseOrder')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t('createNewPurchaseOrder')}</DialogTitle>
                    <DialogDescription>{t('addNewInventoryPurchaseOrder')}</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    {/* Supplier Information */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('supplierName')}</Label>
                        <Input 
                          value={formData.supplierName}
                          onChange={(e) => setFormData(prev => ({...prev, supplierName: e.target.value}))}
                          placeholder={t('supplierName')} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('contactPerson')}</Label>
                        <Input 
                          value={formData.supplierContact}
                          onChange={(e) => setFormData(prev => ({...prev, supplierContact: e.target.value}))}
                          placeholder={t('contactPersonName')} 
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('contactNumber')}</Label>
                        <Input 
                          value={formData.supplierContactNo}
                          onChange={(e) => setFormData(prev => ({...prev, supplierContactNo: e.target.value}))}
                          placeholder={t('supplierContactNumber')} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('orderDate')}</Label>
                        <Input 
                          type="date" 
                          value={formData.orderDate}
                          onChange={(e) => setFormData(prev => ({...prev, orderDate: e.target.value}))}
                        />
                      </div>
                    </div> 

                    {/* Items Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">{t('orderItems')}</Label>
                        <Button variant="outline" size="sm" onClick={addItem}>
                          <Plus className="w-4 h-4 mr-2" />
                          {t('addProduct')}
                        </Button>
                      </div>
                      
                      {formData.items.map((item, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-4">
                          <div className="mb-4">
                            <h4 className="font-medium">{t('item')} {index + 1}</h4>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <Label>{t('selectFromInventory')}</Label>
                            <Select 
                              value={item.selectedProductId || ''} 
                              onValueChange={(value) => {
                                const selectedItem = inventoryItems.find(inv => inv.id === value)
                                selectInventoryItem(index, selectedItem, value)
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t('chooseProduct')} />
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px] overflow-y-auto">
                                {Array.isArray(inventoryItems) && inventoryItems.length > 0 ? inventoryItems.map((invItem) => {
                                  const displayName = getProductDisplayName(invItem)
                                  return (
                                    <SelectItem key={invItem.id} value={invItem.id}>
                                      {displayName} - {t('stock')}: {invItem.stock || 0}
                                    </SelectItem>
                                  )
                                }) : (
                                  <SelectItem value="no-items" disabled>
                                    No inventory items found
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="text-center text-sm text-muted-foreground mb-4">{t('orEnterManually')}</div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>{t('productName')}</Label>
                              <Input 
                                value={item.name}
                                onChange={(e) => {
                                  updateItem(index, 'name', e.target.value)
                                  updateItem(index, 'selectedProductId', '')
                                }}
                                placeholder={t('enterProductName')} 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t('sku')}</Label>
                              <Input 
                                value={item.sku}
                                onChange={(e) => {
                                  updateItem(index, 'sku', e.target.value)
                                  updateItem(index, 'selectedProductId', '')
                                }}
                                placeholder={t('enterSKU')} 
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>{t('quantity')}</Label>
                              <Input 
                                type="number" 
                                step="1"
                                value={item.quantity === 0 ? '' : String(item.quantity)}
                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                placeholder="0" 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t('unitPrice')} (₹)</Label>
                              <Input 
                                type="number" 
                                step="1"
                                value={item.unitPrice === 0 ? '' : String(item.unitPrice)}
                                onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                placeholder="0" 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t('total')} (₹)</Label>
                              <Input 
                                type="text" 
                                value={item.total.toFixed(2)}
                                readOnly
                                className="bg-gray-50"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Label>{t('notes')}</Label>
                      <Textarea 
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                        placeholder={t('additionalNotes')} 
                      />
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-end">
                        <div className="w-64 space-y-2">
                          <div className="flex justify-between text-lg font-bold">
                            <span>{t('totalAmount')}:</span>
                            <span>₹{formData.items.reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>{t('cancel')}</Button>
                    <Button onClick={createPurchase}>{t('createPurchaseOrder')}</Button>
                  </div>
                </DialogContent>
              </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>

              {/* Edit Purchase Dialog */}
              <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                setIsEditDialogOpen(open)
                if (open) {
                  fetchInventoryItems() // Refresh inventory when dialog opens
                }
              }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t('editBill')}</DialogTitle>
                    <DialogDescription>{t('addNewInventoryPurchaseOrder')}</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    {/* Same form fields as create dialog */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('supplierName')}</Label>
                        <Input 
                          value={formData.supplierName}
                          onChange={(e) => setFormData(prev => ({...prev, supplierName: e.target.value}))}
                          placeholder={t('supplierName')} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('contactPerson')}</Label>
                        <Input 
                          value={formData.supplierContact}
                          onChange={(e) => setFormData(prev => ({...prev, supplierContact: e.target.value}))}
                          placeholder={t('contactPersonName')} 
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('contactNumber')}</Label>
                        <Input 
                          value={formData.supplierContactNo}
                          onChange={(e) => setFormData(prev => ({...prev, supplierContactNo: e.target.value}))}
                          placeholder={t('supplierContactNumber')} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('orderDate')}</Label>
                        <Input 
                          type="date" 
                          value={formData.orderDate}
                          onChange={(e) => setFormData(prev => ({...prev, orderDate: e.target.value}))}
                        />
                      </div>
                    </div>

                    {/* Items Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">{t('orderItems')}</Label>
                        <Button variant="outline" size="sm" onClick={addItem}>
                          <Plus className="w-4 h-4 mr-2" />
                          {t('addProduct')}
                        </Button>
                      </div>
                      
                      {formData.items.map((item, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-4">
                          <div className="mb-4">
                            <h4 className="font-medium">{t('item')} {index + 1}</h4>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>{t('productName')}</Label>
                              <Input 
                                value={item.name}
                                onChange={(e) => updateItem(index, 'name', e.target.value)}
                                placeholder={t('enterProductName')} 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t('sku')}</Label>
                              <Input 
                                value={item.sku}
                                onChange={(e) => updateItem(index, 'sku', e.target.value)}
                                placeholder={t('enterSKU')} 
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>{t('quantity')}</Label>
                              <Input 
                                type="number" 
                                step="1"
                                value={item.quantity === 0 ? '' : String(item.quantity)}
                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                placeholder="0" 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t('unitPrice')} (₹)</Label>
                              <Input 
                                type="number" 
                                step="1"
                                value={item.unitPrice === 0 ? '' : String(item.unitPrice)}
                                onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                placeholder="0" 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t('total')} (₹)</Label>
                              <Input 
                                type="text" 
                                value={item.total.toFixed(2)}
                                readOnly
                                className="bg-gray-50"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>{t('notes')}</Label>
                      <Textarea 
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                        placeholder={t('additionalNotes')} 
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>{t('cancel')}</Button>
                    <Button onClick={updatePurchase}>{t('updateBill')}</Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Delete Confirmation Dialog */}
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('deleteBill')}</DialogTitle>
                    <DialogDescription>
                      {t('confirmDeleteCustomer')} {purchaseToDelete?.poNumber}? {t('actionCannotBeUndone')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button variant="destructive" onClick={deletePurchase}>
                      {t('delete')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Bulk Delete Dialog */}
              <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('deleteSelectedCustomers')}</DialogTitle>
                    <DialogDescription>
                      {t('confirmDeleteSelectedCustomers').replace('{0}', selectedPurchases.length.toString())}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => {
                      setIsBulkDeleteOpen(false)
                      setSelectedPurchases([])
                    }}>
                      {t('cancel')}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        try {
                          await Promise.all(
                            selectedPurchases.map(id => 
                              fetch(`/api/purchases/${id}`, { method: 'DELETE' })
                            )
                          )
                          showToast.success(`✅ ${t('billsDeletedSuccess').replace('{0}', selectedPurchases.length.toString())}`)
                          setSelectedPurchases([])
                          fetchPurchases(currentPage)
                        } catch (error) {
                          showToast.error(`❌ ${t('failedToDeleteBills')}`)
                        }
                        setIsBulkDeleteOpen(false)
                      }}
                    >
                      {t('delete')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Clear All Dialog */}
              <Dialog open={isClearAllOpen} onOpenChange={setIsClearAllOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <Trash2 className="w-5 h-5 text-red-500" />
                      <span>{t('clearAllBills')}</span>
                    </DialogTitle>
                    <DialogDescription>
                      {t('confirmClearAllBills')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setIsClearAllOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button variant="destructive" onClick={async () => {
                      try {
                        const response = await fetch('/api/purchases/clear', { method: 'DELETE' })
                        if (response.ok) {
                          showToast.success(`✅ ${t('allBillsDeletedSuccess')}`)
                          setSelectedPurchases([])
                          fetchPurchases(1)
                        } else {
                          showToast.error(`❌ ${t('failedToClearBills')}`)
                        }
                      } catch (error) {
                        showToast.error(`❌ ${t('errorClearingBills')}`)
                      }
                      setIsClearAllOpen(false)
                    }}>
                      {t('deleteAllBills')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Complete Confirmation Dialog */}
              <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('updateBill')}</DialogTitle>
                    <DialogDescription>
                      {t('confirmDeleteCustomer')} {purchaseToComplete?.poNumber}? 
                      <br /><br />
                      <strong>{t('stock')} {t('update')}:</strong> {t('multiplePhoneNumbersHint')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button onClick={completePurchaseOrder}>
                      {t('updateBill')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder={t('searchPurchaseOrders')} 
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {filteredPurchases.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">{t('noPurchaseOrdersFound')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {purchases.length === 0 ? t('startByCreatingFirstPurchaseOrder') : t('tryAdjustingSearchOrFilters')}
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('createFirstPurchaseOrder')}
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedPurchases.length === filteredPurchases.length && filteredPurchases.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPurchases(filteredPurchases.map(p => p.id))
                          } else {
                            setSelectedPurchases([])
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="text-center w-16">{t('srNo')}</TableHead>
                    <TableHead className="text-center">{t('orderId')}</TableHead>
                    <TableHead className="text-center">{t('supplier')}</TableHead>
                    <TableHead className="text-center">{t('items')}</TableHead>
                    <TableHead className="text-center">{t('orderDate')}</TableHead>
                    <TableHead className="text-center">{t('totalAmount')}</TableHead>
                    <TableHead className="text-center">{t('status')}</TableHead>
                    <TableHead className="text-center">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((purchase, index) => (
                    <TableRow key={purchase.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPurchases.includes(purchase.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPurchases([...selectedPurchases, purchase.id])
                            } else {
                              setSelectedPurchases(selectedPurchases.filter(id => id !== purchase.id))
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {((currentPage - 1) * itemsPerPage) + index + 1}
                      </TableCell>
                      <TableCell className="font-medium text-center">{purchase.poNumber}</TableCell>
                      <TableCell className="text-center">
                        <div>
                          <div className="font-medium">{purchase.supplierName}</div>
                          <div className="text-sm text-muted-foreground">{purchase.supplierContact}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div>{purchase.items?.length || 0} {t('items')}</div>
                          {purchase.items && purchase.items.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {purchase.items.slice(0, 2).map((item, idx) => (
                                <div key={idx}>{item.name || item.sku}</div>
                              ))}
                              {purchase.items.length > 2 && (
                                <div>+{purchase.items.length - 2} more</div>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{new Date(purchase.orderDate).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell className="text-center">₹ {(parseFloat(purchase.total) || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={
                          purchase.status === 'pending' ? 'secondary' :
                          purchase.status === 'completed' ? 'default' :
                          purchase.status === 'delivered' ? 'default' : 'outline'
                        }>
                          {purchase.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {purchase.status === 'pending' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openCompleteDialog(purchase)}
                              title="Complete Order"
                              className="text-black hover:text-black"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => editPurchase(purchase)}
                            disabled={purchase.status === 'completed'}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700"
                            onClick={() => openDeleteDialog(purchase)}
                            disabled={purchase.status === 'completed'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            )}
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  {t('showing')} {((currentPage - 1) * itemsPerPage) + 1} {t('to')} {Math.min(currentPage * itemsPerPage, totalItems)} {t('of')} {totalItems} purchases
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    {t('previous')}
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => 
                        page === 1 || 
                        page === totalPages || 
                        Math.abs(page - currentPage) <= 1
                      )
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        </div>
                      ))
                    }
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    {t('next')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </FeatureGuard>
    </MainLayout>
  )
}