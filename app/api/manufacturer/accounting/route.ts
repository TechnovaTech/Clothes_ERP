import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('fashion_erp')
    const transactions = await db.collection('accounting').find({}).sort({ date: -1 }).toArray()
    
    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('fashion_erp')
    const data = await request.json()
    
    const transaction = {
      ...data,
      id: Date.now().toString(),
      amount: parseFloat(data.amount),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await db.collection('accounting').insertOne(transaction)
    
    return NextResponse.json({ message: 'Transaction created successfully', transaction })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}