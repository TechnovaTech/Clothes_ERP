import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('fashion_erp')
    const distributors = await db.collection('distributors').find({}).toArray()
    
    return NextResponse.json({ distributors })
  } catch (error) {
    console.error('Error fetching distributors:', error)
    return NextResponse.json({ error: 'Failed to fetch distributors' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('fashion_erp')
    const data = await request.json()
    
    const distributor = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await db.collection('distributors').insertOne(distributor)
    
    return NextResponse.json({ message: 'Distributor created successfully', distributor })
  } catch (error) {
    console.error('Error creating distributor:', error)
    return NextResponse.json({ error: 'Failed to create distributor' }, { status: 500 })
  }
}