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

    const employeesCollection = await getTenantCollection(session.user.tenantId, 'employees')
    
    await employeesCollection.updateMany(
      {},
      { $set: { commissionType: 'none', commissionRate: 0 } }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Clear error:', error)
    return NextResponse.json({ error: 'Failed to clear commission data' }, { status: 500 })
  }
}
