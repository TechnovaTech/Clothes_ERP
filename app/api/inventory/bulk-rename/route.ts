import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')
    
    // Find all products with "Unnamed Product" name
    const unnamedProducts = await inventoryCollection.find({ 
      name: 'Unnamed Product' 
    }).toArray()
    
    let updatedCount = 0
    
    // Update each product with a better name based on SKU
    for (const product of unnamedProducts) {
      const newName = `Product ${product.sku || product._id.toString().slice(-6)}`
      
      await inventoryCollection.updateOne(
        { _id: product._id },
        { 
          $set: { 
            name: newName,
            updatedAt: new Date()
          }
        }
      )
      updatedCount++
    }
    
    return NextResponse.json({ 
      message: `Updated ${updatedCount} products`,
      count: updatedCount
    })
  } catch (error) {
    console.error('Bulk rename error:', error)
    return NextResponse.json({ error: 'Failed to rename products' }, { status: 500 })
  }
}