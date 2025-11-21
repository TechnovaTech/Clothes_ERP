import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customersCollection = await getTenantCollection(session.user.tenantId, 'customers')
    const customerFieldsCollection = await getTenantCollection(session.user.tenantId, 'customer_fields')
    
    // Get all customers for statistics calculation
    const allCustomers = await customersCollection.find({}).toArray()
    const customerFields = await customerFieldsCollection.find({}).toArray()
    
    // Calculate statistics
    const totalCustomers = allCustomers.length
    const activeFields = customerFields.length
    const requiredFields = customerFields.filter(f => f.required).length
    
    return NextResponse.json({
      totalCustomers,
      activeFields,
      requiredFields
    })
  } catch (error) {
    console.error('Customer stats fetch error:', error)
    return NextResponse.json({
      totalCustomers: 0,
      activeFields: 0,
      requiredFields: 0
    })
  }
}