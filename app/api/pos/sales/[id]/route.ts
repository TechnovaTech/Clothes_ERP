import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const salesCollection = await getTenantCollection(session.user.tenantId, 'sales')
    
    const result = await salesCollection.deleteOne({ _id: new ObjectId(params.id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Sale deleted successfully' })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const salesCollection = await getTenantCollection(session.user.tenantId, 'sales')
    const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')
    const body = await request.json()

    const existingSale = await salesCollection.findOne({ _id: new ObjectId(params.id) })
    if (!existingSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    const allowedFields: Record<string, any> = {}
    const whitelist = [
      'customerName',
      'customerPhone',
      'paymentMethod',
      'cashier',
      'terms',
      'storeName',
      'address',
      'phone',
      'email',
      'gst',
      'billNo',
      'series',
      'number',
      'subtotal',
      'discount',
      'discountAmount',
      'tax',
      'cess',
      'total',
      'includeTax',
      'includeCess',
      'taxBreakup',
      'taxRate',
      'cessRate'
    ]

    for (const key of whitelist) {
      if (key in body) {
        allowedFields[key] = body[key]
      }
    }

    const newItems = Array.isArray(body.items) ? body.items : existingSale.items || []

    const prevMap: Record<string, number> = {}
    const nextMap: Record<string, number> = {}

    if (Array.isArray(existingSale.items)) {
      for (const it of existingSale.items) {
        if (!it?.id) continue
        const key = String(it.id)
        const qty = parseInt(it.quantity) || 0
        prevMap[key] = (prevMap[key] || 0) + qty
      }
    }

    for (const it of newItems) {
      if (!it?.id) continue
      const key = String(it.id)
      const qty = parseInt(it.quantity) || 0
      nextMap[key] = (nextMap[key] || 0) + qty
    }

    for (const key of Object.keys(prevMap)) {
      if (!(key in nextMap)) {
        const qtyToAddBack = prevMap[key]
        try {
          await inventoryCollection.updateOne(
            { _id: new ObjectId(key) },
            { $inc: { stock: qtyToAddBack, Stock: qtyToAddBack }, $set: { updatedAt: new Date() } }
          )
        } catch {}
      }
    }

    for (const key of Object.keys(nextMap)) {
      const prevQty = prevMap[key] || 0
      const nextQty = nextMap[key] || 0
      const delta = nextQty - prevQty
      if (delta === 0) continue
      try {
        await inventoryCollection.updateOne(
          { _id: new ObjectId(key) },
          { $inc: { stock: -delta, Stock: -delta }, $set: { updatedAt: new Date() } }
        )
      } catch {}
    }

    allowedFields.items = newItems
    // Recompute tax breakup if items changed or not provided
    if (Array.isArray(newItems)) {
      const taxBreakup = newItems.reduce((acc: any, it: any) => {
        const qty = Number(it.quantity || 0)
        const price = Number(it.price || 0)
        const line = qty * price
        const rate = Number(it.gstRate || allowedFields.taxRate || existingSale.taxRate || 0)
        const taxType = it.taxType || 'intra'
        const gstAmount = it.gstAmount != null ? Number(it.gstAmount) : (line * rate / 100)
        if (taxType === 'inter') {
          acc.igst += it.igst != null ? Number(it.igst) : gstAmount
        } else {
          const half = gstAmount / 2
          acc.cgst += it.cgst != null ? Number(it.cgst) : half
          acc.sgst += it.sgst != null ? Number(it.sgst) : half
        }
        acc.cess += it.cess != null ? Number(it.cess) : 0
        acc.gstAmount += gstAmount
        acc.gstRate = rate
        return acc
      }, { cgst: 0, sgst: 0, igst: 0, cess: 0, gstAmount: 0, gstRate: allowedFields.taxRate || existingSale.taxRate || 0 })
      allowedFields.taxBreakup = taxBreakup
      if (allowedFields.includeTax !== false) allowedFields.tax = taxBreakup.gstAmount
      if (allowedFields.includeCess !== false) allowedFields.cess = taxBreakup.cess
    }
    allowedFields.updatedAt = new Date()

    const result = await salesCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: allowedFields }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Sale updated successfully' })
  } catch (error) {
    console.error('Update sale error:', error)
    return NextResponse.json({ error: 'Failed to update sale' }, { status: 500 })
  }
}
