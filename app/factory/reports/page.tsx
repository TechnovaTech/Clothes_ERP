"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, Download } from "lucide-react"

interface ReportData {
  type: string
  amount: number
  category: string
  createdAt: string
}

export default function FactoryReportsPage() {
  const { data: session } = useSession()
  const [reports, setReports] = useState<ReportData[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')

  useEffect(() => {
    fetchReports()
  }, [period])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/factory/reports?period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      } else {
        setReports([])
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  const revenue = reports.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0)
  const expenses = reports.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0)
  const profit = revenue - expenses
  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0'

  const rawMaterials = reports.filter(r => r.category === 'materials').reduce((sum, r) => sum + r.amount, 0)
  const labor = reports.filter(r => r.category === 'labor').reduce((sum, r) => sum + r.amount, 0)
  const utilities = reports.filter(r => r.category === 'utilities').reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Factory Reports</h1>
          <p className="text-muted-foreground">Performance analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={period === 'monthly' ? 'default' : 'outline'}
            onClick={() => setPeriod('monthly')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Monthly
          </Button>
          <Button 
            variant={period === 'yearly' ? 'default' : 'outline'}
            onClick={() => setPeriod('yearly')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Yearly
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading reports...</div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <Badge variant="secondary" className="text-sm">
              {period === 'monthly' ? 'Current Month' : 'Current Year'} Report
            </Badge>
            <Badge variant={profit >= 0 ? 'default' : 'destructive'}>
              {profit >= 0 ? 'Profit' : 'Loss'}: ₹{Math.abs(profit).toLocaleString()}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold text-green-600">₹{revenue.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Expenses</p>
                    <p className="text-2xl font-bold text-red-600">₹{expenses.toLocaleString()}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{profit >= 0 ? 'Profit' : 'Loss'}</p>
                    <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{Math.abs(profit).toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className={`w-8 h-8 ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Margin</p>
                    <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {margin}%
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profit/Loss Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Revenue</span>
                    <span className="font-bold text-green-600">₹{revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Expenses</span>
                    <span className="font-bold text-red-600">₹{expenses.toLocaleString()}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between">
                    <span className="font-bold">Net {profit >= 0 ? 'Profit' : 'Loss'}</span>
                    <span className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{Math.abs(profit).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profit Margin</span>
                    <span className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {margin}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rawMaterials > 0 && (
                    <div className="flex justify-between">
                      <span>Raw Materials</span>
                      <span className="font-bold">₹{rawMaterials.toLocaleString()}</span>
                    </div>
                  )}
                  {labor > 0 && (
                    <div className="flex justify-between">
                      <span>Labor</span>
                      <span className="font-bold">₹{labor.toLocaleString()}</span>
                    </div>
                  )}
                  {utilities > 0 && (
                    <div className="flex justify-between">
                      <span>Utilities</span>
                      <span className="font-bold">₹{utilities.toLocaleString()}</span>
                    </div>
                  )}
                  {rawMaterials === 0 && labor === 0 && utilities === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      <BarChart3 className="mx-auto h-8 w-8 mb-2" />
                      <p>No cost data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}