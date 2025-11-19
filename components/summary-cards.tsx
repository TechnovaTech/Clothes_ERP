"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"
import { 
  ShoppingCart, 
  Package, 
  TrendingUp,
  DollarSign
} from "lucide-react"
import { StoreHeader } from "@/components/store-header"

interface SummaryData {
  salesSummary: {
    totalSales: number
    todaySales: number
    salesTrend: number
  }
  purchaseSummary: {
    totalPurchases: number
    todayPurchases: number
    purchaseTrend: number
  }
  inventorySummary: {
    totalProducts: number
    stockValue: number
    lowStockCount: number
  }
}

export function SummaryCards() {
  const { t, language } = useLanguage()
  const [data, setData] = useState<SummaryData>({
    salesSummary: { totalSales: 0, todaySales: 0, salesTrend: 0 },
    purchaseSummary: { totalPurchases: 0, todayPurchases: 0, purchaseTrend: 0 },
    inventorySummary: { totalProducts: 0, stockValue: 0, lowStockCount: 0 }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSummaryData()
  }, [])

  const fetchSummaryData = async () => {
    try {
      const response = await fetch('/api/dashboard/summary')
      if (response.ok) {
        const summaryData = await response.json()
        setData(summaryData)
      }
    } catch (error) {
      console.error('Error fetching summary data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div>
      <StoreHeader />
      <div className="grid gap-6 md:grid-cols-3 mb-6">
      {/* Sales Summary */}
      <Card className="bg-white border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Sales Summary</CardTitle>
          <div className="p-2 bg-purple-100 rounded-full">
            <ShoppingCart className="h-5 w-5 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{formatCurrency(data.salesSummary.todaySales)}</div>
          <div className="flex items-center text-xs text-gray-600 mt-1">
            <TrendingUp className="h-3 w-3 mr-1 text-purple-500" />
            {language === 'en' ? 'Today Sales' : language === 'gu' ? 'આજના વેચાણ' : 'आज की बिक्री'}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {language === 'en' ? 'Total:' : language === 'gu' ? 'કુલ:' : 'कुल:'} <span className="font-semibold text-purple-600">{formatCurrency(data.salesSummary.totalSales)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Summary */}
      <Card className="bg-white border-l-4 border-l-rose-500 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Purchase Summary</CardTitle>
          <div className="p-2 bg-rose-100 rounded-full">
            <DollarSign className="h-5 w-5 text-rose-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-rose-600">{formatCurrency(data.purchaseSummary.todayPurchases)}</div>
          <div className="flex items-center text-xs text-gray-600 mt-1">
            <TrendingUp className="h-3 w-3 mr-1 text-rose-500" />
            {language === 'en' ? 'Today Purchases' : language === 'gu' ? 'આજની ખરીદી' : 'आज की खरीदारी'}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {language === 'en' ? 'Total:' : language === 'gu' ? 'કુલ:' : 'कुल:'} <span className="font-semibold text-rose-600">{formatCurrency(data.purchaseSummary.totalPurchases)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Summary */}
      <Card className="bg-white border-l-4 border-l-teal-500 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Inventory Summary</CardTitle>
          <div className="p-2 bg-teal-100 rounded-full">
            <Package className="h-5 w-5 text-teal-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-teal-600">{data.inventorySummary.totalProducts}</div>
          <div className="flex items-center text-xs text-gray-600 mt-1">
            <Package className="h-3 w-3 mr-1 text-teal-500" />
            {language === 'en' ? 'Total Products' : language === 'gu' ? 'કુલ ઉત્પાદનો' : 'कुल उत्पाد'}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {language === 'en' ? 'Value:' : language === 'gu' ? 'મૂલ્ય:' : 'मूल्य:'} <span className="font-semibold text-teal-600">{formatCurrency(data.inventorySummary.stockValue)}</span>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}