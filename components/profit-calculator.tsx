"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { TrendingUp, TrendingDown, DollarSign, Minus, Plus } from "lucide-react"

interface ProfitData {
  revenue: number
  costPrice: number
  grossProfit: number
  expenses: number
  netProfit: number
  profitMargin: number
}

interface ProfitCalculatorProps {
  period?: 'today' | 'month' | 'year'
  className?: string
}

export function ProfitCalculator({ period = 'today', className = '' }: ProfitCalculatorProps) {
  const { t } = useLanguage()
  const [profitData, setProfitData] = useState<ProfitData>({
    revenue: 0,
    costPrice: 0,
    grossProfit: 0,
    expenses: 0,
    netProfit: 0,
    profitMargin: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfitData()
  }, [period])

  const fetchProfitData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/profit-calculation?period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setProfitData(data)
      }
    } catch (error) {
      console.error('Failed to fetch profit data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </CardHeader>
        <CardContent className="animate-pulse">
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${className} border-l-4 ${profitData.netProfit >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>{t('profitCalculation')} ({period === 'today' ? t('today') : period === 'month' ? t('thisMonth') : t('thisYear')})</span>
          </span>
          <Badge variant={profitData.netProfit >= 0 ? "default" : "destructive"}>
            {profitData.profitMargin.toFixed(1)}% {t('margin')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Revenue */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Plus className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">{t('totalRevenue')}</span>
            </div>
            <span className="font-bold text-blue-600">{formatCurrency(profitData.revenue)}</span>
          </div>

          {/* Cost Price */}
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Minus className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-orange-800">{t('totalCostPrice')}</span>
            </div>
            <span className="font-bold text-orange-600">-{formatCurrency(profitData.costPrice)}</span>
          </div>

          {/* Gross Profit */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-2 border-green-200">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">{t('grossProfit')}</span>
            </div>
            <span className="font-bold text-green-600">{formatCurrency(profitData.grossProfit)}</span>
          </div>

          {/* Expenses */}
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Minus className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-800">{t('totalExpenses')}</span>
            </div>
            <span className="font-bold text-red-600">-{formatCurrency(profitData.expenses)}</span>
          </div>

          {/* Net Profit */}
          <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
            profitData.netProfit >= 0 
              ? 'bg-green-100 border-green-300' 
              : 'bg-red-100 border-red-300'
          }`}>
            <div className="flex items-center space-x-2">
              {profitData.netProfit >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-bold text-lg ${
                profitData.netProfit >= 0 ? 'text-green-800' : 'text-red-800'
              }`}>
                {t('netProfit')}
              </span>
            </div>
            <span className={`font-bold text-xl ${
              profitData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(profitData.netProfit)}
            </span>
          </div>

          {/* Calculation Formula */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            <div className="font-medium mb-2">{t('calculationFormula')}:</div>
            <div className="space-y-1">
              <div>{t('grossProfit')} = {t('revenue')} - {t('costPrice')}</div>
              <div>{t('netProfit')} = {t('grossProfit')} - {t('expenses')}</div>
              <div>{t('profitMargin')} = ({t('netProfit')} ÷ {t('revenue')}) × 100</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}