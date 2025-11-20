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

    // Get business type specific customer fields
    const db = await connectDB()
    const businessType = await db.collection('business_types').findOne({ _id: new ObjectId(tenant.businessType) })
    
    if (!businessType?.customerFields) {
      return NextResponse.json([])
    }
    
    // Return all customer fields from business type
    return NextResponse.json(businessType.customerFields)
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
    
    // Get tenant's business type
    const tenantsCollection = await getTenantsCollection()
    const tenant = await tenantsCollection.findOne({ _id: new ObjectId(session.user.tenantId) })
    
    if (!tenant?.businessType) {
      return NextResponse.json({ error: 'No business type assigned' }, { status: 400 })
    }

    // Update business type customer fields - only use provided fields
    const db = await connectDB()
    
    await db.collection('business_types').updateOne(
      { _id: new ObjectId(tenant.businessType) },
      { 
        $set: { 
          customerFields: fields,
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update customer fields:', error)
    return NextResponse.json({ error: 'Failed to update fields' }, { status: 500 })
  }
}