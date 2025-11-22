"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DollarSign,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  Star,
  ShoppingCart,
  BarChart3
} from "lucide-react"

interface DashboardData {
  todaySales: number
  topProducts: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  stockValue: number
  lowStockItems: Array<{
    name: string
    stock: number
    minStock: number
  }>
  topCustomer: {
    name: string
    totalPurchases: number
    totalSpent: number
  }
  salesTrend: number
}

interface SmartInsightsDashboardProps {
  data?: DashboardData
  loading?: boolean
}

export function SmartInsightsDashboard({ data, loading }: SmartInsightsDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    todaySales: 0,
    topProducts: [],
    stockValue: 0,
    lowStockItems: [],
    topCustomer: { name: "No data", totalPurchases: 0, totalSpent: 0 },
    salesTrend: 0
  })

  useEffect(() => {
    if (data) {
      setDashboardData(data)
    } else {
      fetchDashboardData()
    }
  }, [data])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/analytics')
      if (response.ok) {
        const analyticsData = await response.json()
        setDashboardData({
          todaySales: analyticsData.todaySales || 0,
          topProducts: analyticsData.topProducts || [],
          stockValue: analyticsData.stockValue || 0,
          lowStockItems: analyticsData.lowStockItems || [],
          topCustomer: analyticsData.topCustomer || { name: "No data", totalPurchases: 0, totalSpent: 0 },
          salesTrend: analyticsData.salesTrend || 0
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Smart Insights Dashboard</h2>
      </div>


      {/* Detailed Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Top 5 Products Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span>Top 5 Products</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.topProducts.map((product, index) => {
                const maxQuantity = Math.max(...dashboardData.topProducts.map(p => p.quantity))
                const percentage = maxQuantity > 0 ? (product.quantity / maxQuantity) * 100 : 0
                
                return (
                  <div key={product.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-medium truncate">{product.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{product.quantity}</div>
                        <div className="text-xs text-muted-foreground">{formatCurrency(product.revenue)}</div>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Customer & Low Stock Combined */}
        <div className="space-y-6">
          
          {/* Top Customer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-500" />
                <span>Top Customer</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <div className="font-bold text-lg">{dashboardData.topCustomer.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {dashboardData.topCustomer.totalPurchases} purchases
                  </div>
                  <div className="text-xl font-bold text-purple-600 mt-2">
                    {formatCurrency(dashboardData.topCustomer.totalSpent)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Details */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span>Critical Stock Levels</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.lowStockItems.slice(0, 3).map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm truncate">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Min: {item.minStock || 10}
                      </div>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {item.stock} left
                    </Badge>
                  </div>
                ))}
                {dashboardData.lowStockItems.length > 3 && (
                  <div className="text-center text-sm text-muted-foreground">
                    +{dashboardData.lowStockItems.length - 3} more items
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}