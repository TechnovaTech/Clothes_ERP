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
    const managers = await db.collection(`tenant_${session.user.tenantId}_factory_managers`).find({}).toArray()
    
    return NextResponse.json(managers)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch managers' }, { status: 500 })
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
    
    const manager = {
      ...body,
      tenantId: session.user.tenantId,
      role: 'factory-manager',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection(`tenant_${session.user.tenantId}_factory_managers`).insertOne(manager)
    
    return NextResponse.json({ ...manager, _id: result.insertedId })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create manager' }, { status: 500 })
  }
}