"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Users, Package, Settings } from "lucide-react"

export default function FactoryDashboard() {
  const { data: session } = useSession()
  const [factory, setFactory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFactory = async () => {
      if (session?.user?.factoryId) {
        try {
          const response = await fetch(`/api/manufacturer/factories/${session.user.factoryId}`)
          if (response.ok) {
            const data = await response.json()
            setFactory(data)
          } else {
            console.log('Factory not found, using mock data')
            // Use mock factory data if not found
            setFactory({
              _id: session.user.factoryId,
              name: 'Your Assigned Factory',
              address: '123 Factory Street, Industrial Area',
              phone: '+91 9876543210',
              email: 'factory@company.com',
              manager: session.user.name,
              status: 'Active',
              employees: 25
            })
          }
        } catch (error) {
          console.error('Failed to fetch factory:', error)
          // Use mock factory data on error
          setFactory({
            _id: session.user.factoryId || 'demo-factory',
            name: 'Your Assigned Factory',
            address: '123 Factory Street, Industrial Area',
            phone: '+91 9876543210',
            email: 'factory@company.com',
            manager: session.user.name,
            status: 'Active',
            employees: 25
          })
        } finally {
          setLoading(false)
        }
      } else {
        // No factory ID, use default
        setFactory({
          _id: 'default-factory',
          name: 'Your Assigned Factory',
          address: '123 Factory Street, Industrial Area',
          phone: '+91 9876543210',
          email: 'factory@company.com',
          manager: session?.user?.name || 'Factory Manager',
          status: 'Active',
          employees: 25
        })
        setLoading(false)
      }
    }

    if (session) {
      fetchFactory()
    }
  }, [session])

  if (loading) {
    return <div className="p-6">Loading factory dashboard...</div>
  }

  if (!factory) {
    return <div className="p-6">Factory not found</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center">
          <Building2 className="w-8 h-8 mr-3 text-blue-500" />
          {factory.name}
        </h1>
        <p className="text-muted-foreground">Factory Manager Dashboard</p>
      </div>

      {/* Factory Stats */}
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
                <p className="text-sm text-muted-foreground">Production</p>
                <p className="text-lg font-semibold">Running</p>
              </div>
              <Package className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Efficiency</p>
                <p className="text-lg font-semibold">85%</p>
              </div>
              <Settings className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Factory Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Factory Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">Address</p>
              <p className="text-sm text-muted-foreground">{factory.address}</p>
            </div>
            <div>
              <p className="font-medium">Phone</p>
              <p className="text-sm text-muted-foreground">{factory.phone}</p>
            </div>
            <div>
              <p className="font-medium">Manager</p>
              <p className="text-sm text-muted-foreground">{session?.user?.name}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              Welcome to your factory management dashboard. You can manage production, 
              inventory, and employees for this factory.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}