"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  LayoutDashboard,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  Building2,
  ShoppingCart,
  AlertTriangle
} from "lucide-react"

export default function ManufacturerDashboard() {
  const [selectedFactory, setSelectedFactory] = useState("all")
  const [factories, setFactories] = useState([])
  const [factoryData, setFactoryData] = useState({
    products: 1234,
    orders: 89,
    staff: 156,
    revenue: "45.2K"
  })

  useEffect(() => {
    // Fetch factories
    const fetchFactories = async () => {
      try {
        const response = await fetch('/api/manufacturer/factories')
        if (response.ok) {
          const data = await response.json()
          setFactories(data)
        }
      } catch (error) {
        console.error('Failed to fetch factories:', error)
      }
    }
    fetchFactories()
  }, [])

  useEffect(() => {
    // Update data based on selected factory
    if (selectedFactory === "all") {
      setFactoryData({
        products: 1234,
        orders: 89,
        staff: 156,
        revenue: "45.2K"
      })
    } else {
      // Mock factory-specific data
      setFactoryData({
        products: 456,
        orders: 23,
        staff: 45,
        revenue: "12.8K"
      })
    }
  }, [selectedFactory])

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manufacturer Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your manufacturing control center</p>
        </div>
        <div className="w-64">
          <Select value={selectedFactory} onValueChange={setSelectedFactory}>
            <SelectTrigger>
              <SelectValue placeholder="Select Factory" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Factories</SelectItem>
              {factories.map((factory) => (
                <SelectItem key={factory._id} value={factory._id}>
                  {factory.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{factoryData.products}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
                <p className="text-2xl font-bold">{factoryData.orders}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
                <p className="text-2xl font-bold">{factoryData.staff}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold">${factoryData.revenue}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Production Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Monitor your production lines and output</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              HR Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Manage staff, payroll, and HR operations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Factory Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Oversee your manufacturing facilities</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}