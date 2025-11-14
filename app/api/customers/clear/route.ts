import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTenantCollection } from '@/lib/tenant-data'

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customersCollection = await getTenantCollection(session.user.tenantId, 'customers')
    
    await customersCollection.deleteMany({})
    
    return NextResponse.json({ message: 'All customers deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear customers' }, { status: 500 })
  }
}
