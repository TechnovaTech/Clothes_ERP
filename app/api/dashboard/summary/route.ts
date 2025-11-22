import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTenantCollection } from '@/lib/tenant-data'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Always return debug info
    const debugInfo = {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasTenantId: !!session?.user?.tenantId,
      tenantId: session?.user?.tenantId || 'none'
    }
    
    // Temporary: Use hardcoded tenantId for testing
    let tenantId = session?.user?.tenantId
    if (!tenantId) {
      // Replace with your actual tenantId from local
      tenantId = '691f0591d865755fa6332ff0'
    }

    // tenantId already set above
    const salesCollection = await getTenantCollection(tenantId, 'sales')
    const purchasesCollection = await getTenantCollection(tenantId, 'purchases')
    const inventoryCollection = await getTenantCollection(tenantId, 'inventory')

    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    // Sales Summary
    const allSales = await salesCollection.find({}).toArray()
    const todaySales = await salesCollection.find({ createdAt: { $gte: startOfToday } }).toArray()
    
    console.log('Debug - All Sales:', allSales.length, 'Today Sales:', todaySales.length)
    console.log('Debug - Sample sale:', allSales[0])
    
    const totalSales = Number(allSales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0))
    const todaySalesAmount = Number(todaySales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0))
    const todayOrders = todaySales.length
    const todayProfit = Number(todaySales.reduce((sum, sale) => {
      const saleTotal = Number(sale.total) || 0
      const saleCost = Number(sale.cost) || (saleTotal * 0.7) // Assume 30% profit margin if cost not available
      return sum + (saleTotal - saleCost)
    }, 0))

    // Purchase Summary
    const allPurchases = await purchasesCollection.find({}).toArray()
    const todayPurchases = await purchasesCollection.find({ createdAt: { $gte: startOfToday } }).toArray()
    
    const totalPurchases = Number(allPurchases.reduce((sum, purchase) => sum + (Number(purchase.total) || 0), 0))
    const todayPurchasesAmount = Number(todayPurchases.reduce((sum, purchase) => sum + (Number(purchase.total) || 0), 0))
    const pendingOrders = await purchasesCollection.countDocuments({ status: 'pending' })
    const completedOrders = await purchasesCollection.countDocuments({ status: 'completed' })

    // Inventory Summary
    const products = await inventoryCollection.find({}).toArray()
    console.log('Debug - Products:', products.length)
    console.log('Debug - Sample product:', products[0])
    
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
      },
      debug: {
        tenantId,
        allSalesCount: allSales.length,
        productsCount: products.length,
        sampleSale: allSales[0] || null,
        sampleProduct: products[0] || null
      }
    })
  } catch (error) {
    console.error('Dashboard summary error:', error)
    return NextResponse.json({
      salesSummary: { totalSales: 0, todaySales: 0, salesTrend: 0, todayOrders: 0, todayProfit: 0 },
      purchaseSummary: { totalPurchases: 0, todayPurchases: 0, purchaseTrend: 0, pendingOrders: 0, completedOrders: 0 },
      inventorySummary: { totalProducts: 0, stockValue: 0, lowStockCount: 0 }
    })
  }
}
