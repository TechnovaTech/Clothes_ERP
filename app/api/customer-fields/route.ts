import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTenantsCollection, connectDB } from '@/lib/database'
import { ObjectId } from 'mongodb'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tenant's business type
    const tenantsCollection = await getTenantsCollection()
    const tenant = await tenantsCollection.findOne({ _id: new ObjectId(session.user.tenantId) })
    
    // Default customer fields with single phone field that accepts multiple numbers
    const defaultFields = [
      { name: 'name', label: 'Name', type: 'text', required: true, enabled: true },
      { name: 'phone', label: 'Phone Numbers', type: 'phone', required: false, enabled: true },
      { name: 'email', label: 'Email', type: 'email', required: false, enabled: true },
      { name: 'address', label: 'Address', type: 'textarea', required: false, enabled: true }
    ]
    
    let dynamicFields = []
    
    if (tenant?.businessType) {
      // Get business type specific fields
      const db = await connectDB()
      const businessType = await db.collection('business_types').findOne({ _id: new ObjectId(tenant.businessType) })
      
      if (businessType?.customerFields) {
        // Only return enabled dynamic fields (exclude default fields)
        const defaultFieldNames = ['name', 'phone', 'email', 'address']
        dynamicFields = businessType.customerFields.filter((field: any) => 
          field.enabled && !defaultFieldNames.includes(field.name)
        )
      }
    }
    
    // Combine default fields with dynamic fields
    const allFields = [...defaultFields, ...dynamicFields]
    
    return NextResponse.json(allFields)
  } catch (error) {
    console.error('Failed to fetch customer fields:', error)
    return NextResponse.json({ error: 'Failed to fetch fields' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fields } = await request.json()
    const db = await connectDB()
    
    await db.collection('customer_fields').updateOne(
      { tenantId: session.user.tenantId },
      { $set: { fields, updatedAt: new Date() } },
      { upsert: true }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update customer fields:', error)
    return NextResponse.json({ error: 'Failed to update fields' }, { status: 500 })
  }
}