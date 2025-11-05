"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Receipt, DollarSign, TrendingUp, Building2, Calendar } from "lucide-react"

export default function FactoryExpensesPage() {
  const [selectedFactory, setSelectedFactory] = useState("all")
  const [selectedMonth, setSelectedMonth] = useState("current")
  const [factories, setFactories] = useState([])
  const [expenses, setExpenses] = useState([])

  useEffect(() => {
    fetchFactories()
    fetchExpenses()
  }, [selectedFactory, selectedMonth])

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

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/manufacturer/expenses')
      if (response.ok) {
        const data = await response.json()
        setExpenses(data)
      } else {
        setExpenses([])
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error)
      setExpenses([])
    }
  }

  const filteredExpenses = selectedFactory === "all" 
    ? expenses 
    : expenses.filter(expense => expense.factoryId === selectedFactory)

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {})

  const expensesByFactory = expenses.reduce((acc, expense) => {
    acc[expense.factoryName] = (acc[expense.factoryName] || 0) + expense.amount
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Factory Expenses</h1>
          <p className="text-muted-foreground">Track expenses across all factories</p>
        </div>
        <div className="flex space-x-4">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Month</SelectItem>
              <SelectItem value="last">Last Month</SelectItem>
              <SelectItem value="last3">Last 3 Months</SelectItem>
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

      {/* Expense Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">₹{totalExpenses.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Factories</p>
                <p className="text-2xl font-bold">{selectedFactory === "all" ? Object.keys(expensesByFactory).length : 1}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{Object.keys(expensesByCategory).length}</p>
              </div>
              <Receipt className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg per Factory</p>
                <p className="text-2xl font-bold">₹{Math.round(totalExpenses / Math.max(Object.keys(expensesByFactory).length, 1)).toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Factory-wise Breakdown */}
      {selectedFactory === "all" && (
        <Card>
          <CardHeader>
            <CardTitle>Factory-wise Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(expensesByFactory).map(([factoryName, amount]) => (
                <div key={factoryName} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-6 h-6 text-blue-500" />
                    <div>
                      <p className="font-medium">{factoryName}</p>
                      <p className="text-sm text-muted-foreground">Total expenses</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">₹{amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{Math.round((amount / totalExpenses) * 100)}% of total</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedFactory === "all" ? "All Factory Expenses" : "Factory Expenses"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Receipt className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {expense.factoryName} • {expense.category}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-lg font-bold">₹{expense.amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{expense.category}</p>
                  </div>
                  <Badge variant={
                    expense.status === 'Paid' ? 'default' : 
                    expense.status === 'Approved' ? 'secondary' : 'destructive'
                  }>
                    {expense.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}