import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withFeatureAccess } from '@/lib/api-middleware'
import { ObjectId } from 'mongodb'

export const GET = withFeatureAccess('reports')(async function(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const salesCollection = await getTenantCollection(session.user.tenantId, 'sales')
    const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')
    const expensesCollection = await getTenantCollection(session.user.tenantId, 'expenses')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const previousStartDate = new Date()
    previousStartDate.setDate(previousStartDate.getDate() - (days * 2))

    // Current period data
    const currentPeriodSales = await salesCollection.find({
      createdAt: { $gte: startDate }
    }).toArray()

    // Previous period data for comparison
    const previousPeriodSales = await salesCollection.find({
      createdAt: { 
        $gte: previousStartDate,
        $lt: startDate
      }
    }).toArray()

    // Calculate current period metrics
    const totalRevenue = Number(currentPeriodSales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0))
    const totalTransactions = currentPeriodSales.length

    // Calculate previous period metrics
    const previousRevenue = Number(previousPeriodSales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0))

    // Calculate profit for current period
    let totalProfit = 0
    const productSales = new Map()

    for (const sale of currentPeriodSales) {
      for (const item of sale.items || []) {
        const key = item.id
        if (!productSales.has(key)) {
          productSales.set(key, {
            id: key,
            name: item.name,
            quantity: 0,
            revenue: 0
          })
        }
        
        const product = productSales.get(key)
        product.quantity += Number(item.quantity) || 0
        product.revenue += (Number(item.price) || 0) * (Number(item.quantity) || 0)
      }
    }

    // Get cost prices for profit calculation
    const productIds = Array.from(productSales.keys()).filter(id => ObjectId.isValid(id))
    const products = productIds.length > 0 ? await inventoryCollection.find({
      _id: { $in: productIds.map(id => new ObjectId(id)) }
    }).toArray() : []

    const productCosts = products.reduce((acc: any, product: any) => {
      acc[product._id.toString()] = product.costPrice || 0
      return acc
    }, {})

    // Get expenses for the current period
    let currentExpenses = []
    let totalExpenses = 0
    try {
      currentExpenses = await expensesCollection.find({
        date: { $gte: startDate }
      }).toArray()
      totalExpenses = Number(currentExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0))
    } catch (error) {
      console.log('Expenses collection not found or error:', error)
    }

    // Calculate total profit and top products
    const topProducts = []
    for (const [productId, productData] of productSales) {
      const costPrice = Number(productCosts[productId]) || 0
      const profit = Number(productData.revenue) - (costPrice * Number(productData.quantity))
      totalProfit += profit

      topProducts.push({
        name: productData.name,
        quantity: Number(productData.quantity),
        revenue: Number(productData.revenue),
        profit: Number(profit)
      })
    }
    
    // Subtract business expenses from total profit
    totalProfit -= totalExpenses

    // Sort top products by revenue
    topProducts.sort((a, b) => b.revenue - a.revenue)

    // Calculate growth rates
    const salesGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0

    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    // Get previous period expenses
    let previousExpenses = []
    let previousTotalExpenses = 0
    try {
      previousExpenses = await expensesCollection.find({
        date: { 
          $gte: previousStartDate,
          $lt: startDate
        }
      }).toArray()
      previousTotalExpenses = Number(previousExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0))
    } catch (error) {
      console.log('Previous expenses error:', error)
    }

    // Calculate previous period profit for growth comparison
    let previousProfit = 0
    for (const sale of previousPeriodSales) {
      for (const item of sale.items || []) {
        const costPrice = Number(productCosts[item.id]) || 0
        previousProfit += ((Number(item.price) || 0) * (Number(item.quantity) || 0)) - (costPrice * (Number(item.quantity) || 0))
      }
    }
    
    // Subtract previous period expenses
    previousProfit -= previousTotalExpenses

    const profitGrowth = previousProfit > 0 
      ? ((totalProfit - previousProfit) / previousProfit) * 100 
      : 0

    const summary = {
      totalRevenue: Number(totalRevenue),
      totalProfit: Number(totalProfit),
      totalExpenses: Number(totalExpenses),
      totalTransactions: Number(totalTransactions),
      profitMargin: Number(profitMargin),
      topProducts: topProducts.slice(0, 10),
      recentTrends: {
        salesGrowth: Number(salesGrowth),
        profitGrowth: Number(profitGrowth)
      },
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      }
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Summary analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch summary analytics' }, { status: 500 })
  }
})