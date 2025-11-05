import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db('fashion_erp')
    
    const factory = await db.collection(`tenant_${session.user.tenantId}_factories`)
      .findOne({ _id: new ObjectId(params.id) })
    
    if (!factory) {
      return NextResponse.json({ error: 'Factory not found' }, { status: 404 })
    }
    
    return NextResponse.json(factory)
  } catch (error) {
    console.error('GET factory error:', error)
    return NextResponse.json({ error: 'Failed to fetch factory' }, { status: 500 })
  }
}