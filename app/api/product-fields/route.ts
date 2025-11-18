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

    // Static fields that always exist
    const staticFields = [
      { name: 'name', label: 'Product Name', type: 'text', required: true, enabled: true },
      { name: 'price', label: 'Price', type: 'number', required: true, enabled: true },
      { name: 'description', label: 'Description', type: 'textarea', required: false, enabled: true },
      { name: 'category', label: 'Category', type: 'text', required: false, enabled: true }
    ]

    // Get tenant's business type
    const tenantsCollection = await getTenantsCollection()
    const tenant = await tenantsCollection.findOne({ _id: new ObjectId(session.user.tenantId) })
    
    let dynamicFields = []
    
    if (tenant?.businessType) {
      // Get business type specific fields
      const db = await connectDB()
      const businessType = await db.collection('business_types').findOne({ _id: new ObjectId(tenant.businessType) })
      
      if (businessType?.fields) {
        dynamicFields = businessType.fields.filter(field => 
          !staticFields.some(staticField => staticField.name === field.name) && field.enabled
        )
      }
    }
    
    // Combine static fields with business type specific dynamic fields
    const allFields = [...staticFields, ...dynamicFields]
    
    return NextResponse.json(allFields)
  } catch (error) {
    console.error('Failed to fetch product fields:', error)
    return NextResponse.json({ error: 'Failed to fetch fields' }, { status: 500 })
  }
}