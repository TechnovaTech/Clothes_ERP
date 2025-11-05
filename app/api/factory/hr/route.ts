import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    const collection = db.collection(`tenant_${session.user.tenantId}_employees`)
    
    const employees = await collection.find({}).sort({ createdAt: -1 }).toArray()
    
    return NextResponse.json({ employees })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
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
    const collection = db.collection(`tenant_${session.user.tenantId}_employees`)
    
    const employee = {
      ...body,
      id: `EMP-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      tenantId: session.user.tenantId
    }
    
    await collection.insertOne(employee)
    
    return NextResponse.json({ employee })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}