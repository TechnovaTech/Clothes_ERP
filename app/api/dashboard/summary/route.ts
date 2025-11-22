import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTenantCollection } from '@/lib/tenant-data'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  console.log('Dashboard Summary API - Session:', JSON.stringify(session?.user))
  
  if (!session?.user?.tenantId) {
    console.log('Dashboard Summary API - No tenant ID')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    
    const totalSales = Number(allSales.reduce((sum: number, sale: any) => sum + (Number(sale.total) || 0), 0))
    const todaySalesAmount = Number(todaySales.reduce((sum: number, sale: any) => sum + (Number(sale.total) || 0), 0))
    const todayOrders = todaySales.length
    const todayProfit = Number(todaySales.reduce((sum: number, sale: any) => {
      const saleTotal = Number(sale.total) || 0
      const saleCost = Number(sale.cost) || (saleTotal * 0.7)
      return sum + (saleTotal - saleCost)
    }, 0))

    // Purchase Summary
    const allPurchases = await purchasesCollection.find({}).toArray()
    const todayPurchases = await purchasesCollection.find({ createdAt: { $gte: startOfToday } }).toArray()
    
    const totalPurchases = Number(allPurchases.reduce((sum: number, purchase: any) => sum + (Number(purchase.total) || 0), 0))
    const todayPurchasesAmount = Number(todayPurchases.reduce((sum: number, purchase: any) => sum + (Number(purchase.total) || 0), 0))
    const pendingOrders = await purchasesCollection.countDocuments({ status: 'pending' })
    const completedOrders = await purchasesCollection.countDocuments({ status: 'completed' })

    // Inventory Summary
    const products = await inventoryCollection.find({}).toArray()
    const totalProducts = products.length
    const stockValue = Number(products.reduce((sum: number, product: any) => 
      sum + ((Number(product.stock) || 0) * (Number(product.price) || 0)), 0
    ))
    const lowStockCount = products.filter((p: any) => 
      (Number(p.stock) || 0) <= (Number(p.minStock || p.min_stock) || 0)
    ).length

    const summary = {
      salesSummary: {
        totalSales,
        todaySales: todaySalesAmount,
        salesTrend: 0,
        todayOrders,
        todayProfit
      },
      purchaseSummary: {
        totalPurchases,
        todayPurchases: todayPurchasesAmount,
        purchaseTrend: 0,
        pendingOrders,
        completedOrders
      },
      inventorySummary: {
        totalProducts,
        stockValue,
        lowStockCount
      }
    }
    console.log('Dashboard Summary API - Returning:', summary)
    return NextResponse.json(summary)
}