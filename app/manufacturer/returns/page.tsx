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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Package, Edit, Trash2, AlertTriangle, RotateCcw } from 'lucide-react'
import { showToast } from '@/lib/toast'

export default function ReturnsDefectsManagement() {
  const [activeTab, setActiveTab] = useState('returns')
  const [isAddReturnOpen, setIsAddReturnOpen] = useState(false)
  const [isAddDefectOpen, setIsAddDefectOpen] = useState(false)
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEditReturnOpen, setIsEditReturnOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedReturn, setSelectedReturn] = useState(null)
  const [returnToDelete, setReturnToDelete] = useState(null)
  const [formData, setFormData] = useState({
    productName: '',
    batchNumber: '',
    quantity: '',
    type: 'return',
    reason: '',
    customerName: '',
    returnDate: '',
    status: 'pending',
    qcInspector: '',
    defectType: ''
  })

  useEffect(() => {
    fetchReturns()
  }, [])

  const fetchReturns = async () => {
    try {
      const response = await fetch('/api/manufacturer/returns')
      const data = await response.json()
      setReturns(data.returns || [])
    } catch (error) {
      console.error('Error fetching returns:', error)
    } finally {
      setLoading(false)
    }
  }

  const createReturn = async () => {
    if (!formData.productName || !formData.quantity || !formData.reason) {
      showToast.error('Please fill all required fields')
      return
    }
    
    try {
      const response = await fetch('/api/manufacturer/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        await fetchReturns()
        setIsAddReturnOpen(false)
        setIsAddDefectOpen(false)
        resetForm()
        showToast.success('✅ Record added successfully!')
      } else {
        const error = await response.json()
        showToast.error('❌ Error: ' + error.error)
      }
    } catch (error) {
      console.error('Error creating return:', error)
      showToast.error('❌ Failed to create record')
    }
  }

  const resetForm = () => {
    setFormData({
      productName: '',
      batchNumber: '',
      quantity: '',
      type: 'return',
      reason: '',
      customerName: '',
      returnDate: '',
      status: 'pending',
      qcInspector: '',
      defectType: ''
    })
  }

  const editReturn = (returnItem: any) => {
    setSelectedReturn(returnItem)
    setFormData({
      productName: returnItem.productName || '',
      batchNumber: returnItem.batchNumber || '',
      quantity: returnItem.quantity?.toString() || '',
      type: returnItem.type || 'return',
      reason: returnItem.reason || '',
      customerName: returnItem.customerName || '',
      returnDate: returnItem.returnDate || '',
      status: returnItem.status || 'pending',
      qcInspector: returnItem.qcInspector || '',
      defectType: returnItem.defectType || ''
    })
    setIsEditReturnOpen(true)
  }

  const updateReturn = async () => {
    if (!selectedReturn) return
    
    try {
      const response = await fetch(`/api/manufacturer/returns/${(selectedReturn as any)._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        await fetchReturns()
        setIsEditReturnOpen(false)
        resetForm()
        setSelectedReturn(null)
        showToast.success('✅ Record updated successfully!')
      } else {
        showToast.error('❌ Failed to update record')
      }
    } catch (error) {
      console.error('Error updating return:', error)
      showToast.error('❌ Failed to update record')
    }
  }

  const openDeleteDialog = (returnItem: any) => {
    setReturnToDelete(returnItem)
    setIsDeleteDialogOpen(true)
  }

  const deleteReturn = async () => {
    if (!returnToDelete) return
    
    try {
      const response = await fetch(`/api/manufacturer/returns/${(returnToDelete as any)._id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchReturns()
        setIsDeleteDialogOpen(false)
        setReturnToDelete(null)
        showToast.success('Record deleted successfully!')
      } else {
        showToast.error('Failed to delete record')
      }
    } catch (error) {
      console.error('Error deleting return:', error)
      showToast.error('Failed to delete record')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Returns & Defects Management</h1>
        <p className="text-muted-foreground">Manage product returns and quality control defects</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{returns.filter((r: any) => r.type === 'return').length}</div>
            <p className="text-xs text-muted-foreground">Customer returns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QC Defects</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{returns.filter((r: any) => r.type === 'defect').length}</div>
            <p className="text-xs text-muted-foreground">Quality control rejections</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Package className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{returns.filter((r: any) => r.status === 'pending').length}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{returns.filter((r: any) => r.status === 'processed' || r.status === 'rework').length}</div>
            <p className="text-xs text-muted-foreground">Completed items</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="returns">Returns</TabsTrigger>
          <TabsTrigger value="defects">Defects (QC)</TabsTrigger>
        </TabsList>

        <TabsContent value="returns">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Product Returns</CardTitle>
                  <CardDescription>Manage customer returns and exchanges</CardDescription>
                </div>
                <Dialog open={isAddReturnOpen} onOpenChange={setIsAddReturnOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Return
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Return</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Product Name *</Label>
                          <Input 
                            placeholder="Enter product name" 
                            value={formData.productName}
                            onChange={(e) => setFormData({...formData, productName: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Batch Number</Label>
                          <Input 
                            placeholder="Enter batch number" 
                            value={formData.batchNumber}
                            onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Quantity *</Label>
                          <Input 
                            type="number"
                            placeholder="Enter quantity" 
                            value={formData.quantity}
                            onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processed">Processed</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Customer Name</Label>
                          <Input 
                            placeholder="Enter customer name" 
                            value={formData.customerName}
                            onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Return Date</Label>
                          <Input 
                            type="date"
                            value={formData.returnDate}
                            onChange={(e) => setFormData({...formData, returnDate: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Reason *</Label>
                        <Textarea 
                          placeholder="Enter reason for return" 
                          value={formData.reason}
                          onChange={(e) => setFormData({...formData, reason: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAddReturnOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => { setFormData({...formData, type: 'return'}); createReturn(); }}>
                        Add Return
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {returns.filter((r: any) => r.type === 'return').length === 0 ? (
                <div className="text-center py-12">
                  <RotateCcw className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No returns found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start by adding your first return record
                  </p>
                  <Button onClick={() => setIsAddReturnOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Return
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                        </TableRow>
                      ) : returns.filter((r: any) => r.type === 'return').map((returnItem: any) => (
                        <TableRow key={returnItem.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{returnItem.productName}</div>
                              {returnItem.batchNumber && (
                                <div className="text-sm text-muted-foreground">Batch: {returnItem.batchNumber}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{returnItem.quantity}</TableCell>
                          <TableCell>{returnItem.customerName || '-'}</TableCell>
                          <TableCell>{returnItem.returnDate || '-'}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              returnItem.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : returnItem.status === 'processed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {returnItem.status}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{returnItem.reason}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <Button variant="ghost" size="sm" onClick={() => editReturn(returnItem)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => openDeleteDialog(returnItem)}>
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
        </TabsContent>

        <TabsContent value="defects">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Defective Products (QC)</CardTitle>
                  <CardDescription>Quality control defects and rejections</CardDescription>
                </div>
                <Dialog open={isAddDefectOpen} onOpenChange={setIsAddDefectOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Defect
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Defect (QC)</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Product Name *</Label>
                          <Input 
                            placeholder="Enter product name" 
                            value={formData.productName}
                            onChange={(e) => setFormData({...formData, productName: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Batch Number</Label>
                          <Input 
                            placeholder="Enter batch number" 
                            value={formData.batchNumber}
                            onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Quantity *</Label>
                          <Input 
                            type="number"
                            placeholder="Enter quantity" 
                            value={formData.quantity}
                            onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Defect Type</Label>
                          <Select value={formData.defectType} onValueChange={(value) => setFormData({...formData, defectType: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select defect type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="stitching">Stitching Defect</SelectItem>
                              <SelectItem value="fabric">Fabric Defect</SelectItem>
                              <SelectItem value="color">Color Mismatch</SelectItem>
                              <SelectItem value="size">Size Issue</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="rework">Rework</SelectItem>
                              <SelectItem value="scrap">Scrap</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>QC Inspector *</Label>
                          <Input 
                            placeholder="Enter QC inspector name" 
                            value={formData.qcInspector}
                            onChange={(e) => setFormData({...formData, qcInspector: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Inspection Date</Label>
                          <Input 
                            type="date"
                            value={formData.returnDate}
                            onChange={(e) => setFormData({...formData, returnDate: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Defect Description *</Label>
                        <Textarea 
                          placeholder="Describe the defect details" 
                          value={formData.reason}
                          onChange={(e) => setFormData({...formData, reason: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAddDefectOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => { setFormData({...formData, type: 'defect'}); createReturn(); }}>
                        Add Defect
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {returns.filter((r: any) => r.type === 'defect').length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No defects found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start by adding your first defect record from QC
                  </p>
                  <Button onClick={() => setIsAddDefectOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Defect
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Defect Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>QC Inspector</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center">Loading...</TableCell>
                        </TableRow>
                      ) : returns.filter((r: any) => r.type === 'defect').map((defectItem: any) => (
                        <TableRow key={defectItem.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{defectItem.productName}</div>
                              {defectItem.batchNumber && (
                                <div className="text-sm text-muted-foreground">Batch: {defectItem.batchNumber}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {defectItem.defectType || 'Not specified'}
                            </span>
                          </TableCell>
                          <TableCell>{defectItem.quantity}</TableCell>
                          <TableCell>{defectItem.qcInspector || '-'}</TableCell>
                          <TableCell>{defectItem.returnDate || '-'}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              defectItem.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : defectItem.status === 'rework'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {defectItem.status}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{defectItem.reason}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <Button variant="ghost" size="sm" onClick={() => editReturn(defectItem)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => openDeleteDialog(defectItem)}>
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
        </TabsContent>
      </Tabs>

      <Dialog open={isEditReturnOpen} onOpenChange={(open) => {
        setIsEditReturnOpen(open)
        if (!open) {
          resetForm()
          setSelectedReturn(null)
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit {formData.type === 'return' ? 'Return' : 'Defect'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Name *</Label>
                <Input 
                  placeholder="Enter product name" 
                  value={formData.productName}
                  onChange={(e) => setFormData({...formData, productName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Batch Number</Label>
                <Input 
                  placeholder="Enter batch number" 
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input 
                  type="number"
                  placeholder="Enter quantity" 
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.type === 'return' ? (
                      <>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processed">Processed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rework">Rework</SelectItem>
                        <SelectItem value="scrap">Scrap</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formData.type === 'return' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input 
                    placeholder="Enter customer name" 
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Return Date</Label>
                  <Input 
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) => setFormData({...formData, returnDate: e.target.value})}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Defect Type</Label>
                  <Select value={formData.defectType} onValueChange={(value) => setFormData({...formData, defectType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select defect type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stitching">Stitching Defect</SelectItem>
                      <SelectItem value="fabric">Fabric Defect</SelectItem>
                      <SelectItem value="color">Color Mismatch</SelectItem>
                      <SelectItem value="size">Size Issue</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>QC Inspector</Label>
                  <Input 
                    placeholder="Enter QC inspector name" 
                    value={formData.qcInspector}
                    onChange={(e) => setFormData({...formData, qcInspector: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Inspection Date</Label>
                  <Input 
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) => setFormData({...formData, returnDate: e.target.value})}
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>{formData.type === 'return' ? 'Reason' : 'Defect Description'} *</Label>
              <Textarea 
                placeholder={formData.type === 'return' ? 'Enter reason for return' : 'Describe the defect details'} 
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditReturnOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateReturn}>
              Update {formData.type === 'return' ? 'Return' : 'Defect'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Record</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Are you sure you want to delete this record? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteReturn}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}