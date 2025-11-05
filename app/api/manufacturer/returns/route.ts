import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('fashion_erp')
    const returns = await db.collection('returns').find({}).toArray()
    
    return NextResponse.json({ returns })
  } catch (error) {
    console.error('Error fetching returns:', error)
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('fashion_erp')
    const data = await request.json()
    
    const returnItem = {
      ...data,
      id: Date.now().toString(),
      quantity: parseInt(data.quantity),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await db.collection('returns').insertOne(returnItem)
    
    return NextResponse.json({ message: 'Return/Defect created successfully', return: returnItem })
  } catch (error) {
    console.error('Error creating return:', error)
    return NextResponse.json({ error: 'Failed to create return' }, { status: 500 })
  }
}