'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Package, CheckCircle, Plus } from 'lucide-react'

export default function ManufacturerInventory() {
  const { toast } = useToast()
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedFactory, setSelectedFactory] = useState("all")
  const [factories, setFactories] = useState([])
  const [formData, setFormData] = useState({
    productName: '',
    productType: '',
    quantity: '',
    batchId: '',
    description: ''
  })

  useEffect(() => {
    fetchInventory()
    fetchFactories()
  }, [])

  const fetchFactories = async () => {
    try {
      const response = await fetch('/api/manufacturer/factories')
      if (response.ok) {
        const data = await response.json()
        setFactories(data)
      }
    } catch (error) {
      console.error('Failed to fetch factories:', error)
    }
  }

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/manufacturer/inventory')
      const data = await response.json()
      setInventory(data.inventory || [])
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const addProduct = async () => {
    try {
      const response = await fetch('/api/manufacturer/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: formData.productName,
          productType: formData.productType,
          quantity: parseInt(formData.quantity),
          batchId: formData.batchId || `BATCH-${Date.now()}`,
          description: formData.description,
          source: 'manual_entry',
          status: 'available'
        })
      })
      
      if (response.ok) {
        await fetchInventory()
        setIsAddDialogOpen(false)
        setFormData({ productName: '', productType: '', quantity: '', batchId: '', description: '' })
        toast({
          title: "Success",
          description: "Product added to inventory successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to add product to inventory.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error adding product:', error)
      toast({
        title: "Error",
        description: "Failed to add product to inventory.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">
            {selectedFactory === "all" ? "All Factories Inventory" : "Factory-specific Inventory"}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="w-64">
            <Select value={selectedFactory} onValueChange={setSelectedFactory}>
              <SelectTrigger>
                <SelectValue placeholder="Select Factory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Factories</SelectItem>
                {factories.map((factory) => (
                  <SelectItem key={factory._id} value={factory._id}>
                    {factory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Product to Inventory</DialogTitle>
              <DialogDescription>Enter product details to add to inventory</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Product Name *</Label>
                <Input 
                  placeholder="Enter product name" 
                  value={formData.productName}
                  onChange={(e) => setFormData({...formData, productName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Product Type *</Label>
                <Select value={formData.productType} onValueChange={(value) => setFormData({...formData, productType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="t-shirt">T-Shirt</SelectItem>
                    <SelectItem value="jeans">Jeans</SelectItem>
                    <SelectItem value="dress">Dress</SelectItem>
                    <SelectItem value="shirt">Shirt</SelectItem>
                    <SelectItem value="jacket">Jacket</SelectItem>
                    <SelectItem value="pants">Pants</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input 
                  type="number" 
                  placeholder="Enter quantity" 
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Batch ID</Label>
                <Input 
                  placeholder="Auto-generated if empty" 
                  value={formData.batchId}
                  onChange={(e) => setFormData({...formData, batchId: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input 
                  placeholder="Optional description" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={addProduct} disabled={!formData.productName || !formData.productType || !formData.quantity}>
                Add Product
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventory.reduce((sum, item) => sum + (item.quantity || item.perfectQuantity || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Perfect pieces available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QC Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {inventory.filter(item => item.source === 'quality_control').length}
            </div>
            <p className="text-xs text-muted-foreground">Batches from QC</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Product Types</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(inventory.map(item => item.productType)).size}
            </div>
            <p className="text-xs text-muted-foreground">Different products</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>Products available from quality control approval</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inventory ID</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Product Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : inventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No inventory items</h3>
                    <p className="text-sm text-muted-foreground">
                      Add products manually or from quality control
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                inventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>{item.productName || item.productType}</TableCell>
                    <TableCell className="capitalize">{item.productType}</TableCell>
                    <TableCell>
                      <span className="font-medium text-green-600">{item.quantity || item.perfectQuantity || 0}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.source === 'quality_control' ? 'default' : 'secondary'}>
                        {item.source === 'quality_control' ? 'QC Approved' : 'Manual Entry'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        {item.status || 'Available'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}