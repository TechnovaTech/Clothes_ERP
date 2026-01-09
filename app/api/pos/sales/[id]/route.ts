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
    const { customerName, customerPhone, paymentMethod, items, discount, tax, total, billNo, series, number, subtotal, discountAmount, cashier, storeName, address, phone, email, gst, terms } = body

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
          billNo: billNo || originalSale.billNo,
          series: series !== undefined ? series : originalSale.series,
          number: number !== undefined ? number : originalSale.number,
          customerName: customerName || 'Walk-in Customer',
          customerPhone: customerPhone || null,
          paymentMethod: paymentMethod || 'Cash',
          items: items || [],
          subtotal: Number(subtotal) || originalSale.subtotal || 0,
          discount: Number(discount) || 0,
          discountAmount: Number(discountAmount) || 0,
          tax: Number(tax) || 0,
          total: newTotal,
          cashier: cashier || originalSale.cashier,
          storeName: storeName || originalSale.storeName,
          address: address || originalSale.address,
          phone: phone || originalSale.phone,
          email: email || originalSale.email,
          gst: gst || originalSale.gst,
          terms: terms || originalSale.terms,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const saleId = params.id
    const salesCollection = await getTenantCollection(session.user.tenantId, 'sales')

    const result = await salesCollection.deleteOne({ _id: new ObjectId(saleId) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Bill deleted successfully' })
  } catch (error) {
    console.error('Failed to delete bill:', error)
    return NextResponse.json({ error: 'Failed to delete bill' }, { status: 500 })
  }
}