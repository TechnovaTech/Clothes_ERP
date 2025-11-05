'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, DollarSign, TrendingUp, TrendingDown, Calculator, Building2, Edit, Trash2 } from 'lucide-react'
import { showToast } from '@/lib/toast'

export default function AccountingManagement() {
  const [activeTab, setActiveTab] = useState('overview')
  const [transactions, setTransactions] = useState([])
  const [factories, setFactories] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [formData, setFormData] = useState({
    type: 'income',
    category: '',
    amount: '',
    description: '',
    date: '',
    factoryId: '',
    reference: '',
    paymentMethod: 'cash'
  })

  useEffect(() => {
    fetchTransactions()
    fetchFactories()
  }, [])

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/manufacturer/accounting')
      const data = await response.json()
      setTransactions(data.transactions || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFactories = async () => {
    try {
      const response = await fetch('/api/manufacturer/warehouse')
      const data = await response.json()
      setFactories(data.warehouses || [])
    } catch (error) {
      console.error('Error fetching factories:', error)
    }
  }

  const createTransaction = async () => {
    if (!formData.amount || !formData.category || !formData.description) {
      showToast.error('Please fill all required fields')
      return
    }
    
    try {
      const response = await fetch('/api/manufacturer/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        await fetchTransactions()
        setIsAddTransactionOpen(false)
        resetForm()
        showToast.success('✅ Transaction added successfully!')
      } else {
        const error = await response.json()
        showToast.error('❌ Error: ' + error.error)
      }
    } catch (error) {
      console.error('Error creating transaction:', error)
      showToast.error('❌ Failed to create transaction')
    }
  }

  const resetForm = () => {
    setFormData({
      type: 'income',
      category: '',
      amount: '',
      description: '',
      date: '',
      factoryId: '',
      reference: '',
      paymentMethod: 'cash'
    })
  }

  const editTransaction = (transaction: any) => {
    setSelectedTransaction(transaction)
    setFormData({
      type: transaction.type || 'income',
      category: transaction.category || '',
      amount: transaction.amount?.toString() || '',
      description: transaction.description || '',
      date: transaction.date || '',
      factoryId: transaction.factoryId || '',
      reference: transaction.reference || '',
      paymentMethod: transaction.paymentMethod || 'cash'
    })
    setIsEditTransactionOpen(true)
  }

  const updateTransaction = async () => {
    if (!selectedTransaction) return
    
    try {
      const response = await fetch(`/api/manufacturer/accounting/${(selectedTransaction as any)._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        await fetchTransactions()
        setIsEditTransactionOpen(false)
        resetForm()
        setSelectedTransaction(null)
        showToast.success('✅ Transaction updated successfully!')
      } else {
        showToast.error('❌ Failed to update transaction')
      }
    } catch (error) {
      console.error('Error updating transaction:', error)
      showToast.error('❌ Failed to update transaction')
    }
  }

  const deleteTransaction = async (id: string) => {
    try {
      const response = await fetch(`/api/manufacturer/accounting/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchTransactions()
        showToast.success('Transaction deleted successfully!')
      } else {
        showToast.error('Failed to delete transaction')
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      showToast.error('Failed to delete transaction')
    }
  }

  // Calculate totals
  const totalIncome = transactions.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
  const totalExpense = transactions.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
  const netProfit = totalIncome - totalExpense

  // Factory-wise calculations
  const factoryStats = factories.map(factory => {
    const factoryTransactions = transactions.filter((t: any) => t.factoryId === factory.id)
    const income = factoryTransactions.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
    const expense = factoryTransactions.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
    return {
      ...factory,
      income,
      expense,
      profit: income - expense,
      transactionCount: factoryTransactions.length
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Accounting Management</h1>
        <p className="text-muted-foreground">Manage financial records for all factories</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="factories">Factory Wise</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">₹{totalIncome.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">All factories combined</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">₹{totalExpense.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">All factories combined</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <DollarSign className={`h-4 w-4 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{netProfit.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Income - Expenses</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{transactions.length}</div>
                <p className="text-xs text-muted-foreground">All time records</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest financial activities across all factories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Factory</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 5).map((transaction: any) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.type === 'income' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type}
                          </span>
                        </TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell>{factories.find(f => f.id === transaction.factoryId)?.name || 'General'}</TableCell>
                        <TableCell className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                          ₹{transaction.amount?.toLocaleString()}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Transactions</CardTitle>
                  <CardDescription>Complete financial transaction history</CardDescription>
                </div>
                <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Transaction
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Transaction</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Transaction Type *</Label>
                          <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="income">Income</SelectItem>
                              <SelectItem value="expense">Expense</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Category *</Label>
                          <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {formData.type === 'income' ? (
                                <>
                                  <SelectItem value="sales">Sales Revenue</SelectItem>
                                  <SelectItem value="orders">Order Payments</SelectItem>
                                  <SelectItem value="other-income">Other Income</SelectItem>
                                </>
                              ) : (
                                <>
                                  <SelectItem value="materials">Raw Materials</SelectItem>
                                  <SelectItem value="labor">Labor Costs</SelectItem>
                                  <SelectItem value="utilities">Utilities</SelectItem>
                                  <SelectItem value="maintenance">Maintenance</SelectItem>
                                  <SelectItem value="transport">Transportation</SelectItem>
                                  <SelectItem value="other-expense">Other Expenses</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Amount *</Label>
                          <Input 
                            type="number"
                            placeholder="Enter amount" 
                            value={formData.amount}
                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Date *</Label>
                          <Input 
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Factory</Label>
                          <Select value={formData.factoryId} onValueChange={(value) => setFormData({...formData, factoryId: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select factory" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">General (No specific factory)</SelectItem>
                              {factories.map((factory) => (
                                <SelectItem key={factory.id} value={factory.id}>
                                  {factory.name} - {factory.location}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Payment Method</Label>
                          <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({...formData, paymentMethod: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="bank">Bank Transfer</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                              <SelectItem value="upi">UPI</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Reference Number</Label>
                        <Input 
                          placeholder="Transaction reference (optional)" 
                          value={formData.reference}
                          onChange={(e) => setFormData({...formData, reference: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description *</Label>
                        <Textarea 
                          placeholder="Enter transaction description" 
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAddTransactionOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createTransaction}>
                        Add Transaction
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Factory</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <Calculator className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium text-muted-foreground mb-2">No transactions found</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Start by adding your first financial transaction
                          </p>
                          <Button onClick={() => setIsAddTransactionOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add First Transaction
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((transaction: any) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.type === 'income' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.type}
                            </span>
                          </TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell>{factories.find(f => f.id === transaction.factoryId)?.name || 'General'}</TableCell>
                          <TableCell className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                            ₹{transaction.amount?.toLocaleString()}
                          </TableCell>
                          <TableCell>{transaction.paymentMethod}</TableCell>
                          <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <Button variant="ghost" size="sm" onClick={() => editTransaction(transaction)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => deleteTransaction(transaction._id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factories">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Factory-wise Financial Summary</CardTitle>
                <CardDescription>Financial performance breakdown by factory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {factoryStats.map((factory) => (
                    <Card key={factory.id} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h3 className="font-semibold">{factory.name}</h3>
                            <p className="text-sm text-muted-foreground">{factory.location}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">{factory.transactionCount} transactions</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">₹{factory.income.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Income</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-600">₹{factory.expense.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Expenses</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${factory.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{factory.profit.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Profit</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditTransactionOpen} onOpenChange={(open) => {
        setIsEditTransactionOpen(open)
        if (!open) {
          resetForm()
          setSelectedTransaction(null)
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Transaction Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.type === 'income' ? (
                      <>
                        <SelectItem value="sales">Sales Revenue</SelectItem>
                        <SelectItem value="orders">Order Payments</SelectItem>
                        <SelectItem value="other-income">Other Income</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="materials">Raw Materials</SelectItem>
                        <SelectItem value="labor">Labor Costs</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="transport">Transportation</SelectItem>
                        <SelectItem value="other-expense">Other Expenses</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input 
                  type="number"
                  placeholder="Enter amount" 
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input 
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Factory</Label>
                <Select value={formData.factoryId} onValueChange={(value) => setFormData({...formData, factoryId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select factory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General (No specific factory)</SelectItem>
                    {factories.map((factory) => (
                      <SelectItem key={factory.id} value={factory.id}>
                        {factory.name} - {factory.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({...formData, paymentMethod: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reference Number</Label>
              <Input 
                placeholder="Transaction reference (optional)" 
                value={formData.reference}
                onChange={(e) => setFormData({...formData, reference: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea 
                placeholder="Enter transaction description" 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditTransactionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateTransaction}>
              Update Transaction
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}