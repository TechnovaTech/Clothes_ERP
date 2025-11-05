import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db('fashion_erp')
    const expenses = await db.collection(`tenant_${session.user.tenantId}_expenses`).find({}).toArray()
    
    return NextResponse.json(expenses)
  } catch (error) {
    console.error('GET expenses error:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const client = await clientPromise
    const db = client.db('fashion_erp')
    
    const expense = {
      ...body,
      tenantId: session.user.tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection(`tenant_${session.user.tenantId}_expenses`).insertOne(expense)
    
    return NextResponse.json({ ...expense, _id: result.insertedId })
  } catch (error) {
    console.error('POST expense error:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}