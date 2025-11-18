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
    
    if (!tenant?.businessType) {
      return NextResponse.json([])
    }

    // Get business type specific product fields
    const db = await connectDB()
    const businessType = await db.collection('business_types').findOne({ _id: new ObjectId(tenant.businessType) })
    
    if (!businessType?.fields) {
      return NextResponse.json([])
    }
    
    // Only return dynamic fields (excluding static ones) for field settings page
    const dynamicFields = businessType.fields.filter(field => 
      !['name', 'price', 'description', 'category'].includes(field.name)
    )
    
    return NextResponse.json(dynamicFields)
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
      { name: 'name', label: 'Product Name', type: 'text', required: true, enabled: true },
      { name: 'price', label: 'Price', type: 'number', required: true, enabled: true },
      { name: 'description', label: 'Description', type: 'textarea', required: false, enabled: true },
      { name: 'category', label: 'Category', type: 'text', required: false, enabled: true }
    ]
    
    const allFields = [...staticFields, ...fields]
    
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