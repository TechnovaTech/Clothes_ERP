import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const days = parseInt(searchParams.get('days') || '30')

    const salesCollection = await getTenantCollection(session.user.tenantId, 'sales')
    const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    switch (type) {
      case 'daily-sales':
        return await getDailySales(salesCollection, startDate)
      
      case 'daily-profit':
        return await getDailyProfit(salesCollection, inventoryCollection, startDate)
      
      case 'best-sellers':
        return await getBestSellers(salesCollection, inventoryCollection, startDate)
      
      case 'monthly-profit':
        return await getMonthlyNetProfit(salesCollection, inventoryCollection, startDate, session.user.tenantId)
      
      default:
        return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

async function getDailySales(salesCollection: any, startDate: Date) {
  const today = new Date().toISOString().split('T')[0]
  
  const pipeline = [
    {
      $addFields: {
        createdAtDate: {
          $cond: {
            if: { $eq: [{ $type: "$createdAt" }, "date"] },
            then: "$createdAt",
            else: { $toDate: "$createdAt" }
          }
        }
      }
    },
    {
      $addFields: {
        dateStr: { $dateToString: { format: "%Y-%m-%d", date: "$createdAtDate" } }
      }
    },
    {
      $group: {
        _id: "$dateStr",
        totalSales: { $sum: "$total" },
        totalTransactions: { $sum: 1 },
        averageSale: { $avg: "$total" }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]

  const results = await salesCollection.aggregate(pipeline).toArray()
  
  // Ensure today's data exists even if 0
  const todayData = results.find((r: any) => r._id === today)
  if (!todayData) {
    results.push({
      _id: today,
      totalSales: 0,
      totalTransactions: 0,
      averageSale: 0
    })
  }
  
  return NextResponse.json(results)
}

async function getDailyProfit(salesCollection: any, inventoryCollection: any, startDate: Date) {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Get all sales with items
    const sales = await salesCollection.find({}).toArray()
    const dailyData: any = {}
    
    // Get all inventory items for cost price lookup
    const inventory = await inventoryCollection.find({}).toArray()
    const inventoryMap = inventory.reduce((acc: any, item: any) => {
      acc[item._id?.toString()] = item
      return acc
    }, {})
    
    sales.forEach((sale: any) => {
      const saleDate = new Date(sale.createdAt).toISOString().split('T')[0]
      
      if (!dailyData[saleDate]) {
        dailyData[saleDate] = {
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0
        }
      }
      
      dailyData[saleDate].totalRevenue += sale.total || 0
      
      // Calculate actual cost and profit from items
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const product = inventoryMap[item.id] || inventoryMap[item._id]
          if (product) {
            // Get cost price from dynamic fields
            const costPrice = product['Cost Price'] || product['cost price'] || product.costPrice || product['costprice'] || 0
            const sellingPrice = item.price || 0
            const quantity = item.quantity || 0
            
            const itemCost = costPrice * quantity
            const itemRevenue = sellingPrice * quantity
            const itemProfit = itemRevenue - itemCost
            
            dailyData[saleDate].totalCost += itemCost
            dailyData[saleDate].totalProfit += itemProfit
          }
        })
      }
    })
    
    const results = Object.keys(dailyData).map(date => ({
      date,
      totalProfit: dailyData[date].totalProfit,
      totalRevenue: dailyData[date].totalRevenue,
      totalCost: dailyData[date].totalCost
    }))
    
    // Ensure today's data exists
    if (!results.find((r: any) => r.date === today)) {
      results.push({ date: today, totalProfit: 0, totalRevenue: 0, totalCost: 0 })
    }

    return NextResponse.json(results.sort((a: any, b: any) => a.date.localeCompare(b.date)))
  } catch (error) {
    console.error('Daily profit error:', error)
    return NextResponse.json([])
  }
}

