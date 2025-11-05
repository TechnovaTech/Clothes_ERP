'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { Plus, CheckCircle, XCircle, Clock, AlertTriangle, FileText, Search, Filter, Eye, Edit, Scissors, Ruler, Palette, Shirt, Package } from 'lucide-react'

export default function QualityControl() {
  const { toast } = useToast()
  const [isCreateInspectionOpen, setIsCreateInspectionOpen] = useState(false)
  const [isEditInspectionOpen, setIsEditInspectionOpen] = useState(false)
  const [isViewInspectionOpen, setIsViewInspectionOpen] = useState(false)
  const [selectedInspection, setSelectedInspection] = useState<any>(null)
  const [editingInspection, setEditingInspection] = useState<any>(null)
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [messageContent, setMessageContent] = useState({ title: '', message: '', type: 'info' })
  const [qualityChecks, setQualityChecks] = useState<any[]>([])
  const [productionBatches, setProductionBatches] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formData, setFormData] = useState({
    batchId: '',
    productType: '',
    inspector: '',
    checkDate: '',
    inspectionType: '',
    totalQuantity: '',
    sampleSize: '',
    acceptableDefectRate: '5',
    actualDefectRate: '',
    notes: '',
    checkpoints: {
      stitchingQuality: false,
      fabricQuality: false,
      colorConsistency: false,
      sizeAccuracy: false,
      buttonAttachment: false,
      zipperFunction: false,
      labelPlacement: false,
      finishing: false,
      packaging: false
    }
  })

  useEffect(() => {
    fetchQualityChecks()
    fetchProductionBatches()
    fetchEmployees()
  }, [])

  const fetchQualityChecks = async () => {
    try {
      const response = await fetch('/api/manufacturer/quality')
      const data = await response.json()
      setQualityChecks(data.qualityChecks || [])
    } catch (error) {
      console.error('Error fetching quality checks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProductionBatches = async () => {
    try {
      const response = await fetch('/api/manufacturer/production')
      const data = await response.json()
      setProductionBatches(data.orders || [])
    } catch (error) {
      console.error('Error fetching production batches:', error)
      // Fallback sample data for testing
      setProductionBatches([
        { id: 'BATCH-001', product: 'Cotton T-Shirt' },
        { id: 'BATCH-002', product: 'Denim Jeans' },
        { id: 'BATCH-003', product: 'Summer Dress' }
      ])
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      const data = await response.json()
      setEmployees(data.employees || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
      // Fallback sample data for testing
      setEmployees([
        { id: '1', name: 'John Smith', role: 'QC Inspector', department: 'Quality Control' },
        { id: '2', name: 'Sarah Johnson', role: 'Senior QC Inspector', department: 'Quality Control' },
        { id: '3', name: 'Mike Wilson', role: 'QC Manager', department: 'Quality Control' }
      ])
    }
  }

  const createQualityCheck = async () => {
    try {
      const response = await fetch('/api/manufacturer/quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // Auto-update inventory for passed items
        if (result.qualityCheck.passedItems > 0) {
          await updateInventory({
            batchId: formData.batchId,
            productType: formData.productType,
            passedQuantity: result.qualityCheck.passedItems,
            defectiveQuantity: result.qualityCheck.failedItems,
            qcId: result.qualityCheck.id
          })
        }
        
        // Add defective items to returns defect tab
        if (result.qualityCheck.failedItems > 0) {
          await addDefectiveToReturns({
            productName: formData.productType,
            batchNumber: formData.batchId,
            quantity: result.qualityCheck.failedItems,
            qcInspector: formData.inspector,
            defectType: getDefectType(formData.checkpoints),
            reason: formData.notes || 'Quality control rejection',
            returnDate: formData.checkDate
          })
        }
        
        await fetchQualityChecks()
        setIsCreateInspectionOpen(false)
        resetForm()
        toast({
          title: "Success",
          description: `Quality inspection created. ${result.qualityCheck.passedItems} items added to inventory. ${result.qualityCheck.failedItems} defects added to returns.`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to create quality inspection.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating quality check:', error)
      toast({
        title: "Error",
        description: "Failed to create quality inspection.",
        variant: "destructive",
      })
    }
  }

  const updateInventory = async (data: any) => {
    try {
      await fetch('/api/manufacturer/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: data.batchId,
          productType: data.productType,
          perfectQuantity: data.passedQuantity,
          defectiveQuantity: data.defectiveQuantity,
          qcId: data.qcId,
          status: 'available',
          source: 'quality_control',
          description: `QC Approved - ${data.passedQuantity} perfect pieces from batch ${data.batchId}`
        })
      })
    } catch (error) {
      console.error('Error updating inventory:', error)
    }
  }

  const addDefectiveToReturns = async (data: any) => {
    try {
      await fetch('/api/manufacturer/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          type: 'defect',
          status: 'pending'
        })
      })
    } catch (error) {
      console.error('Error adding defective items to returns:', error)
    }
  }

  const getDefectType = (checkpoints: any) => {
    if (!checkpoints.stitchingQuality) return 'stitching'
    if (!checkpoints.fabricQuality) return 'fabric'
    if (!checkpoints.colorConsistency) return 'color'
    if (!checkpoints.sizeAccuracy) return 'size'
    return 'other'
  }

  const addToInventoryManual = async (check: any) => {
    try {
      // Check if already added to inventory
      const checkResponse = await fetch('/api/manufacturer/inventory')
      const inventoryData = await checkResponse.json()
      const existingEntry = inventoryData.inventory?.find((item: any) => item.qcId === check.id)
      
      if (existingEntry) {
        setMessageContent({
          title: 'Already Added',
          message: `Products from QC ${check.id} are already in inventory.`,
          type: 'warning'
        })
        setShowMessageDialog(true)
        return
      }
      
      const response = await fetch('/api/manufacturer/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: check.batchId,
          productType: check.productType,
          perfectQuantity: check.passedItems,
          defectiveQuantity: check.failedItems,
          qcId: check.id,
          status: 'available',
          source: 'quality_control',
          description: `Manual QC Addition - ${check.passedItems} perfect pieces from batch ${check.batchId}`
        })
      })
      
      if (response.ok) {
        setMessageContent({
          title: 'Success',
          message: `${check.passedItems} perfect products added to inventory successfully.`,
          type: 'success'
        })
        setShowMessageDialog(true)
      } else {
        setMessageContent({
          title: 'Error',
          message: 'Failed to add products to inventory.',
          type: 'error'
        })
        setShowMessageDialog(true)
      }
    } catch (error) {
      console.error('Error adding to inventory:', error)
      setMessageContent({
        title: 'Error',
        message: 'Failed to add products to inventory.',
        type: 'error'
      })
      setShowMessageDialog(true)
    }
  }

  const addToDefectsManual = async (check: any) => {
    try {
      // Check if already added to defects
      const checkResponse = await fetch('/api/manufacturer/returns')
      const returnsData = await checkResponse.json()
      const existingDefect = returnsData.returns?.find((item: any) => item.batchNumber === check.batchId && item.type === 'defect')
      
      if (existingDefect) {
        setMessageContent({
          title: 'Already Added',
          message: `Defects from QC ${check.id} are already in returns.`,
          type: 'warning'
        })
        setShowMessageDialog(true)
        return
      }
      
      const response = await fetch('/api/manufacturer/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: check.productType,
          batchNumber: check.batchId,
          quantity: check.failedItems,
          type: 'defect',
          reason: check.notes || 'Quality control rejection - failed inspection',
          qcInspector: check.inspector,
          returnDate: check.checkDate,
          status: 'pending',
          defectType: getDefectType(check.checkpoints)
        })
      })
      
      if (response.ok) {
        setMessageContent({
          title: 'Success',
          message: `${check.failedItems} defective products added to returns successfully.`,
          type: 'success'
        })
        setShowMessageDialog(true)
      } else {
        setMessageContent({
          title: 'Error',
          message: 'Failed to add defective products to returns.',
          type: 'error'
        })
        setShowMessageDialog(true)
      }
    } catch (error) {
      console.error('Error adding to defects:', error)
      setMessageContent({
        title: 'Error',
        message: 'Failed to add defective products to returns.',
        type: 'error'
      })
      setShowMessageDialog(true)
    }
  }

  const updateQualityCheck = async () => {
    try {
      const response = await fetch(`/api/manufacturer/quality/${editingInspection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        await fetchQualityChecks()
        setIsEditInspectionOpen(false)
        setEditingInspection(null)
        resetForm()
        toast({
          title: "Success",
          description: "Quality inspection updated successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update quality inspection.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating quality check:', error)
      toast({
        title: "Error",
        description: "Failed to update quality inspection.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      batchId: '',
      productType: '',
      inspector: '',
      checkDate: '',
      inspectionType: '',
      totalQuantity: '',
      sampleSize: '',
      acceptableDefectRate: '5',
      actualDefectRate: '',
      notes: '',
      checkpoints: {
        stitchingQuality: false,
        fabricQuality: false,
        colorConsistency: false,
        sizeAccuracy: false,
        buttonAttachment: false,
        zipperFunction: false,
        labelPlacement: false,
        finishing: false,
        packaging: false
      }
    })
  }

  const openViewDialog = (inspection: any) => {
    setSelectedInspection(inspection)
    setIsViewInspectionOpen(true)
  }

  const openEditDialog = (inspection: any) => {
    setEditingInspection(inspection)
    setFormData({
      batchId: inspection.batchId || '',
      productType: inspection.productType || '',
      inspector: inspection.inspector || '',
      checkDate: inspection.checkDate || '',
      inspectionType: inspection.inspectionType || '',
      totalQuantity: inspection.totalQuantity || '',
      sampleSize: inspection.sampleSize || '',
      acceptableDefectRate: inspection.acceptableDefectRate || '5',
      actualDefectRate: inspection.actualDefectRate || inspection.defectRate || '',
      notes: inspection.notes || '',
      checkpoints: inspection.checkpoints || {
        stitchingQuality: false,
        fabricQuality: false,
        colorConsistency: false,
        sizeAccuracy: false,
        buttonAttachment: false,
        zipperFunction: false,
        labelPlacement: false,
        finishing: false,
        packaging: false
      }
    })
    setIsEditInspectionOpen(true)
  }

  // Calculate defect analysis from actual data
  const calculateDefectAnalysis = () => {
    const defectTypes = {
      'Stitching Defects': { count: 0, color: 'bg-red-500' },
      'Size Variations': { count: 0, color: 'bg-orange-500' },
      'Color Inconsistency': { count: 0, color: 'bg-yellow-500' },
      'Fabric Issues': { count: 0, color: 'bg-blue-500' },
      'Button/Zipper Defects': { count: 0, color: 'bg-purple-500' },
      'Label/Tag Issues': { count: 0, color: 'bg-green-500' }
    }
    
    qualityChecks.forEach(check => {
      if (check.checkpoints) {
        if (!check.checkpoints.stitchingQuality) defectTypes['Stitching Defects'].count++
        if (!check.checkpoints.sizeAccuracy) defectTypes['Size Variations'].count++
        if (!check.checkpoints.colorConsistency) defectTypes['Color Inconsistency'].count++
        if (!check.checkpoints.fabricQuality) defectTypes['Fabric Issues'].count++
        if (!check.checkpoints.buttonAttachment || !check.checkpoints.zipperFunction) defectTypes['Button/Zipper Defects'].count++
        if (!check.checkpoints.labelPlacement) defectTypes['Label/Tag Issues'].count++
      }
    })
    
    const totalDefects = Object.values(defectTypes).reduce((sum, defect) => sum + defect.count, 0)
    
    return Object.entries(defectTypes).map(([type, data]) => ({
      type,
      count: data.count,
      percentage: totalDefects > 0 ? Math.round((data.count / totalDefects) * 100) : 0,
      color: data.color
    })).filter(item => item.count > 0)
  }
  
  const clothingDefects = calculateDefectAnalysis()

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'passed':
        return <Badge className="bg-green-100 text-green-800">Passed</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'in progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const filteredQualityChecks = qualityChecks.filter(check => {
    const matchesSearch = check.batchId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         check.productType?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || check.status?.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Total Inspections</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualityChecks.length}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Pass Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {qualityChecks.length > 0 
                ? Math.round((qualityChecks.filter(q => q.status === 'passed').length / qualityChecks.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {qualityChecks.filter(q => q.status === 'passed').length} of {qualityChecks.length} passed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Pending QC</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{qualityChecks.filter(q => q.status === 'pending').length}</div>
            <p className="text-xs text-muted-foreground">Awaiting inspection</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Rejected Items</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{qualityChecks.filter(q => q.status === 'failed').length}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Defect Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Clothing Defect Analysis</CardTitle>
            <CardDescription>Common defects in garment production</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {clothingDefects.map((defect, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{defect.type}</span>
                  <span className="text-muted-foreground">{defect.count} ({defect.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${defect.color}`}
                    style={{ width: `${defect.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quality Checkpoints */}
        <Card>
          <CardHeader>
            <CardTitle>Standard QC Checkpoints</CardTitle>
            <CardDescription>Essential quality control points for garments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Scissors className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Stitching Quality</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shirt className="h-4 w-4 text-green-500" />
                <span className="text-sm">Fabric Quality</span>
              </div>
              <div className="flex items-center space-x-2">
                <Palette className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Color Consistency</span>
              </div>
              <div className="flex items-center space-x-2">
                <Ruler className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Size Accuracy</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">Button Attachment</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Zipper Function</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Control Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quality Control Records</CardTitle>
              <CardDescription>Manage garment quality inspections and reports</CardDescription>
            </div>
            <Dialog open={isCreateInspectionOpen} onOpenChange={setIsCreateInspectionOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Inspection
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
                <DialogHeader className="flex-shrink-0 pb-4 border-b">
                  <DialogTitle className="text-xl font-semibold">Create Quality Inspection</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">Set up a new quality control inspection for garment batch</DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-1 py-4">
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Inspection Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Batch ID *</Label>
                          <Select value={formData.batchId} onValueChange={(value) => setFormData({...formData, batchId: value})}>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select batch" />
                            </SelectTrigger>
                            <SelectContent>
                              {productionBatches.map((batch) => (
                                <SelectItem key={batch.id} value={batch.id}>
                                  {batch.id} - {batch.product}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Product Type *</Label>
                          <Select value={formData.productType} onValueChange={(value) => setFormData({...formData, productType: value})}>
                            <SelectTrigger className="h-10">
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
                          <Label className="text-sm font-medium">Inspector *</Label>
                          <Select value={formData.inspector} onValueChange={(value) => setFormData({...formData, inspector: value})}>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select inspector" />
                            </SelectTrigger>
                            <SelectContent>
                              {employees.filter(emp => emp.department === 'Quality Control' || emp.role?.includes('QC') || emp.role?.includes('Inspector')).map((employee) => (
                                <SelectItem key={employee.id} value={employee.name}>
                                  {employee.name} - {employee.role || 'QC Inspector'}
                                </SelectItem>
                              ))}
                              {employees.filter(emp => emp.department === 'Quality Control' || emp.role?.includes('QC') || emp.role?.includes('Inspector')).length === 0 && (
                                <SelectItem value="default-inspector">Default QC Inspector</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Inspection Date *</Label>
                          <Input 
                            type="date" 
                            value={formData.checkDate}
                            onChange={(e) => setFormData({...formData, checkDate: e.target.value})}
                            className="h-10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Inspection Parameters */}
                    <div className="p-4 rounded-lg border">
                      <h3 className="text-sm font-medium mb-3">Inspection Parameters</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Total Quantity</Label>
                          <Input 
                            type="number" 
                            placeholder="1000" 
                            value={formData.totalQuantity}
                            onChange={(e) => setFormData({...formData, totalQuantity: e.target.value})}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Sample Size</Label>
                          <Input 
                            type="number" 
                            placeholder="50" 
                            value={formData.sampleSize}
                            onChange={(e) => setFormData({...formData, sampleSize: e.target.value})}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Acceptable Defect Rate (%)</Label>
                          <Input 
                            type="number" 
                            placeholder="5" 
                            value={formData.acceptableDefectRate}
                            onChange={(e) => setFormData({...formData, acceptableDefectRate: e.target.value})}
                            className="h-10"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Actual Defect Rate (%) *</Label>
                          <Input 
                            type="number" 
                            placeholder="Enter actual defect percentage found" 
                            value={formData.actualDefectRate}
                            onChange={(e) => setFormData({...formData, actualDefectRate: e.target.value})}
                            className="h-10"
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label className="text-sm font-medium">Inspection Type</Label>
                        <Select value={formData.inspectionType} onValueChange={(value) => setFormData({...formData, inspectionType: value})}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select inspection type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="incoming">Incoming Material Inspection</SelectItem>
                            <SelectItem value="in-process">In-Process Quality Check</SelectItem>
                            <SelectItem value="final">Final Product Inspection</SelectItem>
                            <SelectItem value="pre-shipment">Pre-Shipment Inspection</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Quality Checkpoints */}
                    <div className="p-4 rounded-lg border">
                      <h3 className="text-sm font-medium mb-3">Quality Checkpoints</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {Object.entries(formData.checkpoints).map(([key, value]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <Checkbox 
                              id={key}
                              checked={value}
                              onCheckedChange={(checked) => 
                                setFormData({
                                  ...formData, 
                                  checkpoints: {...formData.checkpoints, [key]: checked}
                                })
                              }
                            />
                            <Label htmlFor={key} className="text-sm capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="p-4 rounded-lg border">
                      <h3 className="text-sm font-medium mb-3">Inspection Notes</h3>
                      <Textarea 
                        placeholder="Enter detailed inspection notes, observations, and specific defects found..." 
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        className="min-h-[100px] resize-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 flex justify-end space-x-3 pt-4 border-t bg-white">
                  <Button variant="outline" onClick={() => setIsCreateInspectionOpen(false)} className="px-6">
                    Cancel
                  </Button>
                  <Button onClick={createQualityCheck} className="px-6 bg-black hover:bg-black">
                    Create Inspection
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search inspections..."
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
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">QC ID</TableHead>
                  <TableHead className="text-center">Batch ID</TableHead>
                  <TableHead className="text-center">Product Type</TableHead>
                  <TableHead className="text-center">Inspector</TableHead>
                  <TableHead className="text-center">Date</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Defect Rate & Counts</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : filteredQualityChecks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">No inspections found</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {qualityChecks.length === 0 ? 'Start by creating your first quality inspection' : 'Try adjusting your search or filters'}
                      </p>
                      <Button onClick={() => setIsCreateInspectionOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Inspection
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQualityChecks.map((check) => (
                    <TableRow key={check.id}>
                      <TableCell className="text-center font-medium">{check.id}</TableCell>
                      <TableCell className="text-center">{check.batchId}</TableCell>
                      <TableCell className="text-center">{check.productType}</TableCell>
                      <TableCell className="text-center">{check.inspector}</TableCell>
                      <TableCell className="text-center">{check.checkDate}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {getStatusIcon(check.status)}
                          {getStatusBadge(check.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <span className={check.defectRate > 10 ? 'text-red-600 font-medium' : 'text-green-600'}>
                            {check.defectRate || 0}%
                          </span>
                          <div className="text-xs text-muted-foreground">
                            ✓ {check.passedItems || 0} | ✗ {check.failedItems || 0}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => openViewDialog(check)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(check)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          {check.passedItems > 0 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => addToInventoryManual(check)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Package className="w-4 h-4" />
                            </Button>
                          )}
                          {check.failedItems > 0 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => addToDefectsManual(check)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </Button>
                          )}
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

      {/* Edit Inspection Dialog */}
      <Dialog open={isEditInspectionOpen} onOpenChange={setIsEditInspectionOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4 border-b">
            <DialogTitle className="text-xl font-semibold">Edit Quality Inspection</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Update quality control inspection details</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1 py-4">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Inspection Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Batch ID *</Label>
                    <Select value={formData.batchId} onValueChange={(value) => setFormData({...formData, batchId: value})}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {productionBatches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.id} - {batch.product}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Product Type *</Label>
                    <Select value={formData.productType} onValueChange={(value) => setFormData({...formData, productType: value})}>
                      <SelectTrigger className="h-10">
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
                    <Label className="text-sm font-medium">Inspector *</Label>
                    <Select value={formData.inspector} onValueChange={(value) => setFormData({...formData, inspector: value})}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select inspector" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.filter(emp => emp.department === 'Quality Control' || emp.role?.includes('QC') || emp.role?.includes('Inspector')).map((employee) => (
                          <SelectItem key={employee.id} value={employee.name}>
                            {employee.name} - {employee.role || 'QC Inspector'}
                          </SelectItem>
                        ))}
                        {employees.filter(emp => emp.department === 'Quality Control' || emp.role?.includes('QC') || emp.role?.includes('Inspector')).length === 0 && (
                          <SelectItem value="default-inspector">Default QC Inspector</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Inspection Date *</Label>
                    <Input 
                      type="date" 
                      value={formData.checkDate}
                      onChange={(e) => setFormData({...formData, checkDate: e.target.value})}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Inspection Parameters */}
              <div className="p-4 rounded-lg border">
                <h3 className="text-sm font-medium mb-3">Inspection Parameters</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Total Quantity</Label>
                    <Input 
                      type="number" 
                      placeholder="1000" 
                      value={formData.totalQuantity}
                      onChange={(e) => setFormData({...formData, totalQuantity: e.target.value})}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Sample Size</Label>
                    <Input 
                      type="number" 
                      placeholder="50" 
                      value={formData.sampleSize}
                      onChange={(e) => setFormData({...formData, sampleSize: e.target.value})}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Acceptable Defect Rate (%)</Label>
                    <Input 
                      type="number" 
                      placeholder="5" 
                      value={formData.acceptableDefectRate}
                      onChange={(e) => setFormData({...formData, acceptableDefectRate: e.target.value})}
                      className="h-10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Actual Defect Rate (%) *</Label>
                    <Input 
                      type="number" 
                      placeholder="Enter actual defect percentage found" 
                      value={formData.actualDefectRate}
                      onChange={(e) => setFormData({...formData, actualDefectRate: e.target.value})}
                      className="h-10"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label className="text-sm font-medium">Inspection Type</Label>
                  <Select value={formData.inspectionType} onValueChange={(value) => setFormData({...formData, inspectionType: value})}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select inspection type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="incoming">Incoming Material Inspection</SelectItem>
                      <SelectItem value="in-process">In-Process Quality Check</SelectItem>
                      <SelectItem value="final">Final Product Inspection</SelectItem>
                      <SelectItem value="pre-shipment">Pre-Shipment Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quality Checkpoints */}
              <div className="p-4 rounded-lg border">
                <h3 className="text-sm font-medium mb-3">Quality Checkpoints</h3>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(formData.checkpoints).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`edit-${key}`}
                        checked={value}
                        onCheckedChange={(checked) => 
                          setFormData({
                            ...formData, 
                            checkpoints: {...formData.checkpoints, [key]: checked}
                          })
                        }
                      />
                      <Label htmlFor={`edit-${key}`} className="text-sm capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="p-4 rounded-lg border">
                <h3 className="text-sm font-medium mb-3">Inspection Notes</h3>
                <Textarea 
                  placeholder="Enter detailed inspection notes, observations, and specific defects found..." 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="min-h-[100px] resize-none"
                />
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 flex justify-end space-x-3 pt-4 border-t bg-white">
            <Button variant="outline" onClick={() => setIsEditInspectionOpen(false)} className="px-6">
              Cancel
            </Button>
            <Button onClick={updateQualityCheck} className="px-6 bg-black hover:bg-black">
              Update Inspection
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Inspection Dialog */}
      <Dialog open={isViewInspectionOpen} onOpenChange={setIsViewInspectionOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quality Inspection Details</DialogTitle>
            <DialogDescription>View detailed inspection information</DialogDescription>
          </DialogHeader>
          {selectedInspection && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><strong>QC ID:</strong> {selectedInspection.id}</div>
                <div><strong>Batch ID:</strong> {selectedInspection.batchId}</div>
                <div><strong>Product Type:</strong> {selectedInspection.productType}</div>
                <div><strong>Inspector:</strong> {selectedInspection.inspector}</div>
                <div><strong>Date:</strong> {selectedInspection.checkDate}</div>
                <div><strong>Status:</strong> {getStatusBadge(selectedInspection.status)}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><strong>Total Qty:</strong> {selectedInspection.totalQuantity}</div>
                <div><strong>Sample Size:</strong> {selectedInspection.sampleSize}</div>
                <div><strong>Defect Rate:</strong> {selectedInspection.defectRate}%</div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedInspection.passedItems || 0}</div>
                  <div className="text-sm text-muted-foreground">Perfect Products</div>
                  <div className="text-xs text-green-600">Added to Inventory</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{selectedInspection.failedItems || 0}</div>
                  <div className="text-sm text-muted-foreground">Defective Products</div>
                  <div className="text-xs text-red-600">Requires Action</div>
                </div>
              </div>
              {selectedInspection.notes && (
                <div><strong>Notes:</strong> {selectedInspection.notes}</div>
              )}
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setIsViewInspectionOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={`flex items-center space-x-2 ${
              messageContent.type === 'success' ? 'text-green-600' :
              messageContent.type === 'error' ? 'text-red-600' :
              messageContent.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
            }`}>
              {messageContent.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {messageContent.type === 'error' && <XCircle className="w-5 h-5" />}
              {messageContent.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
              {messageContent.type === 'info' && <AlertTriangle className="w-5 h-5" />}
              <span>{messageContent.title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">{messageContent.message}</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowMessageDialog(false)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Toaster />
    </div>
  )
}