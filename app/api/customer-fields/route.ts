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
    
    let dynamicFields = []
    
    if (tenant?.businessType) {
      // Get business type specific fields
      const db = await connectDB()
      const businessType = await db.collection('business_types').findOne({ _id: new ObjectId(tenant.businessType) })
      
      if (businessType?.customerFields) {
        // Filter out old static fields and only return enabled dynamic fields
        const staticFieldNames = ['name', 'phone', 'email', 'address']
        dynamicFields = businessType.customerFields.filter((field: any) => 
          field.enabled && !staticFieldNames.includes(field.name)
        )
      }
    }
    
    return NextResponse.json(dynamicFields)
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