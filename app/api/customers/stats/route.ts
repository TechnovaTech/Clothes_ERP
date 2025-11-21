import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  console.log('Customer Stats API - Session:', JSON.stringify(session?.user))
  
  if (!session?.user?.tenantId) {
    console.log('Customer Stats API - No tenant ID')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const customersCollection = await getTenantCollection(session.user.tenantId, 'customers')
  const customerFieldsCollection = await getTenantCollection(session.user.tenantId, 'customer_fields')
  console.log('Customer Stats API - Collection:', customersCollection.collectionName)
  
  const allCustomers = await customersCollection.find({}).toArray()
  const customerFields = await customerFieldsCollection.find({}).toArray()
  console.log('Customer Stats API - Found customers:', allCustomers.length)
  if (allCustomers.length > 0) {
    console.log('Customer Stats API - Sample:', JSON.stringify(allCustomers[0]))
  }
  
  const totalCustomers = allCustomers.length
  const activeFields = customerFields.length
  const requiredFields = customerFields.filter(f => f.required).length
  
  const stats = {
    totalCustomers,
    activeFields,
    requiredFields
  }
  console.log('Customer Stats API - Returning:', stats)
  
  return NextResponse.json(stats)
}