import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const salesCollection = await getTenantCollection(session.user.tenantId, 'sales')
    
    const result = await salesCollection.deleteMany({})

    return NextResponse.json({ 
      message: 'All bills deleted successfully',
      count: result.deletedCount 
    })
  } catch (error) {
    console.error('Clear all error:', error)
    return NextResponse.json({ error: 'Failed to clear bills' }, { status: 500 })
  }
}
