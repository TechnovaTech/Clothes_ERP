import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customerId = params.id
    const salesCollection = await getTenantCollection(session.user.tenantId, 'sales')
    const customersCollection = await getTenantCollection(session.user.tenantId, 'customers')

    // First, get customer details to match by name and phone
    const customer = await customersCollection.findOne({ _id: new ObjectId(customerId) })
    
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Find sales by customer name or phone
    const query: any = {
      $or: []
    }

    if (customer.name) {
      query.$or.push({ customerName: customer.name })
    }

    if (customer.phone) {
      // Handle multiple phone numbers
      const phones = customer.phone.split(',').map((p: string) => p.trim())
      phones.forEach((phone: string) => {
        query.$or.push({ customerPhone: phone })
      })
    }

    // If no name or phone, return empty array
    if (query.$or.length === 0) {
      return NextResponse.json([])
    }

    // Fetch sales for this customer, sorted by date (newest first)
    const sales = await salesCollection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50) // Limit to last 50 purchases
      .toArray()

    // Format the response
    const formattedSales = sales.map(sale => ({
      id: sale._id.toString(),
      billNo: sale.billNo,
      total: sale.total,
      items: sale.items || [],
      paymentMethod: sale.paymentMethod,
      discount: sale.discountAmount || sale.discount || 0,
      tax: sale.tax || 0,
      createdAt: sale.createdAt,
      customerName: sale.customerName,
      customerPhone: sale.customerPhone
    }))

    return NextResponse.json(formattedSales)
  } catch (error) {
    console.error('Failed to fetch customer purchase history:', error)
    return NextResponse.json({ error: 'Failed to fetch purchase history' }, { status: 500 })
  }
}