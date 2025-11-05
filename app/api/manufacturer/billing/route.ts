import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('fashion_erp')
    const bills = await db.collection('bills').find({}).sort({ billDate: -1 }).toArray()
    
    return NextResponse.json({ bills })
  } catch (error) {
    console.error('Error fetching bills:', error)
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('fashion_erp')
    const data = await request.json()
    
    const bill = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await db.collection('bills').insertOne(bill)
    
    return NextResponse.json({ message: 'Bill created successfully', bill })
  } catch (error) {
    console.error('Error creating bill:', error)
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 })
  }
}