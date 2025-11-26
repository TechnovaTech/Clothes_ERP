"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useStore } from "@/lib/store-context"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Users,
  Settings,
  UserPlus,
  UserCheck,
  ShoppingBag,
  Download,
  Upload,
  AlertTriangle,
} from "lucide-react"
import { FeatureGuard } from "@/components/feature-guard"
import { showToast, confirmDelete } from "@/lib/toast"
import { useLanguage } from "@/lib/language-context"
import { formatDateToDDMMYYYY } from "@/lib/date-utils"

interface CustomerField {
  name: string
  label: string
  type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'textarea'
  required: boolean
  enabled: boolean
}

interface Customer {
  id: string
  name: string
  phone?: string // Can contain multiple numbers separated by commas
  orderCount: number
  totalSpent: number
  lastOrderDate: string
  createdAt: string
  [key: string]: any
}

export default function CustomersPage() {
  const { t } = useLanguage()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [customerFormData, setCustomerFormData] = useState<Record<string, any>>({})
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 20
  const [customerFields, setCustomerFields] = useState<CustomerField[]>([])
  const [fieldsLoading, setFieldsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false)
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeFields: 0,
    requiredFields: 0
  })

  const { storeName, tenantId } = useStore()

  const fetchCustomerFields = async () => {
    try {
      const response = await fetch(`/api/customer-fields?t=${Date.now()}`)
      if (response.ok) {
        const fields = await response.json()
        console.log('Customer fields received:', fields)
        setCustomerFields(fields)
        const initialFormData: Record<string, any> = {}
        fields.forEach((field: CustomerField) => {
          initialFormData[field.name] = ''
        })
        setCustomerFormData(initialFormData)
      }
    } catch (error) {
      console.error('Failed to fetch customer fields:', error)
    } finally {
      setFieldsLoading(false)
    }
  }

  const fetchCustomers = async (page = 1) => {
    try {
      const response = await fetch(`/api/customers?page=${page}&limit=${itemsPerPage}`)
      if (response.ok) {
        const result = await response.json()
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages)
          setTotalItems(result.pagination.total)
          setCustomers(result.data || [])
        } else {
          setCustomers(result.data || result || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/customers/stats', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.warn('Customer stats API unavailable:', error)
      // Don't set fallback here - it's handled in useEffect
    }
  }

  useEffect(() => {
    const initData = async () => {
      await fetchCustomerFields()
      await fetchCustomers(1)
    }
    initData()
  }, [])

  useEffect(() => {
    fetchCustomers(currentPage)
  }, [currentPage])

  // Update stats when data changes - use direct fallback for live compatibility
  useEffect(() => {
    if (totalItems >= 0 && customerFields.length >= 0) {
      // Set stats directly from available data for live server compatibility
      setStats({
        totalCustomers: totalItems,
        activeFields: customerFields.length,
        requiredFields: customerFields.filter(f => f.required).length
      })
      // Try to fetch enhanced stats but don't depend on it
      fetchStats().catch(() => {})
    }
  }, [totalItems, customerFields])

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      (customer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone || '').includes(searchTerm)
    return matchesSearch
  })

  if (loading || fieldsLoading) {
    return (
      <MainLayout title={t('customers')}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('loading')}</div>
        </div>
      </MainLayout>
    )
  }

  const resetFormData = () => {
    const initialFormData: Record<string, any> = {}
    customerFields.forEach((field: CustomerField) => {
      initialFormData[field.name] = ''
    })
    setCustomerFormData(initialFormData)
  }

  const populateFormData = (customer: Customer) => {
    const formData: Record<string, any> = {}
    customerFields.forEach((field: CustomerField) => {
      formData[field.name] = customer[field.name] || ''
    })
    setCustomerFormData(formData)
  }

  const renderFormField = (field: CustomerField) => {
    const value = customerFormData[field.name] || ''
    const onChange = (newValue: string) => {
      setCustomerFormData(prev => ({ ...prev, [field.name]: newValue }))
    }

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        )
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        )
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        )
      case 'phone':
        return (
          <div>
            <Input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="9876543210, 9123456789"
            />
            <p className="text-xs text-muted-foreground mt-1">{t('multiplePhoneNumbersHint')}</p>
          </div>
        )
      default:
        return (
          <Input
            type={field.type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        )
    }
  }

  const { totalCustomers, activeFields, requiredFields } = stats

  return (
    <MainLayout title={t('customers')}>
      <FeatureGuard feature="customers">
        <div className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('totalCustomers')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCustomers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('activeFields')}</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeFields}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('requiredFields')}</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{requiredFields}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('customerDatabase')}</CardTitle>
                  <CardDescription>{t('manageCustomerDatabase')}</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      
                      const formData = new FormData()
                      formData.append('file', file)
                      
                      try {
                        const response = await fetch('/api/customers/import', {
                          method: 'POST',
                          body: formData
                        })
                        
                        if (response.ok) {
                          const result = await response.json()
                          const message = result.skipped > 0 
                            ? `✅ ${t('importedCustomers').replace('{0}', result.count).replace('{1}', result.skipped)}`
                            : `✅ ${t('successfullyImportedCustomers').replace('{0}', result.count)}`
                          showToast.success(message)
                          fetchCustomers(currentPage)
                        } else {
                          const errorData = await response.json()
                          showToast.error(`❌ ${errorData.error || t('importFailed')}`)
                        }
                      } catch (error) {
                        showToast.error(`❌ ${t('importError')}`)
                      } finally {
                        e.target.value = ''
                      }
                    }}
                    style={{ display: 'none' }}
                    id="customer-csv-upload"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('customer-csv-upload')?.click()}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('importCSV')}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.open('/api/customers/export', '_blank')}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {t('exportCSV')}
                  </Button>
                  {selectedCustomers.length > 0 && (
                    <Button 
                      variant="destructive"
                      onClick={() => setIsBulkDeleteDialogOpen(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('delete')} ({selectedCustomers.length})
                    </Button>
                  )}
                  <Button 
                    variant="destructive"
                    onClick={() => setIsClearAllDialogOpen(true)}
                  >
                    {t('clearAll')}
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/tenant/field-settings">
                      <Settings className="w-4 h-4 mr-2" />
                      {t('configureFields')}
                    </Link>
                  </Button>
                  <Button onClick={() => {
                    setEditingCustomer(null)
                    resetFormData()
                    setIsCustomerDialogOpen(true)
                  }}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {t('addCustomer')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t('searchCustomers')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {filteredCustomers.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">{t('noCustomersFound')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {customers.length === 0 ? t('startByAddingFirstCustomer') : t('tryAdjustingSearchFilters')}
                  </p>
                  <Button onClick={() => {
                    setEditingCustomer(null)
                    resetFormData()
                    setIsCustomerDialogOpen(true)
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('addFirstCustomer')}
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center w-12">
                          <input
                            type="checkbox"
                            checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCustomers(filteredCustomers.map(c => c.id))
                              } else {
                                setSelectedCustomers([])
                              }
                            }}
                            className="cursor-pointer"
                          />
                        </TableHead>
                        <TableHead className="text-center w-16">{t('srNo')}</TableHead>
                        {customerFields.map((field) => (
                          <TableHead key={field.name} className="text-center">{field.label}</TableHead>
                        ))}
                        <TableHead className="text-center">{t('orders')}</TableHead>
                        <TableHead className="text-center">{t('totalSpent')}</TableHead>
                        <TableHead className="text-center">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer, index) => (
                        <TableRow key={customer.id}>
                          <TableCell className="text-center">
                            <input
                              type="checkbox"
                              checked={selectedCustomers.includes(customer.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCustomers([...selectedCustomers, customer.id])
                                } else {
                                  setSelectedCustomers(selectedCustomers.filter(id => id !== customer.id))
                                }
                              }}
                              className="cursor-pointer"
                            />
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {((currentPage - 1) * itemsPerPage) + index + 1}
                          </TableCell>
                          {customerFields.map((field) => (
                            <TableCell key={field.name} className="text-center max-w-[150px] p-2">
                              <div className={`${field.name === customerFields[0]?.name ? "font-medium" : "text-sm"} break-words whitespace-normal`}>
                                {field.type === 'date' ? formatDateToDDMMYYYY(customer[field.name]) : (customer[field.name] || '-')}
                              </div>
                            </TableCell>
                          ))}
                          <TableCell className="text-center text-sm">
                            <Badge variant="outline">{customer.orderCount || 0}</Badge>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            ₹{(customer.totalSpent || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedCustomer(customer)
                                  setIsViewDialogOpen(true)
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setEditingCustomer(customer)
                                  populateFormData(customer)
                                  setIsCustomerDialogOpen(true)
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                 className="text-red-500 hover:text-red-700"
                                onClick={() => {
                                  setCustomerToDelete(customer)
                                  setIsDeleteDialogOpen(true)
                                }}
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
                  {t('showing')} {((currentPage - 1) * itemsPerPage) + 1} {t('to')} {Math.min(currentPage * itemsPerPage, totalItems)} {t('of')} {totalItems} {t('customers')}
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

          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t('customerDetails')}</DialogTitle>
                <DialogDescription>{t('viewCustomerInfo')}</DialogDescription>
              </DialogHeader>
              {selectedCustomer && (
                <div className="space-y-6 py-4">
                  <div className="flex items-center space-x-4 pb-4 border-b">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                      {selectedCustomer.name?.charAt(0) || 'C'}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold">{selectedCustomer.name}</h2>
                      <div className="space-y-1">
                        {customerFields.map((field) => {
                          const value = selectedCustomer[field.name]
                          if (!value || field.name === 'name') return null
                          return (
                            <p key={field.name} className="text-sm text-muted-foreground">
                              <span className="font-medium">{field.label}:</span> {field.type === 'date' ? formatDateToDDMMYYYY(value) : value}
                            </p>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">{t('customerSince')}:</span> {formatDateToDDMMYYYY(selectedCustomer.createdAt)}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCustomer ? t('editCustomer') : t('addNewCustomer')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {customerFields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={`customerForm${field.name}`}>
                      {field.label} {field.required && '*'}
                    </Label>
                    {renderFormField(field)}
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCustomerDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button
                  disabled={saving}
                  onClick={async () => {
                    const requiredFields = customerFields.filter(f => f.required)
                    for (const field of requiredFields) {
                      if (!customerFormData[field.name]?.trim()) {
                        showToast.error(t('fieldRequired').replace('{0}', field.label))
                        return
                      }
                    }
                    
                    setSaving(true)
                    try {
                      const method = editingCustomer ? 'PUT' : 'POST'
                      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers'
                      const response = await fetch(url, {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(customerFormData)
                      })
                      if (response.ok) {
                        showToast.success(`✅ ${editingCustomer ? t('customerSuccessfullyUpdated') : t('customerSuccessfullyCreated')}`)
                        fetchCustomers(currentPage)
                        setIsCustomerDialogOpen(false)
                      } else {
                        const errorData = await response.json()
                        const msg = editingCustomer ? t('failedToUpdateCustomer') : t('failedToCreateCustomer')
                        showToast.error(`❌ ${msg.replace('{0}', errorData.error || 'Unknown error')}`)
                      }
                    } catch (error) {
                      console.error('Error saving customer:', error)
                      showToast.error(`❌ ${editingCustomer ? t('errorUpdatingCustomer') : t('errorCreatingCustomer')}`)
                    } finally {
                      setSaving(false)
                    }
                  }}
                >
                  {saving ? t('saving') : (editingCustomer ? t('update') : t('create'))}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('deleteCustomer')}</DialogTitle>
                <DialogDescription>
                  {t('confirmDeleteCustomer')} {customerToDelete?.name}? {t('actionCannotBeUndone')}
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (customerToDelete) {
                      try {
                        const response = await fetch(`/api/customers/${customerToDelete.id}`, {
                          method: 'DELETE'
                        })
                        if (response.ok) {
                          showToast.success(`✅ ${t('customerDeletedSuccess').replace('{0}', customerToDelete.name)}`)
                          fetchCustomers(currentPage)
                        } else {
                          showToast.error(`❌ ${t('failedToDeleteCustomer')}`)
                        }
                      } catch (error) {
                        console.error('Delete customer error:', error)
                        showToast.error(`❌ ${t('errorDeletingCustomer')}`)
                      }
                      setIsDeleteDialogOpen(false)
                      setCustomerToDelete(null)
                    }
                  }}
                >
                  {t('delete')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('deleteSelectedCustomers')}</DialogTitle>
                <DialogDescription>
                  {t('confirmDeleteSelectedCustomers').replace('{0}', selectedCustomers.length.toString())}
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsBulkDeleteDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button variant="destructive" onClick={async () => {
                  try {
                    const deletePromises = selectedCustomers.map(id => 
                      fetch(`/api/customers/${id}`, { method: 'DELETE' })
                    )
                    const results = await Promise.all(deletePromises)
                    
                    const successCount = results.filter(r => r.ok).length
                    const failCount = results.length - successCount
                    
                    if (successCount > 0) {
                      showToast.success(`✅ ${t('successfullyDeletedCustomers').replace('{0}', successCount.toString())}`)
                    }
                    if (failCount > 0) {
                      showToast.error(`❌ ${t('failedToDeleteCustomers').replace('{0}', failCount.toString())}`)
                    }
                    
                    setSelectedCustomers([])
                    setIsBulkDeleteDialogOpen(false)
                    fetchCustomers(currentPage)
                  } catch (error) {
                    console.error('Bulk delete error:', error)
                    showToast.error(`❌ ${t('errorDeletingCustomers')}`)
                  }
                }}>
                  {t('delete')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isClearAllDialogOpen} onOpenChange={setIsClearAllDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span>{t('clearAllCustomers')}</span>
                </DialogTitle>
                <DialogDescription>
                  {t('confirmClearAllCustomers')}
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsClearAllDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button variant="destructive" onClick={async () => {
                  try {
                    const response = await fetch('/api/customers/clear', {
                      method: 'DELETE'
                    })
                    
                    if (response.ok) {
                      const result = await response.json()
                      showToast.success(`🗑️ ${t('successfullyClearedCustomers').replace('{0}', result.count.toString())}`)
                      fetchCustomers(1)
                      setCurrentPage(1)
                      setSelectedCustomers([])
                    } else {
                      showToast.error(`❌ ${t('failedToClearCustomers')}`)
                    }
                  } catch (error) {
                    showToast.error(`❌ ${t('errorClearingCustomers')}`)
                  }
                  setIsClearAllDialogOpen(false)
                }}>
                  {t('clearAllCustomers')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </FeatureGuard>
    </MainLayout>
  )
}