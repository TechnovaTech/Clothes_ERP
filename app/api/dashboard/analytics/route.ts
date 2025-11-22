import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTenantCollection } from '@/lib/tenant-data'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  console.log('Analytics API - Session:', JSON.stringify(session?.user))
  
  if (!session?.user?.tenantId) {
    console.log('Analytics API - No tenant ID')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

    const tenantId = session.user.tenantId
    const salesCollection = await getTenantCollection(tenantId, 'sales')
    const productsCollection = await getTenantCollection(tenantId, 'inventory')
    const customersCollection = await getTenantCollection(tenantId, 'customers')

    // Calculate date ranges
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const yesterday = new Date(startOfToday)
    yesterday.setDate(yesterday.getDate() - 1)

    // Today's sales
    const todaySales = await salesCollection.find({
      createdAt: { $gte: startOfToday }
    }).toArray()

    const todayRevenue = todaySales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0)
    console.log('Analytics API - Today sales count:', todaySales.length, 'Revenue:', todayRevenue)

    // Yesterday's sales for trend calculation
    const yesterdaySales = await salesCollection.find({
      createdAt: { 
        $gte: yesterday,
        $lt: startOfToday
      }
    }).toArray()

    const yesterdayRevenue = yesterdaySales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0)
    const salesTrend = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0

    // Get all sales for product analysis
    const allSales = await salesCollection.find({}).sort({ createdAt: -1 }).limit(1000).toArray()

    // Calculate top products
    const productSales: any = {}
    allSales.forEach(sale => {
      sale.items?.forEach((item: any) => {
        const qty = Number(item.quantity) || 0
        const price = Number(item.price) || 0
        if (productSales[item.name]) {
          productSales[item.name].quantity += qty
          productSales[item.name].revenue += qty * price
        } else {
          productSales[item.name] = {
            name: item.name,
            quantity: qty,
            revenue: qty * price
          }
        }
      })
    })

    const topProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.quantity - a.quantity)
      .slice(0, 5)
    console.log('Analytics API - Top products:', topProducts.length)

    // Get tenant field configuration
    const tenantFieldsCollection = await getTenantCollection(tenantId, 'fields')
    const tenantConfig = await tenantFieldsCollection.findOne({})
    
    // Get products for stock analysis
    const products = await productsCollection.find({}).toArray()
    
    // Calculate stock value
    const stockValue = products.reduce((sum, product) => 
      sum + ((Number(product.stock) || 0) * (Number(product.price) || 0)), 0
    )
    console.log('Analytics API - Products:', products.length, 'Stock value:', stockValue)

    // Helper function to get product name from dynamic fields
    const getProductName = (product: any) => {
      if (tenantConfig?.fields) {
        const nameField = tenantConfig.fields.find((f: any) => 
          f.enabled && (f.name.toLowerCase().includes('name') || f.name.toLowerCase().includes('product'))
        )
        if (nameField) {
          const fieldKey = nameField.name.toLowerCase().replace(/\s+/g, '_')
          return product[fieldKey] || product[nameField.name] || product[nameField.name.toLowerCase()]
        }
      }
      return product.name || product.productname || product.product_name || product['Product Name'] || 'Unnamed Product'
    }

    // Get low stock items
    const lowStockItems = products
      .filter(product => (Number(product.stock) || 0) <= (Number(product.minStock || product.min_stock) || 0) && (Number(product.minStock || product.min_stock) || 0) > 0)
      .map(product => ({
        name: getProductName(product),
        stock: Number(product.stock) || 0,
        minStock: Number(product.minStock || product.min_stock || product['Min Stock']) || 0
      }))
      .slice(0, 10)

    // Find top 3 customers
    const customerPurchases: any = {}
    allSales.forEach(sale => {
      if (sale.customerName && sale.customerName !== 'Walk-in Customer') {
        if (customerPurchases[sale.customerName]) {
          customerPurchases[sale.customerName].totalPurchases += 1
          customerPurchases[sale.customerName].totalSpent += Number(sale.total) || 0
        } else {
          customerPurchases[sale.customerName] = {
            name: sale.customerName,
            totalPurchases: 1,
            totalSpent: Number(sale.total) || 0
          }
        }
      }
    })

    const topCustomers = Object.values(customerPurchases)
      .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
      .slice(0, 3)

    const topCustomer = topCustomers[0] || { name: "No customers", totalPurchases: 0, totalSpent: 0 }

    // Additional metrics
    const totalCustomers = await customersCollection.countDocuments()
    const totalProducts = products.length

    const result = {
      todaySales: todayRevenue,
      salesTrend,
      topProducts,
      stockValue,
      lowStockItems,
      topCustomer,
      topCustomers,
      additionalMetrics: {
        totalCustomers,
        totalProducts,
        todayOrders: todaySales.length,
        lowStockCount: lowStockItems.length
      }
    }
    console.log('Analytics API - Returning:', JSON.stringify(result))
    return NextResponse.json(result)
}