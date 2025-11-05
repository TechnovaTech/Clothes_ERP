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
    const factories = await db.collection(`tenant_${session.user.tenantId}_factories`).find({}).toArray()
    
    return NextResponse.json(factories)
  } catch (error) {
    console.error('GET factories error:', error)
    return NextResponse.json({ error: 'Failed to fetch factories' }, { status: 500 })
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
    
    const factory = {
      ...body,
      tenantId: session.user.tenantId,
      status: 'Active',
      employees: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection(`tenant_${session.user.tenantId}_factories`).insertOne(factory)
    
    return NextResponse.json({ ...factory, _id: result.insertedId })
  } catch (error) {
    console.error('POST factory error:', error)
    return NextResponse.json({ error: 'Failed to create factory' }, { status: 500 })
  }
}