import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')
    
    // Get all inventory items for statistics calculation
    const allInventory = await inventoryCollection.find({}).toArray()
    console.log('Stats API - Found items:', allInventory.length)
    
    // Calculate statistics
    const totalProducts = allInventory.length
    const lowStockItems = allInventory.filter((item) => {
      const stock = item.stock || 0
      const minStock = item.minStock || item.min_stock || item['Min Stock'] || 0
      return stock <= minStock
    }).length
    
    const totalValue = allInventory.reduce((sum, item) => {
      const unitPrice = Number(item.price) || Number(item.costPrice) || 0
      const stockQuantity = Number(item.stock) || 0
      return sum + (stockQuantity * unitPrice)
    }, 0)
    
    const categories = new Set(allInventory.map((item) => item.category)).size
    
    return NextResponse.json({
      totalProducts,
      lowStockItems,
      totalValue,
      categories
    })
  } catch (error) {
    console.error('Inventory stats fetch error:', error)
    return NextResponse.json({
      totalProducts: 0,
      lowStockItems: 0,
      totalValue: 0,
      categories: 0
    })
  }
}