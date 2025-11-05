import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/database'
import { ObjectId } from 'mongodb'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    const collection = db.collection(`tenant_${session.user.tenantId}_manufacturer_orders`)
    
    const orders = await collection.find({}).sort({ createdAt: -1 }).toArray()
    
    return NextResponse.json({ orders })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
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
    const collection = db.collection(`tenant_${session.user.tenantId}_manufacturer_orders`)
    
    const orderNumber = `MFG-${Date.now()}`
    const order = {
      orderNumber,
      buyerCompany: body.buyerCompany,
      buyerContact: body.buyerContact,
      buyerEmail: body.buyerEmail,
      buyerAddress: body.buyerAddress,
      orderType: body.orderType || 'bulk',
      products: body.products || [],
      totalQuantity: body.totalQuantity || 0,
      totalAmount: body.totalAmount || 0,
      currency: body.currency || 'INR',
      deliveryDate: body.deliveryDate,
      paymentTerms: body.paymentTerms || 'net30',
      status: body.status || 'pending',
      priority: body.priority || 'medium',
      productionStatus: 'not_started',
      qualityStatus: 'pending',
      shippingMethod: body.shippingMethod,
      notes: body.notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      tenantId: session.user.tenantId
    }
    
    await collection.insertOne(order)
    
    return NextResponse.json({ order })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { _id, ...updateData } = body
    
    const db = await connectDB()
    const collection = db.collection(`tenant_${session.user.tenantId}_manufacturer_orders`)
    
    const result = await collection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { ...updateData, updatedAt: new Date() } }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }
    
    const db = await connectDB()
    const collection = db.collection(`tenant_${session.user.tenantId}_manufacturer_orders`)
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }
}