import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  console.log('Stats API - Session:', JSON.stringify(session?.user))
  
  if (!session?.user?.tenantId) {
    console.log('Stats API - No tenant ID')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')
  console.log('Stats API - Collection:', inventoryCollection.collectionName)
  
  const allInventory = await inventoryCollection.find({}).toArray()
  console.log('Stats API - Found items:', allInventory.length)
  if (allInventory.length > 0) {
    console.log('Stats API - Sample:', JSON.stringify(allInventory[0]))
  }
  
  const totalProducts = allInventory.length
  const lowStockItems = allInventory.filter((item) => {
    const stock = Number(item.stock) || 0
    const minStock = Number(item.minStock || item.min_stock || item['Min Stock']) || 0
    return stock <= minStock
  }).length
  
  const totalValue = allInventory.reduce((sum, item) => {
    const unitPrice = Number(item.price) || Number(item.costPrice) || 0
    const stockQuantity = Number(item.stock) || 0
    return sum + (stockQuantity * unitPrice)
  }, 0)
  
  const categories = new Set(allInventory.map((item) => item.category || 'General')).size
  
  const stats = {
    totalProducts,
    lowStockItems,
    totalValue,
    categories
  }
  console.log('Stats API - Returning:', stats)
  
  return NextResponse.json(stats)
}