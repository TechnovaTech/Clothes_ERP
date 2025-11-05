"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Building2, Package, Users } from "lucide-react"

export default function FactoryReportsPage() {
  const [selectedFactory, setSelectedFactory] = useState("all")
  const [selectedPeriod, setSelectedPeriod] = useState("monthly")
  const [factories, setFactories] = useState([])
  const [reportData, setReportData] = useState([])

  useEffect(() => {
    fetchFactories()
    fetchReports()
  }, [selectedFactory, selectedPeriod])

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

  const fetchReports = async () => {
    try {
      const response = await fetch(`/api/manufacturer/reports?factory=${selectedFactory}&period=${selectedPeriod}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      } else {
        setReportData([])
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
      setReportData([])
    }
  }

  // Calculate totals from report data
  const totalRevenue = reportData.reduce((sum, report) => sum + (report.revenue || 0), 0)
  const totalExpenses = reportData.reduce((sum, report) => sum + (report.expenses || 0), 0)
  const totalProfit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Factory Reports</h1>
          <p className="text-muted-foreground">Profit & Loss analysis by factory</p>
        </div>
        <div className="flex space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedFactory} onValueChange={setSelectedFactory}>
            <SelectTrigger className="w-64">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">₹{totalExpenses.toLocaleString()}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{totalProfit.toLocaleString()}
                </p>
              </div>
              <DollarSign className={`w-8 h-8 ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Profit Margin</p>
                <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitMargin}%
                </p>
              </div>
              <BarChart3 className={`w-8 h-8 ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Factory-wise Performance */}
      {selectedFactory === "all" && (
        <Card>
          <CardHeader>
            <CardTitle>Factory-wise Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="mx-auto h-12 w-12 mb-4" />
                  <p>No report data available</p>
                  <p className="text-sm">Data will appear when factories generate revenue and expenses</p>
                </div>
              ) : (
                reportData.map((report, index) => {
                  const factoryProfit = (report.revenue || 0) - (report.expenses || 0)
                  const factoryMargin = report.revenue > 0 ? ((factoryProfit / report.revenue) * 100).toFixed(1) : 0
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Building2 className="w-8 h-8 text-blue-500" />
                        <div>
                          <p className="font-medium">{report.factoryName || `Factory ${index + 1}`}</p>
                          <p className="text-sm text-muted-foreground">
                            Revenue: ₹{(report.revenue || 0).toLocaleString()} | 
                            Expenses: ₹{(report.expenses || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className={`text-lg font-bold ${factoryProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{factoryProfit.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">{factoryMargin}% margin</p>
                        </div>
                        <Badge variant={factoryProfit >= 0 ? 'default' : 'destructive'}>
                          {factoryProfit >= 0 ? 'Profitable' : 'Loss'}
                        </Badge>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="mx-auto h-8 w-8 mb-2" />
                <p>No revenue data</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reportData.map((report, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{report.factoryName || `Factory ${index + 1}`}</span>
                    <span className="font-medium text-green-600">₹{(report.revenue || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="mx-auto h-8 w-8 mb-2" />
                <p>No expense data</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reportData.map((report, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{report.factoryName || `Factory ${index + 1}`}</span>
                    <span className="font-medium text-red-600">₹{(report.expenses || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button variant="outline">
              Export PDF
            </Button>
            <Button variant="outline">
              Export Excel
            </Button>
            <Button variant="outline">
              Email Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}