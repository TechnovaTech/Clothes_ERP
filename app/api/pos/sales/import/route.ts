import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTenantCollection } from '@/lib/tenant-data'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bills } = await request.json()
    const salesCollection = await getTenantCollection(session.user.tenantId, 'sales')

    const billsToInsert = bills.map((bill: any) => ({
      ...bill,
      tenantId: session.user.tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    const result = await salesCollection.insertMany(billsToInsert)

    return NextResponse.json({ 
      success: true, 
      count: result.insertedCount 
    })
  } catch (error) {
    console.error('Error importing bills:', error)
    return NextResponse.json({ error: 'Failed to import bills' }, { status: 500 })
  }
}
