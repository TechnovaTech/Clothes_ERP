"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"
import { 
  ShoppingCart, 
  Package, 
  TrendingUp,
  DollarSign,
  AlertTriangle
} from "lucide-react"
import { StoreHeader } from "@/components/store-header"

interface SummaryData {
  salesSummary: {
    totalSales: number
    todaySales: number
    salesTrend: number
    todayOrders: number
    todayProfit: number
  }
  purchaseSummary: {
    totalPurchases: number
    todayPurchases: number
    purchaseTrend: number
    pendingOrders: number
    completedOrders: number
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
    salesSummary: { totalSales: 0, todaySales: 0, salesTrend: 0, todayOrders: 0, todayProfit: 0 },
    purchaseSummary: { totalPurchases: 0, todayPurchases: 0, purchaseTrend: 0, pendingOrders: 0, completedOrders: 0 },
    inventorySummary: { totalProducts: 0, stockValue: 0, lowStockCount: 0 }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSummaryData()
  }, [])

  const fetchSummaryData = async () => {
    try {
      const response = await fetch('/api/dashboard/summary', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      console.log('Summary API Status:', response.status)
      if (response.ok) {
        const summaryData = await response.json()
        console.log('Summary API Response:', summaryData)
        setData({
          salesSummary: summaryData.salesSummary || { totalSales: 0, todaySales: 0, salesTrend: 0, todayOrders: 0, todayProfit: 0 },
          purchaseSummary: summaryData.purchaseSummary || { totalPurchases: 0, todayPurchases: 0, purchaseTrend: 0, pendingOrders: 0, completedOrders: 0 },
          inventorySummary: summaryData.inventorySummary || { totalProducts: 0, stockValue: 0, lowStockCount: 0 }
        })
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
          <CardTitle className="text-xl font-medium text-gray-700">
            {language === 'en' ? 'Sales Summary' : language === 'gu' ? 'વેચાણ સારાંશ' : 'बिक्री सारांश'}
          </CardTitle>
          <div className="p-2 bg-purple-100 rounded-full">
            <ShoppingCart className="h-5 w-5 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2 py-4">
          <div className="text-2xl font-bold text-purple-600">{formatCurrency(data.salesSummary.todaySales)}</div>
          <div className="flex items-center text-xs text-gray-600">
            <TrendingUp className="h-3 w-3 mr-1 text-purple-500" />
            <span className="font-medium">{language === 'en' ? 'Today Sales' : language === 'gu' ? 'આજના વેચાણ' : 'आज की बिक्री'}</span>
          </div>
          <div className="text-xs text-gray-600 pt-1 border-t space-y-1">
            <div>
              <span>{language === 'en' ? 'Total:' : language === 'gu' ? 'કુલ:' : 'कुल:'}</span>
              <span className="font-semibold text-purple-600 ml-1">{formatCurrency(data.salesSummary.totalSales)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <Package className="h-3 w-3 mr-1 text-blue-500" />
                <span>{language === 'en' ? 'Orders:' : language === 'gu' ? 'ઓર્ડર:' : 'ऑर्डर:'}</span>
                <span className="font-semibold text-blue-600 ml-1">{data.salesSummary.todayOrders || 0}</span>
              </div>
              <div className="flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                <span>{language === 'en' ? 'Profit:' : language === 'gu' ? 'નફો:' : 'लाभ:'}</span>
                <span className="font-semibold text-green-600 ml-1">{formatCurrency(data.salesSummary.todayProfit || 0)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Summary */}
      <Card className="bg-white border-l-4 border-l-rose-500 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-medium text-gray-700">
            {language === 'en' ? 'Purchase Summary' : language === 'gu' ? 'ખરીદી સારાંશ' : 'खरीदारी सारांश'}
          </CardTitle>
          <div className="p-2 bg-rose-100 rounded-full">
            <DollarSign className="h-5 w-5 text-rose-600" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2 py-4">
          <div className="text-2xl font-bold text-rose-600">{formatCurrency(data.purchaseSummary.todayPurchases)}</div>
          <div className="flex items-center text-xs text-gray-600">
            <TrendingUp className="h-3 w-3 mr-1 text-rose-500" />
            <span className="font-medium">{language === 'en' ? 'Today Purchases' : language === 'gu' ? 'આજની ખરીદી' : 'आज की खरीदारी'}</span>
          </div>
          <div className="text-xs text-gray-600 pt-1 border-t space-y-1">
            <div>
              <span>{language === 'en' ? 'Total:' : language === 'gu' ? 'કુલ:' : 'कुल:'}</span>
              <span className="font-semibold text-rose-600 ml-1">{formatCurrency(data.purchaseSummary.totalPurchases)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <Package className="h-3 w-3 mr-1 text-orange-500" />
                <span>{language === 'en' ? 'Pending:' : language === 'gu' ? 'બાકી:' : 'लंबित:'}</span>
                <span className="font-semibold text-orange-600 ml-1">{data.purchaseSummary.pendingOrders || 0}</span>
              </div>
              <div className="flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                <span>{language === 'en' ? 'Complete:' : language === 'gu' ? 'પૂર્ણ:' : 'पूर्ण:'}</span>
                <span className="font-semibold text-green-600 ml-1">{data.purchaseSummary.completedOrders || 0}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Summary */}
      <Card className="bg-white border-l-4 border-l-teal-500 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-medium text-gray-700">
            {language === 'en' ? 'Inventory Summary' : language === 'gu' ? 'ઇન્વેન્ટરી સારાંશ' : 'इन्वेंटरी सारांश'}
          </CardTitle>
          <div className="p-2 bg-teal-100 rounded-full">
            <Package className="h-5 w-5 text-teal-600" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2 py-4">
          <div className="text-2xl font-bold text-teal-600">{data.inventorySummary.totalProducts}</div>
          <div className="flex items-center text-xs text-gray-600">
            <Package className="h-3 w-3 mr-1 text-teal-500" />
            <span className="font-medium">{language === 'en' ? 'Total Products' : language === 'gu' ? 'કુલ ઉત્પાદનો' : 'कुल उत्पाद'}</span>
          </div>
          <div className="text-xs text-gray-600 pt-1 border-t space-y-1">
            <div>
              <span>{language === 'en' ? 'Value:' : language === 'gu' ? 'મૂલ્ય:' : 'मूल्य:'}</span>
              <span className="font-semibold text-teal-600 ml-1">{formatCurrency(data.inventorySummary.stockValue)}</span>
            </div>
            <div className="flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1 text-orange-500" />
              <span>{language === 'en' ? 'Low Stock:' : language === 'gu' ? 'ઓછો સ્ટોક:' : 'कम स्टॉक:'}</span>
              <span className="font-semibold text-orange-600 ml-1">{data.inventorySummary.lowStockCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}