'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Building2, Edit, Trash2, MapPin, Phone, Mail } from 'lucide-react'
import { showToast } from '@/lib/toast'

export default function MyFactories() {
  const [isAddFactoryOpen, setIsAddFactoryOpen] = useState(false)
  const [factories, setFactories] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEditFactoryOpen, setIsEditFactoryOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedFactory, setSelectedFactory] = useState(null)
  const [factoryToDelete, setFactoryToDelete] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    phone: '',
    email: '',
    capacity: '',
    description: ''
  })

  useEffect(() => {
    fetchFactories()
  }, [])

  const fetchFactories = async () => {
    try {
      const response = await fetch('/api/manufacturer/warehouse')
      const data = await response.json()
      setFactories(data.factories || [])
    } catch (error) {
      console.error('Error fetching factories:', error)
    } finally {
      setLoading(false)
    }
  }

  const createFactory = async () => {
    if (!formData.name || !formData.location) {
      showToast.error('Please fill all required fields')
      return
    }
    
    try {
      const response = await fetch('/api/manufacturer/warehouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        await fetchFactories()
        setIsAddFactoryOpen(false)
        setFormData({ name: '', location: '', address: '', phone: '', email: '', capacity: '', description: '' })
        showToast.success('✅ Factory added successfully!')
      } else {
        const error = await response.json()
        showToast.error('❌ Error: ' + error.error)
      }
    } catch (error) {
      console.error('Error creating factory:', error)
      showToast.error('❌ Failed to create factory')
    }
  }

  const editFactory = (factory: any) => {
    setSelectedFactory(factory)
    setFormData({
      name: factory.name || '',
      location: factory.location || '',
      address: factory.address || '',
      phone: factory.phone || '',
      email: factory.email || '',
      capacity: factory.capacity || '',
      description: factory.description || ''
    })
    setIsEditFactoryOpen(true)
  }

  const updateFactory = async () => {
    if (!selectedFactory) return
    
    try {
      const response = await fetch(`/api/manufacturer/warehouse/${(selectedFactory as any)._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        await fetchFactories()
        setIsEditFactoryOpen(false)
        setFormData({ name: '', location: '', address: '', phone: '', email: '', capacity: '', description: '' })
        setSelectedFactory(null)
        showToast.success('✅ Factory updated successfully!')
      } else {
        showToast.error('❌ Failed to update factory')
      }
    } catch (error) {
      console.error('Error updating factory:', error)
      showToast.error('❌ Failed to update factory')
    }
  }

  const openDeleteDialog = (factory: any) => {
    setFactoryToDelete(factory)
    setIsDeleteDialogOpen(true)
  }

  const deleteFactory = async () => {
    if (!factoryToDelete) return
    
    try {
      const response = await fetch(`/api/manufacturer/warehouse/${(factoryToDelete as any)._id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchFactories()
        setIsDeleteDialogOpen(false)
        setFactoryToDelete(null)
        showToast.success('Factory deleted successfully!')
      } else {
        showToast.error('Failed to delete factory')
      }
    } catch (error) {
      console.error('Error deleting factory:', error)
      showToast.error('Failed to delete factory')
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Factories</h1>
          <p className="text-muted-foreground">Manage your manufacturing facilities</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Factories</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{factories.length}</div>
            <p className="text-xs text-muted-foreground">Manufacturing facilities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Factory Directory</CardTitle>
                <CardDescription>Manage your manufacturing facilities and locations</CardDescription>
              </div>
              <Dialog open={isAddFactoryOpen} onOpenChange={setIsAddFactoryOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Factory
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Factory</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Factory Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Factory Name *</Label>
                          <Input 
                            placeholder="Enter factory name" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Location *</Label>
                          <Input 
                            placeholder="City, State" 
                            value={formData.location}
                            onChange={(e) => setFormData({...formData, location: e.target.value})}
                            className="h-10"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <h3 className="text-sm font-medium mb-3">Contact Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Phone</Label>
                          <Input 
                            placeholder="+91 XXXXXXXXXX" 
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Email</Label>
                          <Input 
                            type="email"
                            placeholder="factory@example.com" 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="h-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label className="text-sm font-medium">Address</Label>
                        <Textarea 
                          placeholder="Complete factory address" 
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          className="min-h-[60px] resize-none"
                        />
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label className="text-sm font-medium">Production Capacity</Label>
                        <Input 
                          placeholder="e.g., 1000 units/day" 
                          value={formData.capacity}
                          onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label className="text-sm font-medium">Description</Label>
                        <Textarea 
                          placeholder="Factory specialization, equipment, etc." 
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          className="min-h-[60px] resize-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddFactoryOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createFactory}>
                      Add Factory
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isEditFactoryOpen} onOpenChange={(open) => {
                setIsEditFactoryOpen(open)
                if (!open) {
                  setFormData({ name: '', location: '', address: '', phone: '', email: '', capacity: '', description: '' })
                  setSelectedFactory(null)
                }
              }}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit Factory</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Factory Name *</Label>
                        <Input 
                          placeholder="Enter factory name" 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Location *</Label>
                        <Input 
                          placeholder="City, State" 
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Phone</Label>
                        <Input 
                          placeholder="+91 XXXXXXXXXX" 
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Email</Label>
                        <Input 
                          type="email"
                          placeholder="factory@example.com" 
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Address</Label>
                      <Textarea 
                        placeholder="Complete factory address" 
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Production Capacity</Label>
                        <Input 
                          placeholder="e.g., 1000 units/day" 
                          value={formData.capacity}
                          onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Description</Label>
                        <Textarea 
                          placeholder="Factory specialization" 
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsEditFactoryOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={updateFactory}>
                      Update Factory
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Factory</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground py-4">
                    Are you sure you want to delete "{(factoryToDelete as any)?.name}"? This action cannot be undone.
                  </p>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={deleteFactory}>
                      Delete
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            {factories.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No factories found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start by adding your first manufacturing facility
                </p>
                <Button onClick={() => setIsAddFactoryOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Factory
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Factory ID</TableHead>
                      <TableHead className="text-center">Name</TableHead>
                      <TableHead className="text-center">Location</TableHead>
                      <TableHead className="text-center">Contact</TableHead>
                      <TableHead className="text-center">Capacity</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : factories.map((factory: any) => (
                      <TableRow key={factory.id}>
                        <TableCell className="text-center font-medium">{factory.id}</TableCell>
                        <TableCell className="text-center">{factory.name}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {factory.location}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="space-y-1">
                            {factory.phone && (
                              <div className="flex items-center justify-center text-sm">
                                <Phone className="w-3 h-3 mr-1" />
                                {factory.phone}
                              </div>
                            )}
                            {factory.email && (
                              <div className="flex items-center justify-center text-sm">
                                <Mail className="w-3 h-3 mr-1" />
                                {factory.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{factory.capacity || '-'}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => editFactory(factory)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => openDeleteDialog(factory)}>
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