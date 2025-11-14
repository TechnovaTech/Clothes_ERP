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

    const { employeeIds } = await request.json()
    
    const employeesCollection = await getTenantCollection(session.user.tenantId, 'employees')
    
    await employeesCollection.deleteMany(
      { employeeId: { $in: employeeIds } }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete salary records' }, { status: 500 })
  }
}
