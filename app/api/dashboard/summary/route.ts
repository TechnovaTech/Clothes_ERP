import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTenantCollection } from '@/lib/tenant-data'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({
        salesSummary: { totalSales: 0, todaySales: 0, salesTrend: 0 },
        purchaseSummary: { totalPurchases: 0, todayPurchases: 0, purchaseTrend: 0 },
        inventorySummary: { totalProducts: 0, stockValue: 0, lowStockCount: 0 }
      })
    }

    const tenantId = session.user.tenantId
    const salesCollection = await getTenantCollection(tenantId, 'sales')
    const purchasesCollection = await getTenantCollection(tenantId, 'purchases')
    const inventoryCollection = await getTenantCollection(tenantId, 'inventory')

    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    // Sales Summary
    const allSales = await salesCollection.find({}).toArray()
    const todaySales = await salesCollection.find({ createdAt: { $gte: startOfToday } }).toArray()
    
    const totalSales = Number(allSales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0))
    const todaySalesAmount = Number(todaySales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0))

    // Purchase Summary
    const allPurchases = await purchasesCollection.find({}).toArray()
    const todayPurchases = await purchasesCollection.find({ createdAt: { $gte: startOfToday } }).toArray()
    
    const totalPurchases = Number(allPurchases.reduce((sum, purchase) => sum + (Number(purchase.total) || 0), 0))
    const todayPurchasesAmount = Number(todayPurchases.reduce((sum, purchase) => sum + (Number(purchase.total) || 0), 0))

    // Inventory Summary
    const products = await inventoryCollection.find({}).toArray()
    const totalProducts = products.length
    const stockValue = Number(products.reduce((sum, product) => 
      sum + ((Number(product.stock) || 0) * (Number(product.price) || 0)), 0
    ))
    const lowStockCount = products.filter(p => 
      (Number(p.stock) || 0) <= (Number(p.minStock || p.min_stock) || 0)
    ).length

    return NextResponse.json({
      salesSummary: {
        totalSales,
        todaySales: todaySalesAmount,
        salesTrend: 0
      },
      purchaseSummary: {
        totalPurchases,
        todayPurchases: todayPurchasesAmount,
        purchaseTrend: 0
      },
      inventorySummary: {
        totalProducts,
        stockValue,
        lowStockCount
      }
    })
  } catch (error) {
    console.error('Dashboard summary error:', error)
    return NextResponse.json({
      salesSummary: { totalSales: 0, todaySales: 0, salesTrend: 0 },
      purchaseSummary: { totalPurchases: 0, todayPurchases: 0, purchaseTrend: 0 },
      inventorySummary: { totalProducts: 0, stockValue: 0, lowStockCount: 0 }
    })
  }
}
