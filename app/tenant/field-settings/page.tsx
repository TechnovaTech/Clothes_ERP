"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Trash2, Settings, Users, Package, Lock } from "lucide-react"
import { showToast } from "@/lib/toast"

interface CustomerField {
  name: string
  label: string
  type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'textarea'
  required: boolean
  enabled: boolean
}

interface ProductField {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'barcode' | 'email' | 'phone' | 'url'
  required: boolean
  enabled: boolean
  options?: string[]
}

export default function FieldSettingsPage() {
  const [customerFields, setCustomerFields] = useState<CustomerField[]>([])
  const [productFields, setProductFields] = useState<ProductField[]>([])
  const [loading, setLoading] = useState(true)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(true)
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [requestType, setRequestType] = useState<'customer' | 'product'>('customer')
  const [requestField, setRequestField] = useState({ name: '', label: '', type: 'text', reason: '' })

  const verifyPassword = async () => {
    try {
      const response = await fetch('/api/field-settings-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      
      if (response.ok) {
        setIsAuthenticated(true)
        setIsPasswordDialogOpen(false)
        fetchFields()
      } else {
        showToast.error('Invalid password')
      }
    } catch (error) {
      showToast.error('Authentication failed')
    }
  }

  const fetchFields = async () => {
    try {
      const [customerResponse, productResponse] = await Promise.all([
        fetch('/api/tenant-customer-fields'),
        fetch('/api/tenant-product-fields')
      ])
      
      if (customerResponse.ok) {
        const customerData = await customerResponse.json()
        setCustomerFields(customerData)
      }
      
      if (productResponse.ok) {
        const productData = await productResponse.json()
        setProductFields(productData)
      }
    } catch (error) {
      console.error('Failed to fetch fields:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveCustomerFields = async () => {
    try {
      const response = await fetch('/api/tenant-customer-fields', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: customerFields })
      })

      if (response.ok) {
        showToast.success('Customer fields updated successfully!')
      } else {
        showToast.error('Failed to update customer fields')
      }
    } catch (error) {
      showToast.error('Failed to update customer fields')
    }
  }

  const saveProductFields = async () => {
    try {
      const response = await fetch('/api/tenant-product-fields', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: productFields })
      })

      if (response.ok) {
        showToast.success('Product fields updated successfully!')
      } else {
        showToast.error('Failed to update product fields')
      }
    } catch (error) {
      showToast.error('Failed to update product fields')
    }
  }

  const addCustomerField = () => {
    setCustomerFields([...customerFields, { 
      name: '', 
      label: '', 
      type: 'text', 
      required: false, 
      enabled: true 
    }])
  }

  const addProductField = () => {
    setProductFields([...productFields, { 
      name: '', 
      label: '', 
      type: 'text', 
      required: false, 
      enabled: true 
    }])
  }

  const updateCustomerField = (index: number, field: Partial<CustomerField>) => {
    const updated = [...customerFields]
    updated[index] = { ...updated[index], ...field }
    setCustomerFields(updated)
  }

  const updateProductField = (index: number, field: Partial<ProductField>) => {
    const updated = [...productFields]
    updated[index] = { ...updated[index], ...field }
    setProductFields(updated)
  }

  const removeCustomerField = (index: number) => {
    setCustomerFields(customerFields.filter((_, i) => i !== index))
  }

  const removeProductField = (index: number) => {
    setProductFields(productFields.filter((_, i) => i !== index))
  }

  const requestNewField = async () => {
    try {
      const response = await fetch('/api/field-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldType: requestType,
          field: requestField
        })
      })

      if (response.ok) {
        showToast.success('Field request submitted successfully!')
        setIsRequestDialogOpen(false)
        setRequestField({ name: '', label: '', type: 'text', reason: '' })
      } else {
        showToast.error('Failed to submit field request')
      }
    } catch (error) {
      showToast.error('Failed to submit field request')
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchFields()
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <MainLayout title="Field Settings">
        <Dialog open={isPasswordDialogOpen} onOpenChange={() => {}}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Authentication Required
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="password">Enter Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter field settings password"
                  onKeyPress={(e) => e.key === 'Enter' && verifyPassword()}
                />
              </div>
              <Button onClick={verifyPassword} className="w-full">
                Authenticate
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </MainLayout>
    )
  }

  if (loading) {
    return (
      <MainLayout title="Field Settings">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Field Settings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Field Settings</h1>
              <p className="text-muted-foreground">Configure custom fields for customers and products</p>
            </div>
          </div>
          <Button variant="outline" onClick={async () => {
            try {
              const response = await fetch('/api/sync-template-fields', { method: 'POST' })
              if (response.ok) {
                const result = await response.json()
                showToast.success(`Synced ${result.addedCustomerFields + result.addedProductFields} new fields from template`)
                fetchFields()
              } else {
                showToast.error('Failed to sync template fields')
              }
            } catch (error) {
              showToast.error('Failed to sync template fields')
            }
          }}>
            Refresh from Template
          </Button>
        </div>

        <Tabs defaultValue="customers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Customer Fields
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Product Fields
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Customer Fields Configuration</CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={addCustomerField}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Field
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setRequestType('customer')
                      setIsRequestDialogOpen(true)
                    }}>
                      Request Field
                    </Button>
                    <Button onClick={saveCustomerFields}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customerFields.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">No customer fields configured</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add custom fields to collect additional customer information
                      </p>
                      <Button onClick={addCustomerField}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Field
                      </Button>
                    </div>
                  ) : (
                    customerFields.map((field, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-blue-50">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium text-gray-900">Field {index + 1}</h4>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeCustomerField(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Field Name</Label>
                            <Input
                              value={field.name}
                              onChange={(e) => updateCustomerField(index, { name: e.target.value })}
                              placeholder="e.g., company, age"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Field Label</Label>
                            <Input
                              value={field.label}
                              onChange={(e) => updateCustomerField(index, { label: e.target.value })}
                              placeholder="e.g., Company Name, Age"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Field Type</Label>
                            <select
                              value={field.type}
                              onChange={(e) => updateCustomerField(index, { type: e.target.value as any })}
                              className="mt-1 w-full px-3 py-2 border rounded"
                            >
                              <option value="text">Text</option>
                              <option value="email">Email</option>
                              <option value="phone">Phone</option>
                              <option value="number">Number</option>
                              <option value="date">Date</option>
                              <option value="textarea">Textarea</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 mt-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateCustomerField(index, { required: e.target.checked })}
                              className="rounded border-gray-300"
                            />
                            <Label className="text-sm font-medium">Required</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={field.enabled}
                              onChange={(e) => updateCustomerField(index, { enabled: e.target.checked })}
                              className="rounded border-gray-300"
                            />
                            <Label className="text-sm font-medium">Enabled</Label>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Product Fields Configuration</CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={addProductField}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Field
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setRequestType('product')
                      setIsRequestDialogOpen(true)
                    }}>
                      Request Field
                    </Button>
                    <Button onClick={saveProductFields}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {productFields.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">No product fields configured</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add custom fields to collect additional product information
                      </p>
                      <Button onClick={addProductField}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Field
                      </Button>
                    </div>
                  ) : (
                    productFields.map((field, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-green-50">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium text-gray-900">Field {index + 1}</h4>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeProductField(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Field Name</Label>
                            <Input
                              value={field.name}
                              onChange={(e) => updateProductField(index, { name: e.target.value })}
                              placeholder="e.g., size, color, brand"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Field Label</Label>
                            <Input
                              value={field.label}
                              onChange={(e) => updateProductField(index, { label: e.target.value })}
                              placeholder="e.g., Size, Color, Brand"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Field Type</Label>
                            <select
                              value={field.type}
                              onChange={(e) => updateProductField(index, { type: e.target.value as any })}
                              className="mt-1 w-full px-3 py-2 border rounded"
                            >
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="select">Dropdown</option>
                              <option value="date">Date</option>
                              <option value="textarea">Textarea</option>
                              <option value="barcode">Barcode</option>
                              <option value="email">Email</option>
                              <option value="phone">Phone</option>
                              <option value="url">URL</option>
                            </select>
                          </div>
                        </div>
                        {field.type === 'select' && (
                          <div className="mt-4">
                            <Label className="text-sm font-medium">Dropdown Options</Label>
                            <Input
                              value={field.options?.join(', ') || ''}
                              onChange={(e) => updateProductField(index, { 
                                options: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                              })}
                              placeholder="Small, Medium, Large, XL"
                              className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">Separate options with commas</p>
                          </div>
                        )}
                        <div className="flex items-center space-x-4 mt-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateProductField(index, { required: e.target.checked })}
                              className="rounded border-gray-300"
                            />
                            <Label className="text-sm font-medium">Required</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={field.enabled}
                              onChange={(e) => updateProductField(index, { enabled: e.target.checked })}
                              className="rounded border-gray-300"
                            />
                            <Label className="text-sm font-medium">Enabled</Label>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Request New {requestType === 'customer' ? 'Customer' : 'Product'} Field</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Field Name</Label>
                <Input
                  value={requestField.name}
                  onChange={(e) => setRequestField({...requestField, name: e.target.value})}
                  placeholder="e.g., company, size"
                />
              </div>
              <div className="space-y-2">
                <Label>Field Label</Label>
                <Input
                  value={requestField.label}
                  onChange={(e) => setRequestField({...requestField, label: e.target.value})}
                  placeholder="e.g., Company Name, Size"
                />
              </div>
              <div className="space-y-2">
                <Label>Field Type</Label>
                <select
                  value={requestField.type}
                  onChange={(e) => setRequestField({...requestField, type: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="date">Date</option>
                  <option value="textarea">Textarea</option>
                  {requestType === 'product' && (
                    <>
                      <option value="select">Dropdown</option>
                      <option value="barcode">Barcode</option>
                      <option value="url">URL</option>
                    </>
                  )}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Reason for Request</Label>
                <textarea
                  value={requestField.reason}
                  onChange={(e) => setRequestField({...requestField, reason: e.target.value})}
                  placeholder="Why do you need this field?"
                  className="w-full px-3 py-2 border rounded h-20"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={requestNewField}>
                  Submit Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}