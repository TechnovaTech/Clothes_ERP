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
import { Plus, Users, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react'
import { showToast } from '@/lib/toast'

export default function DistributorsManagement() {
  const [isAddDistributorOpen, setIsAddDistributorOpen] = useState(false)
  const [distributors, setDistributors] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEditDistributorOpen, setIsEditDistributorOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedDistributor, setSelectedDistributor] = useState(null)
  const [distributorToDelete, setDistributorToDelete] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    status: 'active'
  })

  useEffect(() => {
    fetchDistributors()
  }, [])

  const fetchDistributors = async () => {
    try {
      const response = await fetch('/api/manufacturer/distributors')
      const data = await response.json()
      setDistributors(data.distributors || [])
    } catch (error) {
      console.error('Error fetching distributors:', error)
    } finally {
      setLoading(false)
    }
  }

  const createDistributor = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      showToast.error('Please fill all required fields')
      return
    }
    
    try {
      const response = await fetch('/api/manufacturer/distributors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        await fetchDistributors()
        setIsAddDistributorOpen(false)
        setFormData({ name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '', status: 'active' })
        showToast.success('✅ Distributor added successfully!')
      } else {
        const error = await response.json()
        showToast.error('❌ Error: ' + error.error)
      }
    } catch (error) {
      console.error('Error creating distributor:', error)
      showToast.error('❌ Failed to create distributor')
    }
  }

  const editDistributor = (distributor: any) => {
    setSelectedDistributor(distributor)
    setFormData({
      name: distributor.name || '',
      email: distributor.email || '',
      phone: distributor.phone || '',
      address: distributor.address || '',
      city: distributor.city || '',
      state: distributor.state || '',
      pincode: distributor.pincode || '',
      status: distributor.status || 'active'
    })
    setIsEditDistributorOpen(true)
  }

  const updateDistributor = async () => {
    if (!selectedDistributor) return
    
    try {
      const response = await fetch(`/api/manufacturer/distributors/${(selectedDistributor as any)._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        await fetchDistributors()
        setIsEditDistributorOpen(false)
        setFormData({ name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '', status: 'active' })
        setSelectedDistributor(null)
        showToast.success('✅ Distributor updated successfully!')
      } else {
        showToast.error('❌ Failed to update distributor')
      }
    } catch (error) {
      console.error('Error updating distributor:', error)
      showToast.error('❌ Failed to update distributor')
    }
  }

  const openDeleteDialog = (distributor: any) => {
    setDistributorToDelete(distributor)
    setIsDeleteDialogOpen(true)
  }

  const deleteDistributor = async () => {
    if (!distributorToDelete) return
    
    try {
      const response = await fetch(`/api/manufacturer/distributors/${(distributorToDelete as any)._id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchDistributors()
        setIsDeleteDialogOpen(false)
        setDistributorToDelete(null)
        showToast.success('Distributor deleted successfully!')
      } else {
        showToast.error('Failed to delete distributor')
      }
    } catch (error) {
      console.error('Error deleting distributor:', error)
      showToast.error('Failed to delete distributor')
    }
  }



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Distributors Management</h1>
        <p className="text-muted-foreground">Manage your distribution network</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Distributors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{distributors.length}</div>
            <p className="text-xs text-muted-foreground">Registered distributors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Distributors</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{distributors.filter((d: any) => d.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Distributors</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{distributors.filter((d: any) => d.status === 'inactive').length}</div>
            <p className="text-xs text-muted-foreground">Currently inactive</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Distributor Network</CardTitle>
              <CardDescription>Manage your distribution partners</CardDescription>
            </div>
            <Dialog open={isAddDistributorOpen} onOpenChange={setIsAddDistributorOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Distributor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Distributor</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Distributor Name *</Label>
                      <Input 
                        placeholder="Enter distributor name" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input 
                        type="email"
                        placeholder="Enter email address" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone *</Label>
                      <Input 
                        placeholder="Enter phone number" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Textarea 
                      placeholder="Enter address" 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input 
                        placeholder="Enter city" 
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input 
                        placeholder="Enter state" 
                        value={formData.state}
                        onChange={(e) => setFormData({...formData, state: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pincode</Label>
                      <Input 
                        placeholder="Enter pincode" 
                        value={formData.pincode}
                        onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDistributorOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createDistributor}>
                    Add Distributor
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isEditDistributorOpen} onOpenChange={(open) => {
              setIsEditDistributorOpen(open)
              if (!open) {
                setFormData({ name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '', status: 'active' })
                setSelectedDistributor(null)
              }
            }}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Distributor</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Distributor Name *</Label>
                      <Input 
                        placeholder="Enter distributor name" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input 
                        type="email"
                        placeholder="Enter email address" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone *</Label>
                      <Input 
                        placeholder="Enter phone number" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Textarea 
                      placeholder="Enter address" 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input 
                        placeholder="Enter city" 
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input 
                        placeholder="Enter state" 
                        value={formData.state}
                        onChange={(e) => setFormData({...formData, state: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pincode</Label>
                      <Input 
                        placeholder="Enter pincode" 
                        value={formData.pincode}
                        onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditDistributorOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={updateDistributor}>
                    Update Distributor
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Distributor</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground py-4">
                  Are you sure you want to delete "{(distributorToDelete as any)?.name}"? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={deleteDistributor}>
                    Delete
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {distributors.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No distributors found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start by adding your first distributor to your network
              </p>
              <Button onClick={() => setIsAddDistributorOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Distributor
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : distributors.map((distributor: any) => (
                    <TableRow key={distributor.id}>
                      <TableCell className="font-medium">{distributor.name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Phone className="w-3 h-3 mr-1" />
                            {distributor.phone}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Mail className="w-3 h-3 mr-1" />
                            {distributor.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <MapPin className="w-3 h-3 mr-1" />
                          {distributor.city && distributor.state ? `${distributor.city}, ${distributor.state}` : 'Not specified'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          distributor.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {distributor.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => editDistributor(distributor)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => openDeleteDialog(distributor)}>
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