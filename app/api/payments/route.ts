import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ObjectId } from 'mongodb'

// POST - Add payment transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, amount, method, description, status = 'completed' } = body
    
    if (!tenantId || !amount || !method || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = await connectDB()
    
    const payment = {
      tenantId: new ObjectId(tenantId),
      amount: parseFloat(amount),
      method,
      description,
      status,
      transactionId: `TXN${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('payments').insertOne(payment)
    
    return NextResponse.json({
      id: result.insertedId.toString(),
      ...payment,
      tenantId: tenantId
    })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}