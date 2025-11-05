// "use client"

// import { useState, useEffect } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Building2, Plus, Phone, Mail } from "lucide-react"

// export default function VendorsPage() {
//   const [vendors, setVendors] = useState([])
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     fetchVendors()
//   }, [])

//   const fetchVendors = async () => {
//     try {
//       const response = await fetch('/api/factory/vendors')
//       if (response.ok) {
//         const data = await response.json()
//         setVendors(data)
//       }
//     } catch (error) {
//       console.error('Failed to fetch vendors:', error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="p-6 space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold">Vendor Management</h1>
//           <p className="text-muted-foreground">Manage factory suppliers</p>
//         </div>
//         <Button>
//           <Plus className="w-4 h-4 mr-2" />
//           Add Vendor
//         </Button>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle>Vendor List</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {loading ? (
//             <div className="text-center py-8">Loading vendors...</div>
//           ) : vendors.length === 0 ? (
//             <div className="text-center py-8 text-muted-foreground">
//               <Building2 className="mx-auto h-12 w-12 mb-4" />
//               <p>No vendors found</p>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {vendors.map((vendor: any, index) => (
//                 <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
//                   <div className="flex items-center space-x-4">
//                     <Building2 className="w-8 h-8 text-blue-500" />
//                     <div>
//                       <p className="font-medium">{vendor.name}</p>
//                       <p className="text-sm text-muted-foreground flex items-center">
//                         <Phone className="w-3 h-3 mr-1" />
//                         {vendor.phone}
//                       </p>
//                     </div>
//                   </div>
//                   <Badge>{vendor.status}</Badge>
//                 </div>
//               ))}
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   )
// }



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
import { Plus, Building2, Phone, Mail, MapPin, TrendingUp, Search, Filter, Eye, Edit } from 'lucide-react'

interface Vendor {
  _id?: string
  id?: string
  name: string
  category: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
  paymentTerms?: string
  status: string
  totalOrders?: number
}

