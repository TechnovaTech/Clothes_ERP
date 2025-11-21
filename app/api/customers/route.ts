import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      // Return empty array for unauthenticated users
      return NextResponse.json({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const customersCollection = await getTenantCollection(session.user.tenantId, 'customers')
    const total = await customersCollection.countDocuments({})
    console.log(`Fetching customers: Total=${total}, Page=${page}, Limit=${limit}`)
    const customers = await customersCollection.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()
    console.log(`Found ${customers.length} customers`)
    
    const formattedCustomers = customers.map(customer => ({
      ...customer,
      id: customer._id.toString()
    }))
    
    return NextResponse.json({
      data: formattedCustomers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Customers fetch error:', error)
    // Return empty array on error
    return NextResponse.json({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Creating customer with data:', body)
    const customersCollection = await getTenantCollection(session.user.tenantId, 'customers')
    
    // Check if customer already exists by phone or name
    const queries: any[] = []
    
    if (body.name && body.name.trim()) {
      queries.push({ name: body.name.trim() })
    }
    
    // Extract individual phone numbers from comma-separated string
    if (body.phone && body.phone.trim()) {
      const phoneNumbers = body.phone.split(',').map(p => p.trim()).filter(Boolean)
      phoneNumbers.forEach(phone => {
        queries.push({ phone: { $regex: phone, $options: 'i' } })
      })
    }
    
    const existingCustomer = queries.length > 0 ? await customersCollection.findOne({ $or: queries }) : null
    console.log('Existing customer check:', existingCustomer ? 'Found' : 'Not found')
    
    if (existingCustomer) {
      return NextResponse.json({
        ...existingCustomer,
        id: existingCustomer._id.toString()
      })
    }
    
    // Create new customer with dynamic fields
    const customer = {
      ...body, // Include all dynamic fields
      orderCount: body.orderCount || 0,
      totalSpent: 0,
      lastOrderDate: body.orderCount > 0 ? new Date() : null,
      tenantId: session.user.tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await customersCollection.insertOne(customer)
    console.log('Customer created with ID:', result.insertedId.toString())
    
    return NextResponse.json({ 
      ...customer, 
      id: result.insertedId.toString() 
    }, { status: 201 })
  } catch (error) {
    console.error('Customer creation error:', error)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}