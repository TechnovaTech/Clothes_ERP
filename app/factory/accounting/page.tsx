"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calculator, TrendingUp, TrendingDown, DollarSign, Plus } from "lucide-react"

interface AccountingEntry {
  id?: string
  type: string
  amount: number
  description: string
  category: string
  createdAt: string
}

export default function AccountingPage() {
  const { data: session } = useSession()
  const [accounting, setAccounting] = useState<AccountingEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAccounting()
  }, [])

  const fetchAccounting = async () => {
    try {
      const response = await fetch('/api/factory/accounting')
      if (response.ok) {
        const data = await response.json()
        setAccounting(data.accounting || [])
      } else {
        setAccounting([])
      }
    } catch (error) {
      console.error('Failed to fetch accounting:', error)
      setAccounting([])
    } finally {
      setLoading(false)
    }
  }

  const revenue = accounting.filter(a => a.type === 'income').reduce((sum, a) => sum + a.amount, 0)
  const expenses = accounting.filter(a => a.type === 'expense').reduce((sum, a) => sum + a.amount, 0)
  const netProfit = revenue - expenses
  const profitMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : '0'

  const salesRevenue = accounting.filter(a => a.category === 'sales').reduce((sum, a) => sum + a.amount, 0)
  const cogs = accounting.filter(a => a.category === 'cogs').reduce((sum, a) => sum + a.amount, 0)
  const operatingExpenses = accounting.filter(a => a.category === 'operating').reduce((sum, a) => sum + a.amount, 0)

  const cashInflow = accounting.filter(a => a.type === 'income').reduce((sum, a) => sum + a.amount, 0)
  const cashOutflow = accounting.filter(a => a.type === 'expense').reduce((sum, a) => sum + a.amount, 0)
  const accountsReceivable = accounting.filter(a => a.category === 'receivable').reduce((sum, a) => sum + a.amount, 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Factory Accounting</h1>
          <p className="text-muted-foreground">Financial management and bookkeeping</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Entry
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading accounting data...</div>
      ) : (
        <>
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
                    <p className="text-sm text-muted-foreground">Net Profit</p>
                    <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{netProfit.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Profit Margin</p>
                    <p className="text-2xl font-bold">{profitMargin}%</p>
                  </div>
                  <Calculator className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Income Statement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Sales Revenue</span>
                    <span className="font-bold text-green-600">₹{salesRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost of Goods Sold</span>
                    <span className="font-bold text-red-600">₹{cogs.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Operating Expenses</span>
                    <span className="font-bold text-red-600">₹{operatingExpenses.toLocaleString()}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between">
                    <span className="font-bold">Net Income</span>
                    <span className={`font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{netProfit.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cash Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Cash Inflow</span>
                    <span className="font-bold text-green-600">₹{cashInflow.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash Outflow</span>
                    <span className="font-bold text-red-600">₹{cashOutflow.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accounts Receivable</span>
                    <span className="font-bold">₹{accountsReceivable.toLocaleString()}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between">
                    <span className="font-bold">Net Cash Flow</span>
                    <span className={`font-bold ${(cashInflow - cashOutflow) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{(cashInflow - cashOutflow).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}