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
    const collection = db.collection(`tenant_${session.user.tenantId}_settings`)
    
    const settings = await collection.findOne({ type: 'factory' })
    
    return NextResponse.json({ settings })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
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
    const collection = db.collection(`tenant_${session.user.tenantId}_settings`)
    
    const settings = {
      ...body,
      type: 'factory',
      updatedAt: new Date(),
      tenantId: session.user.tenantId
    }
    
    await collection.updateOne(
      { type: 'factory' },
      { $set: settings },
      { upsert: true }
    )
    
    return NextResponse.json({ settings })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}