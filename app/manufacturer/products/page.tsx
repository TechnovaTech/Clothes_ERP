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
import { Plus, Package, Edit, Trash2 } from 'lucide-react'
import { showToast } from '@/lib/toast'

export default function ProductsManagement() {
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEditProductOpen, setIsEditProductOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productToDelete, setProductToDelete] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: ''
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/manufacturer/products')
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProduct = async () => {
    if (!formData.name || !formData.unit) {
      showToast.error('Please fill all required fields')
      return
    }
    
    try {
      const response = await fetch('/api/manufacturer/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        await fetchProducts()
        setIsAddProductOpen(false)
        setFormData({ name: '', description: '', unit: '' })
        showToast.success('✅ Product added successfully!')
      } else {
        const error = await response.json()
        showToast.error('❌ Error: ' + error.error)
      }
    } catch (error) {
      console.error('Error creating product:', error)
      showToast.error('❌ Failed to create product')
    }
  }

  const editProduct = (product: any) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name || '',
      description: product.description || '',
      unit: product.unit || ''
    })
    setIsEditProductOpen(true)
  }

  const updateProduct = async () => {
    if (!selectedProduct) return
    
    try {
      const response = await fetch(`/api/manufacturer/products/${(selectedProduct as any)._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        await fetchProducts()
        setIsEditProductOpen(false)
        setFormData({ name: '', description: '', unit: '' })
        setSelectedProduct(null)
        showToast.success('✅ Product updated successfully!')
      } else {
        showToast.error('❌ Failed to update product')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      showToast.error('❌ Failed to update product')
    }
  }

  const openDeleteDialog = (product: any) => {
    setProductToDelete(product)
    setIsDeleteDialogOpen(true)
  }

  const deleteProduct = async () => {
    if (!productToDelete) return
    
    try {
      const response = await fetch(`/api/manufacturer/products/${(productToDelete as any)._id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchProducts()
        setIsDeleteDialogOpen(false)
        setProductToDelete(null)
        showToast.success('Product deleted successfully!')
      } else {
        showToast.error('Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      showToast.error('Failed to delete product')
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Products Management</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">Products in catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Product Catalog</CardTitle>
                <CardDescription>Manage your clothing product catalog</CardDescription>
              </div>
              <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Product Name *</Label>
                      <Input 
                        placeholder="Enter product name" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit *</Label>
                      <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="piece">Piece</SelectItem>
                          <SelectItem value="set">Set</SelectItem>
                          <SelectItem value="pair">Pair</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea 
                        placeholder="Product description" 
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddProductOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createProduct}>
                      Add Product
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isEditProductOpen} onOpenChange={(open) => {
                setIsEditProductOpen(open)
                if (!open) {
                  setFormData({ name: '', description: '', unit: '' })
                  setSelectedProduct(null)
                }
              }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Product</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Product Name *</Label>
                      <Input 
                        placeholder="Enter product name" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit *</Label>
                      <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="piece">Piece</SelectItem>
                          <SelectItem value="set">Set</SelectItem>
                          <SelectItem value="pair">Pair</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea 
                        placeholder="Product description" 
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsEditProductOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={updateProduct}>
                      Update Product
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Delete Confirmation Dialog */}
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Product</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground py-4">
                    Are you sure you want to delete "{(productToDelete as any)?.name}"? This action cannot be undone.
                  </p>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={deleteProduct}>
                      Delete
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No products found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start by adding your first product to catalog
                </p>
                <Button onClick={() => setIsAddProductOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Product
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Product ID</TableHead>
                      <TableHead className="text-center">Name</TableHead>
                      <TableHead className="text-center">Unit</TableHead>
                      <TableHead className="text-center">Description</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : products.map((product: any) => (
                      <TableRow key={product.id}>
                        <TableCell className="text-center font-medium">{product.id}</TableCell>
                        <TableCell className="text-center">{product.name}</TableCell>
                        <TableCell className="text-center">{product.unit}</TableCell>
                        <TableCell className="text-center">{product.description || '-'}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => editProduct(product)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => openDeleteDialog(product)}>
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

    </>
  )
}