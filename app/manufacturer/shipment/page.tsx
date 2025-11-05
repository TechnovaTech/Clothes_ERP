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
import { Plus, Search, Filter, Edit, Trash2, Truck, Package, MapPin, Clock, Eye } from "lucide-react"

interface Shipment {
  _id: string
  shipmentNumber: string
  orderNumber: string
  customerName: string
  customerAddress: string
  fromAddress: string
  toAddress: string
  forWhom: string
  items: number
  weight: number
  carrier: string
  trackingNumber: string
  shippingMethod: string
  status: string
  priority: string
  shipDate: string
  estimatedDelivery: string
  actualDelivery: string
  notes: string
  createdAt: string
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "preparing": return "bg-yellow-100 text-yellow-800"
    case "shipped": return "bg-blue-100 text-blue-800"
    case "in_transit": return "bg-purple-100 text-purple-800"
    case "delivered": return "bg-green-100 text-green-800"
    case "delayed": return "bg-red-100 text-red-800"
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

export default function ShipmentPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null)
  const [viewingShipment, setViewingShipment] = useState<Shipment | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [formData, setFormData] = useState({
    orderNumber: "",
    customerName: "",
    customerAddress: "",
    fromAddress: "",
    toAddress: "",
    forWhom: "",
    items: "",
    weight: "",
    carrier: "",
    trackingNumber: "",
    shippingMethod: "standard",
    status: "preparing",
    priority: "medium",
    shipDate: "",
    estimatedDelivery: "",
    notes: ""
  })

  useEffect(() => {
    fetchShipments()
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/manufacturer/orders')
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
  }

  const fetchShipments = async () => {
    try {
      const response = await fetch('/api/manufacturer/shipments')
      const data = await response.json()
      setShipments(data.shipments || [])
    } catch (error) {
      console.error('Failed to fetch shipments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const method = editingShipment ? 'PUT' : 'POST'
      const body = editingShipment ? { 
        ...formData, 
        _id: editingShipment._id,
        items: Number(formData.items) || 0,
        weight: Number(formData.weight) || 0
      } : {
        ...formData,
        items: Number(formData.items) || 0,
        weight: Number(formData.weight) || 0
      }
      
      const response = await fetch('/api/manufacturer/shipments', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (response.ok) {
        fetchShipments()
        setIsDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('Failed to save shipment:', error)
    }
  }

  const handleEdit = (shipment: Shipment) => {
    setEditingShipment(shipment)
    setFormData({
      orderNumber: shipment.orderNumber || '',
      customerName: shipment.customerName || '',
      customerAddress: shipment.customerAddress || '',
      fromAddress: shipment.fromAddress || '',
      toAddress: shipment.toAddress || '',
      forWhom: shipment.forWhom || '',
      items: shipment.items?.toString() || '',
      weight: shipment.weight?.toString() || '',
      carrier: shipment.carrier || '',
      trackingNumber: shipment.trackingNumber || '',
      shippingMethod: shipment.shippingMethod || 'standard',
      status: shipment.status || 'preparing',
      priority: shipment.priority || 'medium',
      shipDate: shipment.shipDate || '',
      estimatedDelivery: shipment.estimatedDelivery || '',
      notes: shipment.notes || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this shipment?')) {
      try {
        const response = await fetch(`/api/manufacturer/shipments?id=${id}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          fetchShipments()
        }
      } catch (error) {
        console.error('Failed to delete shipment:', error)
      }
    }
  }

  const handleView = (shipment: Shipment) => {
    setViewingShipment(shipment)
    setIsViewDialogOpen(true)
  }

  const resetForm = () => {
    setEditingShipment(null)
    setFormData({
      orderNumber: "",
      customerName: "",
      customerAddress: "",
      fromAddress: "",
      toAddress: "",
      forWhom: "",
      items: "",
      weight: "",
      carrier: "",
      trackingNumber: "",
      shippingMethod: "standard",
      status: "preparing",
      priority: "medium",
      shipDate: "",
      estimatedDelivery: "",
      notes: ""
    })
  }

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = shipment.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.shipmentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || shipment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalShipments = shipments.length
  const inTransitShipments = shipments.filter(s => s.status === 'in_transit').length
  const deliveredShipments = shipments.filter(s => s.status === 'delivered').length
  const delayedShipments = shipments.filter(s => s.status === 'delayed').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading shipments...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Total Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShipments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inTransitShipments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Delivered</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveredShipments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Delayed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{delayedShipments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Shipment Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Shipment Management</CardTitle>
            </div>
            <div className="flex space-x-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Shipment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col" style={{overflow: 'visible'}}>
                  <DialogHeader className="flex-shrink-0 pb-4 border-b">
                    <DialogTitle className="text-xl font-semibold">{editingShipment ? 'Edit Shipment' : 'Add New Shipment'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-1 py-4 space-y-6" style={{position: 'relative'}}>
                      {/* Order Information */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Order Information</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="orderNumber" className="text-sm font-medium">Order Number *</Label>
                            <Select value={formData.orderNumber} onValueChange={(value) => {
                              const selectedOrder = orders.find(order => order.orderNumber === value)
                              setFormData({
                                ...formData, 
                                orderNumber: value,
                                customerName: selectedOrder?.buyerCompany || '',
                                customerAddress: selectedOrder?.buyerAddress || ''
                              })
                            }}>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select order number" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px] overflow-y-auto">
                                {orders.map((order) => (
                                  <SelectItem key={order._id} value={order.orderNumber}>
                                    {order.orderNumber} - {order.buyerCompany}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="customerName" className="text-sm font-medium">Customer Name *</Label>
                            <Input
                              id="customerName"
                              placeholder="Customer name"
                              value={formData.customerName}
                              onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                              className="h-10"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="items" className="text-sm font-medium">Total Items *</Label>
                              <Input
                                id="items"
                                type="number"
                                placeholder="0"
                                value={formData.items}
                                onChange={(e) => setFormData({...formData, items: e.target.value})}
                                className="h-10"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="weight" className="text-sm font-medium">Weight (kg) *</Label>
                              <Input
                                id="weight"
                                type="number"
                                step="0.1"
                                placeholder="0.0"
                                value={formData.weight}
                                onChange={(e) => setFormData({...formData, weight: e.target.value})}
                                className="h-10"
                                required
                              />
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="customerAddress" className="text-sm font-medium">Customer Address *</Label>
                            <Textarea
                              id="customerAddress"
                              placeholder="Enter customer address"
                              value={formData.customerAddress}
                              onChange={(e) => setFormData({...formData, customerAddress: e.target.value})}
                              className="min-h-[60px] resize-none"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="fromAddress" className="text-sm font-medium">From Address *</Label>
                              <Textarea
                                id="fromAddress"
                                placeholder="Pickup/Origin address"
                                value={formData.fromAddress}
                                onChange={(e) => setFormData({...formData, fromAddress: e.target.value})}
                                className="min-h-[60px] resize-none"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="toAddress" className="text-sm font-medium">To Address *</Label>
                              <Textarea
                                id="toAddress"
                                placeholder="Delivery/Destination address"
                                value={formData.toAddress}
                                onChange={(e) => setFormData({...formData, toAddress: e.target.value})}
                                className="min-h-[60px] resize-none"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="forWhom" className="text-sm font-medium">For Whom *</Label>
                            <Input
                              id="forWhom"
                              placeholder="Recipient name/company"
                              value={formData.forWhom}
                              onChange={(e) => setFormData({...formData, forWhom: e.target.value})}
                              className="h-10"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Shipping Details */}
                      <div className="p-4 rounded-lg border">
                        <h3 className="text-sm font-medium mb-3">Shipping Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="carrier" className="text-sm font-medium">Carrier *</Label>
                            <Select value={formData.carrier} onValueChange={(value) => setFormData({...formData, carrier: value})}>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select carrier" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fedex">FedEx</SelectItem>
                                <SelectItem value="ups">UPS</SelectItem>
                                <SelectItem value="dhl">DHL</SelectItem>
                                <SelectItem value="usps">USPS</SelectItem>
                                <SelectItem value="local">Local Delivery</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="trackingNumber" className="text-sm font-medium">Tracking Number</Label>
                            <Input
                              id="trackingNumber"
                              placeholder="Enter tracking number"
                              value={formData.trackingNumber}
                              onChange={(e) => setFormData({...formData, trackingNumber: e.target.value})}
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="shippingMethod" className="text-sm font-medium">Shipping Method</Label>
                            <Select value={formData.shippingMethod} onValueChange={(value) => setFormData({...formData, shippingMethod: value})}>
                              <SelectTrigger className="h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="standard">Standard</SelectItem>
                                <SelectItem value="express">Express</SelectItem>
                                <SelectItem value="overnight">Overnight</SelectItem>
                                <SelectItem value="ground">Ground</SelectItem>
                              </SelectContent>
                            </Select>
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
                          <div className="space-y-2">
                            <Label htmlFor="shipDate" className="text-sm font-medium">Ship Date *</Label>
                            <Input
                              id="shipDate"
                              type="date"
                              value={formData.shipDate}
                              onChange={(e) => setFormData({...formData, shipDate: e.target.value})}
                              className="h-10"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="estimatedDelivery" className="text-sm font-medium">Estimated Delivery</Label>
                            <Input
                              id="estimatedDelivery"
                              type="date"
                              value={formData.estimatedDelivery}
                              onChange={(e) => setFormData({...formData, estimatedDelivery: e.target.value})}
                              className="h-10"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Additional Information */}
                      <div className="p-4 rounded-lg border">
                        <h3 className="text-sm font-medium mb-3">Additional Information</h3>
                        <div className="space-y-2">
                          <Label htmlFor="notes" className="text-sm font-medium">Shipping Notes</Label>
                          <Textarea
                            id="notes"
                            placeholder="Any special shipping instructions or notes..."
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            className="min-h-[80px] resize-none"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 flex justify-end space-x-3 pt-4 mt-4 border-t bg-white p-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="px-6">
                        Cancel
                      </Button>
                      <Button type="submit" className="px-6">
                        {editingShipment ? 'Update Shipment' : 'Add Shipment'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {/* View Dialog */}
              <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                  <DialogHeader className="flex-shrink-0 pb-4 border-b">
                    <DialogTitle className="text-xl font-semibold">Shipment Details</DialogTitle>
                  </DialogHeader>
                  {viewingShipment && (
                    <div className="flex-1 overflow-y-auto px-1 py-4 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Shipment Number</Label>
                            <p className="text-lg font-semibold">{viewingShipment.shipmentNumber}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Order Number</Label>
                            <p>{viewingShipment.orderNumber}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Customer Name</Label>
                            <p>{viewingShipment.customerName}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">For Whom</Label>
                            <p>{viewingShipment.forWhom}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Status</Label>
                            <div className="mt-1">
                              <Badge className={getStatusColor(viewingShipment.status)}>
                                {viewingShipment.status}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Priority</Label>
                            <div className="mt-1">
                              <Badge className={getPriorityColor(viewingShipment.priority)}>
                                {viewingShipment.priority}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Carrier</Label>
                            <p>{viewingShipment.carrier}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Tracking Number</Label>
                            <p>{viewingShipment.trackingNumber || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">From Address</Label>
                          <p className="mt-1 p-2 bg-gray-50 rounded text-sm">{viewingShipment.fromAddress}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">To Address</Label>
                          <p className="mt-1 p-2 bg-gray-50 rounded text-sm">{viewingShipment.toAddress}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Items</Label>
                          <p>{viewingShipment.items}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Weight</Label>
                          <p>{viewingShipment.weight} kg</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Ship Date</Label>
                          <p>{viewingShipment.shipDate}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Est. Delivery</Label>
                          <p>{viewingShipment.estimatedDelivery || 'N/A'}</p>
                        </div>
                      </div>
                      
                      {viewingShipment.notes && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Notes</Label>
                          <p className="mt-1 p-2 bg-gray-50 rounded text-sm">{viewingShipment.notes}</p>
                        </div>
                      )}
                      
                      <div className="flex justify-end pt-4 border-t">
                        <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
                      </div>
                    </div>
                  )}
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
                placeholder="Search shipments..."
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
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredShipments.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No shipments found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {shipments.length === 0 ? 'Start by adding your first shipment' : 'Try adjusting your search or filters'}
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Shipment
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Shipment #</TableHead>
                    <TableHead className="text-center">Order #</TableHead>
                    <TableHead className="text-center">Customer</TableHead>
                    <TableHead className="text-center">Carrier</TableHead>
                    <TableHead className="text-center">Tracking</TableHead>
                    <TableHead className="text-center">Ship Date</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Priority</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.map((shipment) => (
                    <TableRow key={shipment._id}>
                      <TableCell className="text-center font-medium">{shipment.shipmentNumber}</TableCell>
                      <TableCell className="text-center">{shipment.orderNumber}</TableCell>
                      <TableCell className="text-center">{shipment.customerName}</TableCell>
                      <TableCell className="text-center">{shipment.carrier}</TableCell>
                      <TableCell className="text-center">{shipment.trackingNumber || 'N/A'}</TableCell>
                      <TableCell className="text-center">{shipment.shipDate}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={getStatusColor(shipment.status)}>
                          {shipment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getPriorityColor(shipment.priority)}>
                          {shipment.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleView(shipment)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(shipment)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(shipment._id)}>
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