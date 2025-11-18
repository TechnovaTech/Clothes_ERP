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
} from "lucide-react"
import { FeatureGuard } from "@/components/feature-guard"
import { showToast } from "@/lib/toast"
import { useLanguage } from "@/lib/language-context"

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
  phone?: string
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

  useEffect(() => {
    fetchCustomerFields()
    fetchCustomers(1)
  }, [])

  useEffect(() => {
    fetchCustomers(currentPage)
  }, [currentPage])

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

  const totalCustomers = customers.length

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
                <CardTitle className="text-sm font-medium">Active Fields</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customerFields.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Required Fields</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customerFields.filter(f => f.required).length}</div>
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
                  <Button variant="outline" asChild>
                    <Link href="/tenant/field-settings">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure Fields
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
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No customers found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {customers.length === 0 ? 'Start by adding your first customer' : 'Try adjusting your search or filters'}
                  </p>
                  <Button onClick={() => {
                    setEditingCustomer(null)
                    resetFormData()
                    setIsCustomerDialogOpen(true)
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Customer
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center w-16">Sr. No.</TableHead>
                        {customerFields.map((field) => (
                          <TableHead key={field.name} className="text-center">{field.label}</TableHead>
                        ))}
                        <TableHead className="text-center">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer, index) => (
                        <TableRow key={customer.id}>
                          <TableCell className="text-center font-medium">
                            {((currentPage - 1) * itemsPerPage) + index + 1}
                          </TableCell>
                          {customerFields.map((field) => (
                            <TableCell key={field.name} className="text-center">
                              <div className={field.name === customerFields[0]?.name ? "font-medium" : "text-sm"}>
                                {customer[field.name] || '-'}
                              </div>
                            </TableCell>
                          ))}
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
                              <span className="font-medium">{field.label}:</span> {value}
                            </p>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Customer Since:</span> {new Date(selectedCustomer.createdAt).toLocaleDateString('en-IN')}
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
                        showToast.error(`${field.label} is required`)
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
                        showToast.success(editingCustomer ? t('customerUpdatedSuccess') : t('customerCreatedSuccess'))
                        fetchCustomers(currentPage)
                        setIsCustomerDialogOpen(false)
                      } else {
                        showToast.error(editingCustomer ? t('failedToUpdateCustomer') : t('failedToCreateCustomer'))
                      }
                    } catch (error) {
                      console.error('Error saving customer:', error)
                    } finally {
                      setSaving(false)
                    }
                  }}
                >
                  {saving ? 'Saving...' : (editingCustomer ? t('update') : t('create'))}
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
                          showToast.success(t('customerDeletedSuccess'))
                          fetchCustomers(currentPage)
                        } else {
                          showToast.error(t('failedToDeleteCustomer'))
                        }
                      } catch (error) {
                        showToast.error(t('errorDeletingCustomer'))
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
        </div>
      </FeatureGuard>
    </MainLayout>
  )
}