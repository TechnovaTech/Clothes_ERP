"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  Package, 
  Settings,
  Edit,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { AssignManagerForm } from "@/components/forms/assign-manager-form"

export default function FactoryDetailsPage() {
  const params = useParams()
  const [factory, setFactory] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchFactory = async () => {
    try {
      const response = await fetch(`/api/manufacturer/factories/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setFactory(data)
      } else {
        console.error('Factory not found')
      }
    } catch (error) {
      console.error('Failed to fetch factory:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFactory()
  }, [params.id])

  if (loading) {
    return <div className="p-6">Loading factory details...</div>
  }

  if (!factory) {
    return <div className="p-6">Factory not found</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/manufacturer/factories">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Factories
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Building2 className="w-8 h-8 mr-3 text-blue-500" />
              {factory.name}
            </h1>
            <p className="text-muted-foreground">Factory Management Dashboard</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <AssignManagerForm 
            factoryId={factory._id} 
            onAssignManager={(manager) => console.log('Manager assigned:', manager)}
          />
          <Button>
            <Edit className="w-4 h-4 mr-2" />
            Edit Factory
          </Button>
        </div>
      </div>

      {/* Factory Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={factory.status === 'Active' ? 'default' : 'secondary'}>
                  {factory.status}
                </Badge>
              </div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Employees</p>
                <p className="text-2xl font-bold">{factory.employees || 0}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Capacity</p>
                <p className="text-lg font-semibold">{factory.capacity || 'Not set'}</p>
              </div>
              <Package className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Area</p>
                <p className="text-lg font-semibold">{factory.area || 'Not set'}</p>
              </div>
              <Settings className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Factory Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">{factory.address}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{factory.phone}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{factory.email || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Manager</p>
                    <p className="text-sm text-muted-foreground">{factory.manager}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Factory Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Established</span>
                  <span className="font-medium">{factory.established ? new Date(factory.established).toLocaleDateString() : 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Area</span>
                  <span className="font-medium">{factory.area || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Production Capacity</span>
                  <span className="font-medium">{factory.capacity || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Status</span>
                  <Badge variant={factory.status === 'Active' ? 'default' : 'secondary'}>
                    {factory.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Employee Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Employee management features will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="production">
          <Card>
            <CardHeader>
              <CardTitle>Production Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Production tracking and management features will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Factory Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Factory-specific inventory management will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Factory Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Factory configuration and settings will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}