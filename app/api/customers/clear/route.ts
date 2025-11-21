import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customersCollection = await getTenantCollection(session.user.tenantId, 'customers')
    const result = await customersCollection.deleteMany({})
    
    return NextResponse.json({ count: result.deletedCount })
  } catch (error) {
    console.error('Clear customers error:', error)
    return NextResponse.json({ error: 'Failed to clear customers' }, { status: 500 })
  }
}