export default function VendorManagement() {
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false)
  const [isViewVendorOpen, setIsViewVendorOpen] = useState(false)
  const [isEditVendorOpen, setIsEditVendorOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    paymentTerms: '',
    status: 'active'
  })

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/manufacturer/vendors')
      const data = await response.json()
      setVendors(data.vendors || [])
    } catch (error) {
      console.error('Error fetching vendors:', error)
    } finally {
      setLoading(false)
    }
  }

  const createVendor = async () => {
    try {
      const response = await fetch('/api/manufacturer/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        await fetchVendors()
        setIsAddVendorOpen(false)
        setFormData({ name: '', category: '', contactPerson: '', phone: '', email: '', address: '', paymentTerms: '', status: 'active' })
      }
    } catch (error) {
      console.error('Error creating vendor:', error)
    }
  }

  const openViewDialog = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setIsViewVendorOpen(true)
  }

  const openEditDialog = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setFormData({
      name: vendor.name || '',
      category: vendor.category || '',
      contactPerson: vendor.contactPerson || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      address: vendor.address || '',
      paymentTerms: vendor.paymentTerms || '',
      status: vendor.status || 'active'
    })
    setIsEditVendorOpen(true)
  }

  const updateVendor = async () => {
    if (!selectedVendor) return
    try {
      const response = await fetch(`/api/manufacturer/vendors/${selectedVendor._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        await fetchVendors()
        setIsEditVendorOpen(false)
        setFormData({ name: '', category: '', contactPerson: '', phone: '', email: '', address: '', paymentTerms: '', status: 'active' })
      }
    } catch (error) {
      console.error('Error updating vendor:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }



  const filteredVendors = vendors.filter((vendor: Vendor) => {
    const matchesSearch = vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || vendor.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Total Vendors</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendors.length}</div>
            <p className="text-xs text-muted-foreground">Across all categories</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Active Vendors</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendors.filter((v: Vendor) => v.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Categories</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(vendors.map((v: Vendor) => v.category)).size}</div>
            <p className="text-xs text-muted-foreground">Vendor types</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Total Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendors.reduce((sum: number, v: Vendor) => sum + (v.totalOrders || 0), 0)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vendor Directory</CardTitle>
              <CardDescription>Manage suppliers and vendor relationships</CardDescription>
            </div>
            <Dialog open={isAddVendorOpen} onOpenChange={setIsAddVendorOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vendor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
                <DialogHeader className="flex-shrink-0 pb-4 border-b">
                  <DialogTitle className="text-xl font-semibold">Add New Vendor</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">Enter vendor details and contact information</DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-1 py-4">
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Vendor Name *</Label>
                          <Input 
                            placeholder="Enter vendor name" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Category *</Label>
                          <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fabric">Fabric Supplier</SelectItem>
                              <SelectItem value="thread">Thread Supplier</SelectItem>
                              <SelectItem value="accessories">Accessories</SelectItem>
                              <SelectItem value="packaging">Packaging</SelectItem>
                              <SelectItem value="machinery">Machinery</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="p-4 rounded-lg border">
                      <h3 className="text-sm font-medium mb-3">Contact Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Contact Person</Label>
                          <Input 
                            placeholder="Enter contact person name" 
                            value={formData.contactPerson}
                            onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Phone</Label>
                          <Input 
                            placeholder="+91 XXXXXXXXXX" 
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="h-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label className="text-sm font-medium">Email</Label>
                        <Input 
                          type="email" 
                          placeholder="vendor@example.com" 
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label className="text-sm font-medium">Address</Label>
                        <Textarea 
                          placeholder="Enter complete address" 
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          className="min-h-[80px] resize-none"
                        />
                      </div>
                    </div>

                    {/* Business Terms */}
                    <div className="p-4 rounded-lg border">
                      <h3 className="text-sm font-medium mb-3">Business Terms</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Payment Terms</Label>
                          <Select value={formData.paymentTerms} onValueChange={(value) => setFormData({...formData, paymentTerms: value})}>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select payment terms" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="15">15 Days</SelectItem>
                              <SelectItem value="30">30 Days</SelectItem>
                              <SelectItem value="45">45 Days</SelectItem>
                              <SelectItem value="60">60 Days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Status</Label>
                          <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 flex justify-end space-x-3 pt-4 border-t bg-white">
                  <Button variant="outline" onClick={() => setIsAddVendorOpen(false)} className="px-6">
                    Cancel
                  </Button>
                  <Button onClick={createVendor} className="px-6 bg-black hover:bg-black">
                    Add Vendor
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
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="fabric">Fabric Supplier</SelectItem>
                <SelectItem value="thread">Thread Supplier</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
                <SelectItem value="packaging">Packaging</SelectItem>
                <SelectItem value="machinery">Machinery</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Vendor</TableHead>
                  <TableHead className="text-center">Contact</TableHead>
                  <TableHead className="text-center">Category</TableHead>
                  <TableHead className="text-center">Orders</TableHead>
                  <TableHead className="text-center">Payment Terms</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : filteredVendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">No vendors found</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {vendors.length === 0 ? 'Start by adding your first vendor' : 'Try adjusting your search or filters'}
                      </p>
                      <Button onClick={() => setIsAddVendorOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Vendor
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVendors.map((vendor: Vendor) => (
                    <TableRow key={vendor.id || vendor._id}>
                      <TableCell className="text-center">
                        <div>
                          <div className="font-medium">{vendor.name}</div>
                          <div className="text-sm text-muted-foreground">{vendor.id}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="flex items-center justify-center text-sm">
                            <Phone className="w-3 h-3 mr-1" />
                            {vendor.phone || 'N/A'}
                          </div>
                          <div className="flex items-center justify-center text-sm">
                            <Mail className="w-3 h-3 mr-1" />
                            {vendor.email || 'N/A'}
                          </div>
                          {vendor.contactPerson && (
                            <div className="text-sm text-muted-foreground">
                              {vendor.contactPerson}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{vendor.category}</TableCell>
                      <TableCell className="text-center">{vendor.totalOrders || 0}</TableCell>
                      <TableCell className="text-center">{vendor.paymentTerms ? `${vendor.paymentTerms} Days` : 'N/A'}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(vendor.status)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => openViewDialog(vendor)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(vendor)}>
                            <Edit className="w-4 h-4" />
                          </Button>
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

      {/* View Vendor Dialog */}
      <Dialog open={isViewVendorOpen} onOpenChange={setIsViewVendorOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vendor Details</DialogTitle>
            <DialogDescription>View vendor information</DialogDescription>
          </DialogHeader>
          {selectedVendor && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div><strong>Name:</strong> {selectedVendor.name}</div>
                <div><strong>Category:</strong> {selectedVendor.category}</div>
                <div><strong>Contact Person:</strong> {selectedVendor.contactPerson}</div>
                <div><strong>Phone:</strong> {selectedVendor.phone}</div>
                <div><strong>Email:</strong> {selectedVendor.email}</div>
                <div><strong>Payment Terms:</strong> {selectedVendor.paymentTerms} Days</div>
              </div>
              <div><strong>Address:</strong> {selectedVendor.address}</div>
              <div><strong>Status:</strong> {getStatusBadge(selectedVendor.status)}</div>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setIsViewVendorOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Vendor Dialog */}
      <Dialog open={isEditVendorOpen} onOpenChange={setIsEditVendorOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4 border-b">
            <DialogTitle className="text-xl font-semibold">Edit Vendor</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Update vendor details and contact information</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1 py-4">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Vendor Name *</Label>
                    <Input 
                      placeholder="Enter vendor name" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fabric">Fabric Supplier</SelectItem>
                        <SelectItem value="thread">Thread Supplier</SelectItem>
                        <SelectItem value="accessories">Accessories</SelectItem>
                        <SelectItem value="packaging">Packaging</SelectItem>
                        <SelectItem value="machinery">Machinery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="p-4 rounded-lg border">
                <h3 className="text-sm font-medium mb-3">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Contact Person</Label>
                    <Input 
                      placeholder="Enter contact person name" 
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Phone</Label>
                    <Input 
                      placeholder="+91 XXXXXXXXXX" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="h-10"
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label className="text-sm font-medium">Email</Label>
                  <Input 
                    type="email" 
                    placeholder="vendor@example.com" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2 mt-4">
                  <Label className="text-sm font-medium">Address</Label>
                  <Textarea 
                    placeholder="Enter complete address" 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </div>

              {/* Business Terms */}
              <div className="p-4 rounded-lg border">
                <h3 className="text-sm font-medium mb-3">Business Terms</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Payment Terms</Label>
                    <Select value={formData.paymentTerms} onValueChange={(value) => setFormData({...formData, paymentTerms: value})}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select payment terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 Days</SelectItem>
                        <SelectItem value="30">30 Days</SelectItem>
                        <SelectItem value="45">45 Days</SelectItem>
                        <SelectItem value="60">60 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 flex justify-end space-x-3 pt-4 border-t bg-white">
            <Button variant="outline" onClick={() => setIsEditVendorOpen(false)} className="px-6">
              Cancel
            </Button>
            <Button onClick={updateVendor} className="px-6 bg-black hover:bg-black">
              Update Vendor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}