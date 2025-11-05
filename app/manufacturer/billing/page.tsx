'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Receipt, DollarSign, FileText, Edit, Trash2, Eye } from 'lucide-react'
import { showToast } from '@/lib/toast'

export default function BillingManagement() {
  const [bills, setBills] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddBillOpen, setIsAddBillOpen] = useState(false)
  const [isEditBillOpen, setIsEditBillOpen] = useState(false)
  const [isViewBillOpen, setIsViewBillOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState(null)
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    billNumber: '',
    billDate: '',
    dueDate: '',
    items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
    subtotal: 0,
    taxRate: 18,
    taxAmount: 0,
    totalAmount: 0,
    status: 'pending',
    paymentMethod: 'cash',
    notes: ''
  })

  useEffect(() => {
    fetchBills()
    fetchCustomers()
    fetchProducts()
    fetchSettings()
    generateBillNumber()
  }, [])

  const fetchBills = async () => {
    try {
      const response = await fetch('/api/manufacturer/billing')
      const data = await response.json()
      setBills(data.bills || [])
    } catch (error) {
      console.error('Error fetching bills:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/manufacturer/distributors')
      const data = await response.json()
      setCustomers(data.distributors || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/manufacturer/products')
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/manufacturer/settings')
      const data = await response.json()
      if (data.settings?.taxRate) {
        setFormData(prev => ({ ...prev, taxRate: data.settings.taxRate }))
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const generateBillNumber = () => {
    const billNumber = `BILL-${Date.now()}`
    setFormData(prev => ({ ...prev, billNumber }))
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0, amount: 0 }]
    }))
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
    calculateTotals()
  }

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    if (field === 'quantity' || field === 'rate') {
      updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].rate
    }
    
    setFormData(prev => ({ ...prev, items: updatedItems }))
    calculateTotals(updatedItems)
  }

  const calculateTotals = (items = formData.items) => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
    const taxAmount = (subtotal * formData.taxRate) / 100
    const totalAmount = subtotal + taxAmount
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      totalAmount
    }))
  }

  const createBill = async () => {
    if (!formData.customerName || formData.items.length === 0) {
      showToast.error('Please fill all required fields')
      return
    }
    
    try {
      const response = await fetch('/api/manufacturer/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // Automatically add to accounting transactions
        await addToAccounting(result.bill)
        
        await fetchBills()
        setIsAddBillOpen(false)
        resetForm()
        showToast.success('✅ Bill created and added to accounting!')
      } else {
        const error = await response.json()
        showToast.error('❌ Error: ' + error.error)
      }
    } catch (error) {
      console.error('Error creating bill:', error)
      showToast.error('❌ Failed to create bill')
    }
  }

  const addToAccounting = async (bill: any) => {
    try {
      await fetch('/api/manufacturer/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'income',
          category: 'sales',
          amount: bill.totalAmount,
          description: `Bill ${bill.billNumber} - ${bill.customerName}`,
          date: bill.billDate,
          factoryId: 'general',
          paymentMethod: bill.paymentMethod,
          reference: bill.billNumber
        })
      })
    } catch (error) {
      console.error('Error adding to accounting:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      billNumber: '',
      billDate: '',
      dueDate: '',
      items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
      subtotal: 0,
      taxRate: 18,
      taxAmount: 0,
      totalAmount: 0,
      status: 'pending',
      paymentMethod: 'cash',
      notes: ''
    })
    generateBillNumber()
  }

  const editBill = (bill: any) => {
    setSelectedBill(bill)
    setFormData({
      customerName: bill.customerName || '',
      customerEmail: bill.customerEmail || '',
      customerPhone: bill.customerPhone || '',
      customerAddress: bill.customerAddress || '',
      billNumber: bill.billNumber || '',
      billDate: bill.billDate || '',
      dueDate: bill.dueDate || '',
      items: bill.items || [{ description: '', quantity: 1, rate: 0, amount: 0 }],
      subtotal: bill.subtotal || 0,
      taxRate: bill.taxRate || 18,
      taxAmount: bill.taxAmount || 0,
      totalAmount: bill.totalAmount || 0,
      status: bill.status || 'pending',
      paymentMethod: bill.paymentMethod || 'cash',
      notes: bill.notes || ''
    })
    setIsEditBillOpen(true)
  }

  const updateBill = async () => {
    if (!selectedBill) return
    
    try {
      const response = await fetch(`/api/manufacturer/billing/${(selectedBill as any)._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        await fetchBills()
        setIsEditBillOpen(false)
        resetForm()
        setSelectedBill(null)
        showToast.success('✅ Bill updated successfully!')
      } else {
        showToast.error('❌ Failed to update bill')
      }
    } catch (error) {
      console.error('Error updating bill:', error)
      showToast.error('❌ Failed to update bill')
    }
  }

  const deleteBill = async (id: string) => {
    try {
      const response = await fetch(`/api/manufacturer/billing/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchBills()
        showToast.success('Bill deleted successfully!')
      } else {
        showToast.error('Failed to delete bill')
      }
    } catch (error) {
      console.error('Error deleting bill:', error)
      showToast.error('Failed to delete bill')
    }
  }

  const viewBill = (bill: any) => {
    setSelectedBill(bill)
    setIsViewBillOpen(true)
  }

  // Calculate totals for dashboard
  const totalRevenue = bills.reduce((sum: number, bill: any) => sum + (bill.totalAmount || 0), 0)
  const paidBills = bills.filter((bill: any) => bill.status === 'paid').length
  const pendingBills = bills.filter((bill: any) => bill.status === 'pending').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Payment Management</h1>
        <p className="text-muted-foreground">Create and manage customer bills and payments</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bills.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From all bills</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Bills</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidBills}</div>
            <p className="text-xs text-muted-foreground">Completed payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Bills</CardTitle>
            <FileText className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingBills}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bills & Invoices</CardTitle>
              <CardDescription>Manage customer billing and payments</CardDescription>
            </div>
            <Dialog open={isAddBillOpen} onOpenChange={setIsAddBillOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Bill
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Bill</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  {/* Customer Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Customer Name *</Label>
                      <Select value={formData.customerName} onValueChange={(value) => {
                        const customer = customers.find(c => c.name === value)
                        setFormData({
                          ...formData,
                          customerName: value,
                          customerEmail: customer?.email || '',
                          customerPhone: customer?.phone || '',
                          customerAddress: customer?.address || ''
                        })
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.name}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Bill Number</Label>
                      <Input value={formData.billNumber} readOnly />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Bill Date *</Label>
                      <Input 
                        type="date"
                        value={formData.billDate}
                        onChange={(e) => setFormData({...formData, billDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input 
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({...formData, paymentMethod: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-medium">Bill Items</Label>
                      <Button type="button" onClick={addItem} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg p-4 space-y-4">
                      {formData.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-5 gap-4 items-end">
                          <div className="space-y-2">
                            <Label>Product Name</Label>
                            <Select value={item.description} onValueChange={(value) => updateItem(index, 'description', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((product) => (
                                  <SelectItem key={product.id} value={product.name}>
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input 
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Rate</Label>
                            <Input 
                              type="number"
                              value={item.rate}
                              onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Amount</Label>
                            <Input value={item.amount.toFixed(2)} readOnly />
                          </div>
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm"
                            onClick={() => removeItem(index)}
                            disabled={formData.items.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="grid grid-cols-4 gap-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label>Subtotal</Label>
                      <Input value={`₹${formData.subtotal.toFixed(2)}`} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Tax Rate (%)</Label>
                      <Input 
                        type="number"
                        value={formData.taxRate}
                        onChange={(e) => {
                          const taxRate = parseFloat(e.target.value) || 0
                          setFormData(prev => ({ ...prev, taxRate }))
                          calculateTotals()
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tax Amount</Label>
                      <Input value={`₹${formData.taxAmount.toFixed(2)}`} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Total Amount</Label>
                      <Input value={`₹${formData.totalAmount.toFixed(2)}`} readOnly className="font-bold" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea 
                      placeholder="Additional notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddBillOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createBill}>
                    Create Bill
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : bills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">No bills found</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Start by creating your first bill
                      </p>
                      <Button onClick={() => setIsAddBillOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Bill
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  bills.map((bill: any) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-medium">{bill.billNumber}</TableCell>
                      <TableCell>{bill.customerName}</TableCell>
                      <TableCell>{bill.billDate}</TableCell>
                      <TableCell>₹{bill.totalAmount?.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          bill.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : bill.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {bill.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => viewBill(bill)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => editBill(bill)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => deleteBill(bill._id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Bill Dialog */}
      <Dialog open={isViewBillOpen} onOpenChange={setIsViewBillOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bill Details</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><strong>Bill Number:</strong> {(selectedBill as any).billNumber}</div>
                <div><strong>Date:</strong> {(selectedBill as any).billDate}</div>
                <div><strong>Customer:</strong> {(selectedBill as any).customerName}</div>
                <div><strong>Status:</strong> {(selectedBill as any).status}</div>
              </div>
              <div>
                <strong>Items:</strong>
                <div className="mt-2 border rounded p-2">
                  {(selectedBill as any).items?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between py-1">
                      <span>{item.description}</span>
                      <span>{item.quantity} × ₹{item.rate} = ₹{item.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div><strong>Total: ₹{(selectedBill as any).totalAmount?.toLocaleString()}</strong></div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setIsViewBillOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}