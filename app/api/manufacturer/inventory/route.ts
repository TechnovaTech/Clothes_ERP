import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    const collection = db.collection(`tenant_${session.user.tenantId}_inventory`)
    
    const inventory = await collection.find({}).sort({ createdAt: -1 }).toArray()
    
    return NextResponse.json({ inventory })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const db = await connectDB()
    const collection = db.collection(`tenant_${session.user.tenantId}_inventory`)
    
    const inventoryItem = {
      ...body,
      id: `INV-${Date.now()}`,
      quantity: body.perfectQuantity || body.quantity || 0,
      perfectQuantity: body.perfectQuantity || 0,
      defectiveQuantity: body.defectiveQuantity || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      tenantId: session.user.tenantId
    }
    
    await collection.insertOne(inventoryItem)
    
    return NextResponse.json({ inventoryItem })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 })
  }
}