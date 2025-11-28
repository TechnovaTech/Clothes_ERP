import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const saleId = params.id
    const body = await request.json()
    const { customerName, customerPhone, paymentMethod, items, discount, tax, total } = body

    const salesCollection = await getTenantCollection(session.user.tenantId, 'sales')
    const customersCollection = await getTenantCollection(session.user.tenantId, 'customers')

    // Get the original sale to calculate difference
    const originalSale = await salesCollection.findOne({ _id: new ObjectId(saleId) })
    if (!originalSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    const originalTotal = Number(originalSale.total) || 0
    const newTotal = Number(total) || 0
    const totalDifference = newTotal - originalTotal

    // Update the sale
    const updateResult = await salesCollection.updateOne(
      { _id: new ObjectId(saleId) },
      {
        $set: {
          customerName: customerName || 'Walk-in Customer',
          customerPhone: customerPhone || null,
          paymentMethod: paymentMethod || 'Cash',
          items: items || [],
          discount: Number(discount) || 0,
          tax: Number(tax) || 0,
          total: newTotal,
          updatedAt: new Date()
        }
      }
    )

    // Update customer total spent if customer exists and total changed
    if (totalDifference !== 0 && (customerName || originalSale.customerName)) {
      const searchName = customerName || originalSale.customerName
      const searchPhone = customerPhone || originalSale.customerPhone
      
      const customer = await customersCollection.findOne({
        $or: [
          { name: searchName },
          { phone: searchPhone }
        ]
      })
      
      if (customer) {
        await customersCollection.updateOne(
          { _id: customer._id },
          {
            $inc: { totalSpent: totalDifference },
            $set: { updatedAt: new Date() }
          }
        )
      }
    }

    return NextResponse.json({ success: true, message: 'Sale updated successfully' })
  } catch (error) {
    console.error('Failed to update sale:', error)
    return NextResponse.json({ error: 'Failed to update sale' }, { status: 500 })
  }
}