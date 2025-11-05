"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Search, Filter, Edit, Trash2, Loader2, ShoppingCart, Package, TrendingUp, AlertTriangle } from "lucide-react"

interface Order {
  _id: string
  orderNumber: string
  buyerCompany: string
  buyerContact: string
  buyerEmail: string
  buyerAddress: string
  orderType: string
  products: any[]
  totalQuantity: number
  totalAmount: number
  currency: string
  deliveryDate: string
  paymentTerms: string
  status: string
  priority: string
  productionStatus: string
  qualityStatus: string
  shippingMethod: string
  notes: string
  createdAt: string
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending": return "bg-yellow-100 text-yellow-800"
    case "confirmed": return "bg-blue-100 text-blue-800"
    case "processing": return "bg-purple-100 text-purple-800"
    case "shipped": return "bg-green-100 text-green-800"
    case "delivered": return "bg-gray-100 text-gray-800"
    case "cancelled": return "bg-red-100 text-red-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "urgent": return "bg-red-100 text-red-800"
    case "high": return "bg-orange-100 text-orange-800"
    case "medium": return "bg-yellow-100 text-yellow-800"
    case "low": return "bg-green-100 text-green-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [formData, setFormData] = useState({
    buyerCompany: "",
    buyerContact: "",
    buyerEmail: "",
    buyerAddress: "",
    orderType: "retail",
    totalQuantity: "",
    totalAmount: "",
    deliveryDate: "",
    paymentTerms: "net30",
    status: "pending",
    priority: "medium",
    shippingMethod: "",
    notes: ""
  })

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/manufacturer/orders')
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const method = editingOrder ? 'PUT' : 'POST'
      const body = editingOrder ? { 
        ...formData, 
        _id: editingOrder._id,
        totalQuantity: Number(formData.totalQuantity) || 0,
        totalAmount: Number(formData.totalAmount) || 0
      } : {
        ...formData,
        totalQuantity: Number(formData.totalQuantity) || 0,
        totalAmount: Number(formData.totalAmount) || 0
      }
      
      console.log('Submitting:', method, body)
      
      const response = await fetch('/api/manufacturer/orders', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      const result = await response.json()
      console.log('Response:', result)
      
      if (response.ok) {
        fetchOrders()
        setIsDialogOpen(false)
        resetForm()
        alert(editingOrder ? 'Order updated successfully!' : 'Order created successfully!')
      } else {
        alert('Error: ' + (result.error || 'Failed to save order'))
      }
    } catch (error) {
      console.error('Failed to save order:', error)
      alert('Error saving order. Please try again.')
    }
  }

  const handleEdit = (order: Order) => {
    setEditingOrder(order)
    setFormData({
      buyerCompany: order.buyerCompany || "",
      buyerContact: order.buyerContact || "",
      buyerEmail: order.buyerEmail || "",
      buyerAddress: order.buyerAddress || "",
      orderType: order.orderType || "retail",
      totalQuantity: order.totalQuantity?.toString() || "",
      totalAmount: order.totalAmount?.toString() || "",
      deliveryDate: order.deliveryDate || "",
      paymentTerms: order.paymentTerms || "net30",
      status: order.status || "pending",
      priority: order.priority || "medium",
      shippingMethod: order.shippingMethod || "",
      notes: order.notes || ""
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this order?')) {
      try {
        const response = await fetch(`/api/manufacturer/orders?id=${id}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          fetchOrders()
        }
      } catch (error) {
        console.error('Failed to delete order:', error)
      }
    }
  }

  const resetForm = () => {
    setEditingOrder(null)
    setFormData({
      buyerCompany: "",
      buyerContact: "",
      buyerEmail: "",
      buyerAddress: "",
      orderType: "retail",
      totalQuantity: "",
      totalAmount: "",
      deliveryDate: "",
      paymentTerms: "net30",
      status: "pending",
      priority: "medium",
      shippingMethod: "",
      notes: ""
    })
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.buyerCompany?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalOrders = orders.length
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Pending Orders</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Avg Order Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{avgOrderValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sales Orders</CardTitle>
            </div>
            <div className="flex space-x-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Order
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
                  <DialogHeader className="flex-shrink-0 pb-4 border-b">
                    <DialogTitle className="text-xl font-semibold">{editingOrder ? 'Edit Sales Order' : 'Add New Sales Order'}</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto px-1 py-4">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Customer Information */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Customer Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="buyerCompany" className="text-sm font-medium">Customer Name *</Label>
                            <Input
                              id="buyerCompany"
                              placeholder="Enter customer name"
                              value={formData.buyerCompany}
                              onChange={(e) => setFormData({...formData, buyerCompany: e.target.value})}
                              className="h-10"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="buyerContact" className="text-sm font-medium">Contact Person *</Label>
                            <Input
                              id="buyerContact"
                              placeholder="Contact person name"
                              value={formData.buyerContact}
                              onChange={(e) => setFormData({...formData, buyerContact: e.target.value})}
                              className="h-10"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="buyerEmail" className="text-sm font-medium">Email Address *</Label>
                            <Input
                              id="buyerEmail"
                              type="email"
                              placeholder="customer@email.com"
                              value={formData.buyerEmail}
                              onChange={(e) => setFormData({...formData, buyerEmail: e.target.value})}
                              className="h-10"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="orderType" className="text-sm font-medium">Order Type</Label>
                            <Select value={formData.orderType} onValueChange={(value) => setFormData({...formData, orderType: value})}>
                              <SelectTrigger className="h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="retail">Retail Order</SelectItem>
                                <SelectItem value="wholesale">Wholesale Order</SelectItem>
                                <SelectItem value="online">Online Order</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="space-y-2">
                            <Label htmlFor="buyerAddress" className="text-sm font-medium">Delivery Address *</Label>
                            <Textarea
                              id="buyerAddress"
                              placeholder="Enter complete delivery address"
                              value={formData.buyerAddress}
                              onChange={(e) => setFormData({...formData, buyerAddress: e.target.value})}
                              className="min-h-[80px] resize-none"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="p-4 rounded-lg border">
                        <h3 className="text-sm font-medium mb-3">Order Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="totalQuantity" className="text-sm font-medium">Total Items *</Label>
                            <Input
                              id="totalQuantity"
                              type="number"
                              placeholder="0"
                              value={formData.totalQuantity}
                              onChange={(e) => setFormData({...formData, totalQuantity: e.target.value})}
                              className="h-10"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="totalAmount" className="text-sm font-medium">Order Value (₹) *</Label>
                            <Input
                              id="totalAmount"
                              type="number"
                              placeholder="0.00"
                              value={formData.totalAmount}
                              onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
                              className="h-10"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="deliveryDate" className="text-sm font-medium">Expected Delivery *</Label>
                            <Input
                              id="deliveryDate"
                              type="date"
                              value={formData.deliveryDate}
                              onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                              className="h-10"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="priority" className="text-sm font-medium">Priority Level</Label>
                            <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                              <SelectTrigger className="h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="urgent">Urgent</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Additional Information */}
                      <div className="p-4 rounded-lg border">
                        <h3 className="text-sm font-medium mb-3">Additional Information</h3>
                        <div className="space-y-2">
                          <Label htmlFor="notes" className="text-sm font-medium">Order Notes</Label>
                          <Textarea
                            id="notes"
                            placeholder="Any special instructions or notes for this order..."
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            className="min-h-[80px] resize-none"
                          />
                        </div>
                      </div>

                      <div className="flex-shrink-0 flex justify-end space-x-3 pt-4 border-t bg-white">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="px-6">
                          Cancel
                        </Button>
                        <Button type="submit" className="px-6">
                          {editingOrder ? 'Update Order' : 'Add Order'}
                        </Button>
                      </div>
                    </form>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No orders found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {orders.length === 0 ? 'Start by adding your first order' : 'Try adjusting your search or filters'}
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Order
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Order #</TableHead>
                    <TableHead className="text-center">Customer</TableHead>
                    <TableHead className="text-center">Contact</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-center">Amount</TableHead>
                    <TableHead className="text-center">Delivery Date</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Priority</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="text-center font-medium">{order.orderNumber}</TableCell>
                      <TableCell className="text-center">{order.buyerCompany}</TableCell>
                      <TableCell className="text-center">{order.buyerContact}</TableCell>
                      <TableCell className="text-center">{order.totalQuantity}</TableCell>
                      <TableCell className="text-center">₹{order.totalAmount?.toLocaleString()}</TableCell>
                      <TableCell className="text-center">{order.deliveryDate}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getPriorityColor(order.priority)}>
                          {order.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(order)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(order._id)}>
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
        </CardContent>
      </Card>
    </div>
  )
}