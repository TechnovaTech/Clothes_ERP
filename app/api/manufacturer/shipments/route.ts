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
    const collection = db.collection(`tenant_${session.user.tenantId}_shipments`)
    
    const shipments = await collection.find({}).sort({ createdAt: -1 }).toArray()
    
    return NextResponse.json({ shipments })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch shipments' }, { status: 500 })
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
    const collection = db.collection(`tenant_${session.user.tenantId}_shipments`)
    
    const shipmentNumber = `SHP-${Date.now()}`
    const shipment = {
      shipmentNumber,
      orderNumber: body.orderNumber,
      customerName: body.customerName,
      customerAddress: body.customerAddress,
      fromAddress: body.fromAddress,
      toAddress: body.toAddress,
      forWhom: body.forWhom,
      items: body.items || 0,
      weight: body.weight || 0,
      carrier: body.carrier,
      trackingNumber: body.trackingNumber || '',
      shippingMethod: body.shippingMethod || 'standard',
      status: body.status || 'preparing',
      priority: body.priority || 'medium',
      shipDate: body.shipDate,
      estimatedDelivery: body.estimatedDelivery || '',
      actualDelivery: body.actualDelivery || '',
      notes: body.notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      tenantId: session.user.tenantId
    }
    
    await collection.insertOne(shipment)
    
    return NextResponse.json({ shipment })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create shipment' }, { status: 500 })
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
    const collection = db.collection(`tenant_${session.user.tenantId}_shipments`)
    
    const result = await collection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { ...updateData, updatedAt: new Date() } }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update shipment' }, { status: 500 })
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
      return NextResponse.json({ error: 'Shipment ID required' }, { status: 400 })
    }
    
    const db = await connectDB()
    const collection = db.collection(`tenant_${session.user.tenantId}_shipments`)
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete shipment' }, { status: 500 })
  }
}