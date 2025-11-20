import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTenantsCollection, connectDB } from '@/lib/database'
import { ObjectId } from 'mongodb'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeAll = searchParams.get('includeAll') === 'true'

    // Get tenant's business type
    const tenantsCollection = await getTenantsCollection()
    const tenant = await tenantsCollection.findOne({ _id: new ObjectId(session.user.tenantId) })
    
    if (!tenant?.businessType) {
      return NextResponse.json([])
    }

    // Get business type specific product fields
    const db = await connectDB()
    const businessType = await db.collection('business_types').findOne({ _id: new ObjectId(tenant.businessType) })
    
    if (!businessType?.fields) {
      return NextResponse.json([])
    }
    
    if (includeAll) {
      // Return all fields for inventory form
      return NextResponse.json(businessType.fields)
    } else {
      // Return all fields from business type
      return NextResponse.json(businessType.fields)
    }
  } catch (error) {
    console.error('Failed to fetch product fields:', error)
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
    
    // Get tenant's business type
    const tenantsCollection = await getTenantsCollection()
    const tenant = await tenantsCollection.findOne({ _id: new ObjectId(session.user.tenantId) })
    
    if (!tenant?.businessType) {
      return NextResponse.json({ error: 'No business type assigned' }, { status: 400 })
    }

    // Update business type product fields
    const db = await connectDB()
    const staticFields = [
      { name: 'Name', type: 'text', required: true, enabled: true },
      { name: 'Price', type: 'number', required: true, enabled: true },
      { name: 'Cost Price', type: 'number', required: true, enabled: true },
      { name: 'Stock', type: 'number', required: true, enabled: true },
      { name: 'Min Stock', type: 'number', required: true, enabled: true }
    ]
    
    // Filter out any static field names from dynamic fields to prevent duplicates
    const staticFieldNames = staticFields.map(f => f.name.toLowerCase().replace(/\s+/g, ''))
    const filteredDynamicFields = fields.filter(field => {
      const normalizedFieldName = field.name.toLowerCase().replace(/\s+/g, '')
      return !staticFieldNames.includes(normalizedFieldName)
    })
    
    const allFields = [...staticFields, ...filteredDynamicFields]
    
    await db.collection('business_types').updateOne(
      { _id: new ObjectId(tenant.businessType) },
      { 
        $set: { 
          fields: allFields,
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update product fields:', error)
    return NextResponse.json({ error: 'Failed to update fields' }, { status: 500 })
  }
}