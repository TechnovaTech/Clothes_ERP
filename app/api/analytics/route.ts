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
          totalRevenue: { $sum: "$total" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]

    const salesData = await salesCollection.aggregate(pipeline).toArray()
  
    const results = salesData.map((day: any) => {
      const revenue = day.totalRevenue || 0
      const profit = revenue * 0.3
      const cost = revenue - profit
      
      return {
        date: day._id,
        totalProfit: profit,
        totalRevenue: revenue,
        totalCost: cost
      }
    })
  
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
              totalTransactions: 0
            }
          }
          productStats[id].totalQuantity += item.quantity || 0
          productStats[id].totalRevenue += (item.price || 0) * (item.quantity || 0)
          productStats[id].totalTransactions += 1
        })
      }
    })
    
    const results = Object.values(productStats)
      .sort((a: any, b: any) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10)
      .map((item: any) => ({
        ...item,
        profit: item.totalRevenue * 0.3
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
          monthStr: { $dateToString: { format: "%Y-%m", date: "$createdAtDate" } }
        }
      },
    {
      $group: {
        _id: "$monthStr",
        totalRevenue: { $sum: "$total" },
        totalTransactions: { $sum: 1 }
      }
    },
    {
      $sort: { _id: -1 }
    }
  ]

  const salesData = await salesCollection.aggregate(pipeline).toArray()
  
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
  
  const monthlyNetProfit = salesData.map((monthData: any) => {
    const grossProfit = monthData.totalRevenue * 0.3
    const expenses = expensesByMonth[monthData._id] || 0
    const netProfit = grossProfit - expenses

    return {
      month: monthData._id,
      monthName: new Date(monthData._id + '-01').toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }),
      revenue: monthData.totalRevenue,
      grossProfit: grossProfit,
      cost: monthData.totalRevenue - grossProfit,
      expenses: expenses,
      netProfit: netProfit,
      profitMargin: monthData.totalRevenue > 0 ? (netProfit / monthData.totalRevenue) * 100 : 0
    }
  })

    return NextResponse.json(monthlyNetProfit)
  } catch (error) {
    console.error('Monthly profit error:', error)
    return NextResponse.json([])
  }
}