async function getBestSellers(salesCollection: any, inventoryCollection: any, startDate: Date) {
  try {
    const sales = await salesCollection.find({}).toArray()
    const productStats: any = {}
    
    // Get all inventory items for cost price lookup
    const inventory = await inventoryCollection.find({}).toArray()
    const inventoryMap = inventory.reduce((acc: any, item: any) => {
      acc[item._id?.toString()] = item
      return acc
    }, {})
    
    sales.forEach((sale: any) => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const id = item.id || item._id
          if (!productStats[id]) {
            productStats[id] = {
              _id: id,
              productName: item.name || 'Unknown',
              totalQuantity: 0,
              totalRevenue: 0,
              totalCost: 0,
              totalTransactions: 0
            }
          }
          
          const quantity = item.quantity || 0
          const sellingPrice = item.price || 0
          const product = inventoryMap[id]
          const costPrice = product ? (product['Cost Price'] || product['cost price'] || product.costPrice || product['costprice'] || 0) : 0
          
          productStats[id].totalQuantity += quantity
          productStats[id].totalRevenue += sellingPrice * quantity
          productStats[id].totalCost += costPrice * quantity
          productStats[id].totalTransactions += 1
        })
      }
    })
    
    const results = Object.values(productStats)
      .sort((a: any, b: any) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10)
      .map((item: any) => ({
        ...item,
        profit: item.totalRevenue - item.totalCost // Actual profit = Revenue - Cost
      }))

    return NextResponse.json(results)
  } catch (error) {
    console.error('Best sellers error:', error)
    return NextResponse.json([])
  }
}

async function getMonthlyNetProfit(salesCollection: any, inventoryCollection: any, startDate: Date, tenantId: string) {
  try {
    const expensesCollection = await getTenantCollection(tenantId, 'expenses')
    
    // Get all sales with items
    const sales = await salesCollection.find({}).toArray()
    const monthlyData: any = {}
    
    // Get all inventory items for cost price lookup
    const inventory = await inventoryCollection.find({}).toArray()
    const inventoryMap = inventory.reduce((acc: any, item: any) => {
      acc[item._id?.toString()] = item
      return acc
    }, {})
    
    sales.forEach((sale: any) => {
      const saleMonth = new Date(sale.createdAt).toISOString().substring(0, 7) // YYYY-MM
      
      if (!monthlyData[saleMonth]) {
        monthlyData[saleMonth] = {
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0
        }
      }
      
      monthlyData[saleMonth].totalRevenue += sale.total || 0
      
      // Calculate actual cost and profit from items
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const product = inventoryMap[item.id] || inventoryMap[item._id]
          if (product) {
            // Get cost price from dynamic fields
            const costPrice = product['Cost Price'] || product['cost price'] || product.costPrice || product['costprice'] || 0
            const sellingPrice = item.price || 0
            const quantity = item.quantity || 0
            
            const itemCost = costPrice * quantity
            const itemRevenue = sellingPrice * quantity
            const itemProfit = itemRevenue - itemCost
            
            monthlyData[saleMonth].totalCost += itemCost
            monthlyData[saleMonth].totalProfit += itemProfit
          }
        })
      }
    })
    
    // Get monthly expenses
    const expensesPipeline = [
      {
        $addFields: {
          dateField: {
            $cond: {
              if: { $eq: [{ $type: "$date" }, "date"] },
              then: "$date",
              else: { $toDate: "$date" }
            }
          }
        }
      },
      {
        $addFields: {
          monthStr: { $dateToString: { format: "%Y-%m", date: "$dateField" } }
        }
      },
      {
        $group: {
          _id: "$monthStr",
          totalExpenses: { $sum: "$amount" }
        }
      }
    ]
    
    const expensesData = await expensesCollection.aggregate(expensesPipeline).toArray().catch(() => [])
    const expensesByMonth = expensesData.reduce((acc: any, expense: any) => {
      acc[expense._id] = expense.totalExpenses
      return acc
    }, {})
    
    const monthlyNetProfit = Object.keys(monthlyData).map((month: string) => {
      const data = monthlyData[month]
      const expenses = expensesByMonth[month] || 0
      const netProfit = data.totalProfit - expenses // Gross Profit - Expenses = Net Profit

      return {
        month: month,
        monthName: new Date(month + '-01').toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }),
        revenue: data.totalRevenue,
        grossProfit: data.totalProfit, // This is actually gross profit (selling price - cost price)
        cost: data.totalCost,
        expenses: expenses,
        netProfit: netProfit,
        profitMargin: data.totalRevenue > 0 ? (netProfit / data.totalRevenue) * 100 : 0
      }
    }).sort((a, b) => b.month.localeCompare(a.month))

    return NextResponse.json(monthlyNetProfit)
  } catch (error) {
    console.error('Monthly profit error:', error)
    return NextResponse.json([])
  }
}