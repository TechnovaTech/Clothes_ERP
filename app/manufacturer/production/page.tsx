'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Calendar, Factory, Clock, CheckCircle, AlertTriangle, Eye, Edit, RotateCcw } from 'lucide-react'

export default function ProductionPlanning() {
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false)
  const [productionOrders, setProductionOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [factories, setFactories] = useState([])
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [progressValue, setProgressValue] = useState('')
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    product: '',
    quantity: '',
    productionCost: '',
    startDate: '',
    endDate: '',
    priority: '',
    factory: '',
    notes: ''
  })

  useEffect(() => {
    fetchProductionOrders()
    fetchProducts()
    fetchFactories()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/manufacturer/products')
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchFactories = async () => {
    try {
      const response = await fetch('/api/manufacturer/warehouse')
      const data = await response.json()
      setFactories(data.factories || [])
    } catch (error) {
      console.error('Error fetching factories:', error)
    }
  }

  const fetchProductionOrders = async () => {
    try {
      const response = await fetch('/api/manufacturer/production')
      const data = await response.json()
      setProductionOrders(data.orders || [])
    } catch (error) {
      console.error('Error fetching production orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProductionOrder = async () => {
    try {
      const response = await fetch('/api/manufacturer/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        await fetchProductionOrders()
        setIsCreateOrderOpen(false)
        setFormData({ product: '', quantity: '', productionCost: '', startDate: '', endDate: '', priority: '', factory: '', notes: '' })
      }
    } catch (error) {
      console.error('Error creating production order:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'In Progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'Delayed':
        return <Badge className="bg-red-100 text-red-800">Delayed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return <Badge variant="destructive">High</Badge>
      case 'Medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
      case 'Low':
        return <Badge variant="secondary">Low</Badge>
      default:
        return <Badge variant="secondary">{priority}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Production Planning</h1>
          <p className="text-muted-foreground">Manage production orders and schedules</p>
        </div>
        <Dialog open={isCreateOrderOpen} onOpenChange={setIsCreateOrderOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Production Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
            <DialogHeader className="flex-shrink-0 pb-4 border-b">
              <DialogTitle className="text-xl font-semibold">Create Production Order</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-1 py-4">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Order Information</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Product *</Label>
                      <Select value={formData.product} onValueChange={(value) => setFormData({...formData, product: value})}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product: any) => (
                            <SelectItem key={product.id} value={product.name}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Quantity *</Label>
                      <Input 
                        type="number" 
                        placeholder="Enter quantity" 
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Production Cost (₹)</Label>
                      <Input 
                        type="number" 
                        placeholder="Cost per unit" 
                        value={formData.productionCost}
                        onChange={(e) => setFormData({...formData, productionCost: e.target.value})}
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Schedule & Priority */}
                <div className="p-4 rounded-lg border">
                  <h3 className="text-sm font-medium mb-3">Schedule & Priority</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Start Date</Label>
                      <Input 
                        type="date" 
                        value={formData.startDate}
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">End Date</Label>
                      <Input 
                        type="date" 
                        value={formData.endDate}
                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Priority</Label>
                      <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Assigned Factory</Label>
                      <Select value={formData.factory} onValueChange={(value) => setFormData({...formData, factory: value})}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select factory" />
                        </SelectTrigger>
                        <SelectContent>
                          {factories.map((factory: any) => (
                            <SelectItem key={factory.id} value={factory.name}>
                              {factory.name} - {factory.location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="p-4 rounded-lg border">
                  <h3 className="text-sm font-medium mb-3">Additional Details</h3>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Notes</Label>
                    <Textarea 
                      placeholder="Additional notes or requirements" 
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 flex justify-end space-x-3 pt-4 border-t bg-white">
              <Button variant="outline" onClick={() => setIsCreateOrderOpen(false)} className="px-6">
                Cancel
              </Button>
              <Button onClick={createProductionOrder} className="px-6 bg-black hover:bg-black">
                Create Order
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Progress Update Dialog */}
        <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Progress</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Order: {selectedOrder?.id}</Label>
                <Label>Product: {selectedOrder?.product}</Label>
              </div>
              <div className="space-y-2">
                <Label>Progress (%)</Label>
                <Input 
                  type="number" 
                  min="0" 
                  max="100" 
                  placeholder="Enter progress percentage" 
                  value={progressValue}
                  onChange={(e) => setProgressValue(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsProgressDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={async () => {
                try {
                  const response = await fetch(`/api/manufacturer/production/${selectedOrder?._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ progress: parseInt(progressValue) })
                  })
                  if (response.ok) {
                    await fetchProductionOrders()
                    setIsProgressDialogOpen(false)
                  }
                } catch (error) {
                  console.error('Error updating progress:', error)
                }
              }}>
                Update Progress
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Production Order Details</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><strong>Order ID:</strong> {selectedOrder?.id}</div>
                <div><strong>Product:</strong> {selectedOrder?.product}</div>
                <div><strong>Quantity:</strong> {selectedOrder?.quantity}</div>
                <div><strong>Cost:</strong> ₹{selectedOrder?.productionCost}</div>
                <div><strong>Priority:</strong> {selectedOrder?.priority}</div>
                <div><strong>Status:</strong> {selectedOrder?.status}</div>
                <div><strong>Progress:</strong> {selectedOrder?.progress || 0}%</div>
                <div><strong>Factory:</strong> {selectedOrder?.factory}</div>
              </div>
              {selectedOrder?.notes && (
                <div><strong>Notes:</strong> {selectedOrder.notes}</div>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Production Order</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input 
                    type="number" 
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Production Cost</Label>
                  <Input 
                    type="number" 
                    value={formData.productionCost}
                    onChange={(e) => setFormData({...formData, productionCost: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Factory</Label>
                  <Select value={formData.factory} onValueChange={(value) => setFormData({...formData, factory: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {factories.map((factory: any) => (
                        <SelectItem key={factory.id} value={factory.name}>
                          {factory.name} - {factory.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={async () => {
                try {
                  const response = await fetch(`/api/manufacturer/production/${selectedOrder?._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                  })
                  if (response.ok) {
                    await fetchProductionOrders()
                    setIsEditDialogOpen(false)
                  }
                } catch (error) {
                  console.error('Error updating order:', error)
                }
              }}>Update Order</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Production Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productionOrders.length}</div>
            <p className="text-xs text-muted-foreground">Total orders</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">33% of total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14</div>
            <p className="text-xs text-muted-foreground">58% completion rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delayed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Production Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Production Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Order ID</TableHead>
                <TableHead className="text-center">Product</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-center">Production Cost</TableHead>
                <TableHead className="text-center">Priority</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Progress</TableHead>
                <TableHead className="text-center">Timeline</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : productionOrders.map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell className="text-center font-medium">{order.id}</TableCell>
                  <TableCell className="text-center">{order.product}</TableCell>
                  <TableCell className="text-center">{order.quantity}</TableCell>
                  <TableCell className="text-center">₹{order.productionCost || 0}</TableCell>
                  <TableCell className="text-center">{getPriorityBadge(order.priority || 'Low')}</TableCell>
                  <TableCell className="text-center">{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${order.progress || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm">{order.progress || 0}%</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSelectedOrder(order)
                          setProgressValue(order.progress || 0)
                          setIsProgressDialogOpen(true)
                        }}
                        className="ml-2 h-6 px-2 text-xs"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="text-sm">
                      <div>{order.startDate} - {order.endDate}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedOrder(order)
                        setIsViewDialogOpen(true)
                      }}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedOrder(order)
                        setFormData({
                          product: order.product || '',
                          quantity: order.quantity || '',
                          productionCost: order.productionCost || '',
                          startDate: order.startDate || '',
                          endDate: order.endDate || '',
                          priority: order.priority || '',
                          factory: order.factory || '',
                          notes: order.notes || ''
                        })
                        setIsEditDialogOpen(true)
                      }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}