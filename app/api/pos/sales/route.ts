import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items, customerName, customerPhone, subtotal, discount, discountAmount, tax, cess, total, paymentMethod, taxRate, billGstRate, gstRateOverride, cessRate, storeName, staffMember, includeTax, includeCess, customerState, taxMode: bodyTaxMode, storeState: bodyStoreState } = body
    
    console.log('=== SALE REQUEST START ===')
    console.log('Tenant ID:', session.user.tenantId)
    console.log('Items to process:', items?.length)
    console.log('Items data:', JSON.stringify(items, null, 2))

    const salesCollection = await getTenantCollection(session.user.tenantId, 'sales')
    const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')
    const settingsCollection = await getTenantCollection(session.user.tenantId, 'settings')
    
    // Get store settings
    const storeSettings: any = await settingsCollection.findOne({}) || { storeName: 'Store', taxRate: 10, cessRate: 0 }
    
    // Generate sequential bill number
    const currentCounter = storeSettings.billCounter || 1
    const series = storeSettings.billPrefix || 'BILL'
    const number = currentCounter.toString().padStart(3, '0')
    const billNo = `${series}-${number}`
    
    // Increment counter for next bill
    await settingsCollection.updateOne(
      {},
      { $inc: { billCounter: 1 } },
      { upsert: true }
    )

    // Compute tax breakup from items
    const itemsArr = Array.isArray(items) ? items : []
    const storeState = storeSettings.state || bodyStoreState
    const taxMode = bodyTaxMode || ((customerState && storeState && customerState !== storeState) ? 'inter' : 'intra')
    const taxBreakup = itemsArr.reduce((acc: any, it: any) => {
      const qty = Number(it.quantity || 0)
      const price = Number(it.price || 0)
      const line = qty * price
      const normalizeRate = (r: any) => {
        return r === undefined || r === null || r === '' ? undefined : Number(r)
      }
      const overrideRate = normalizeRate(billGstRate)
      const fallbackTaxRate = normalizeRate(taxRate) ?? normalizeRate(storeSettings.taxRate) ?? 0
      const effectiveRate = gstRateOverride
        ? (overrideRate ?? fallbackTaxRate)
        : (normalizeRate(it.gstRate) ?? overrideRate ?? fallbackTaxRate)
      const rate = Number(effectiveRate ?? 0)
      const taxType = it.taxType || taxMode || 'intra'
      const gstAmount = it.gstAmount != null ? Number(it.gstAmount) : (line * rate / 100)
      it.gstAmount = gstAmount
      it.gstRate = rate
      it.taxType = taxType
      if (taxType === 'inter') {
        const igstVal = it.igst != null ? Number(it.igst) : gstAmount
        acc.igst += igstVal
        it.igst = igstVal
        it.cgst = 0
        it.sgst = 0
      } else {
        const half = gstAmount / 2
        const cgstVal = it.cgst != null ? Number(it.cgst) : half
        const sgstVal = it.sgst != null ? Number(it.sgst) : half
        acc.cgst += cgstVal
        acc.sgst += sgstVal
        it.cgst = cgstVal
        it.sgst = sgstVal
        it.igst = 0
      }
      acc.cess += it.cess != null ? Number(it.cess) : 0
      acc.gstAmount += gstAmount
      acc.gstRate = rate
      return acc
    }, { cgst: 0, sgst: 0, igst: 0, cess: 0, gstAmount: 0, gstRate: taxRate || storeSettings.taxRate || 0 })

    // Compute subtotal/discount totals if not provided, supporting item-level discountRate/discountAmount
    let computedSubtotal = 0
    let computedDiscount = 0
    for (const it of itemsArr) {
      const qty = Number(it.quantity || 0)
      const price = Number(it.price || 0)
      const line = qty * price
      const dRate = Number(it.discountRate || 0)
      const dAmountExplicit = it.discountAmount != null ? Number(it.discountAmount) : undefined
      const dAmountFromRate = dRate ? (line * dRate / 100) : 0
      const dAmount = dAmountExplicit != null ? dAmountExplicit : dAmountFromRate
      computedSubtotal += (line - dAmount)
      computedDiscount += dAmount
      it.discountAmount = dAmount
    }

    // Create sale record with all data
    const sale = {
      billNo,
      series,
      number,
      items: itemsArr,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || null,
      subtotal: subtotal != null ? parseFloat(subtotal) : computedSubtotal,
      discount: parseFloat(discount) || 0,
      discountAmount: discountAmount != null ? parseFloat(discountAmount) : computedDiscount,
      tax: parseFloat(tax) || taxBreakup.gstAmount || 0,
      cess: parseFloat(cess) || taxBreakup.cess || 0,
      total: total != null ? parseFloat(total) : ((subtotal != null ? parseFloat(subtotal) : computedSubtotal) + (tax != null ? parseFloat(tax) : taxBreakup.gstAmount || 0) + (cess != null ? parseFloat(cess) : taxBreakup.cess || 0)),
      paymentMethod: paymentMethod || 'cash',
      storeName: storeName || storeSettings.storeName || 'Store',
      address: storeSettings.address || '',
      phone: storeSettings.phone || '',
      email: storeSettings.email || '',
      gst: storeSettings.gst || '',
      taxRate: taxRate || storeSettings.taxRate || 10,
      cessRate: cessRate || storeSettings.cessRate || 0,
      terms: storeSettings.terms || '',
      billPrefix: storeSettings.billPrefix || 'BILL',
      tenantId: session.user.tenantId,
      cashier: session.user.name || 'Admin',
      staffMember: staffMember || 'admin',
      includeTax: includeTax !== undefined ? includeTax : true,
      includeCess: includeCess !== undefined ? includeCess : true,
      taxBreakup,
      taxMode,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Validate stock availability before processing sale
    console.log('=== STOCK VALIDATION START ===')
    const stockValidationErrors = []
    
    if (items && items.length > 0) {
      for (const item of items) {
        if (!item.id) {
          stockValidationErrors.push(`Missing product ID for: ${item.name}`)
          continue
        }
        
        let productId
        try {
          productId = new ObjectId(item.id)
        } catch (e) {
          stockValidationErrors.push(`Invalid product ID: ${item.id}`)
          continue
        }
        
        const product = await inventoryCollection.findOne({ _id: productId })
        if (!product) {
          stockValidationErrors.push(`Product not found: ${item.name}`)
          continue
        }
        
        const currentStock = product.stock || 0
        const requestedQty = parseInt(item.quantity) || 0
        
        if (currentStock <= 0) {
          stockValidationErrors.push(`Out of stock: ${item.name}`)
        } else if (requestedQty > currentStock) {
          stockValidationErrors.push(`Insufficient stock for ${item.name}. Available: ${currentStock}, Requested: ${requestedQty}`)
        }
      }
    }
    
    if (stockValidationErrors.length > 0) {
      console.log('❌ Stock validation failed:', stockValidationErrors)
      return NextResponse.json({ 
        error: 'Stock validation failed', 
        details: stockValidationErrors 
      }, { status: 400 })
    }
    console.log('✅ Stock validation passed')
    
    // Update inventory stock
    console.log('=== STOCK UPDATE START ===')
    console.log('Tenant:', session.user.tenantId)
    console.log('Items:', JSON.stringify(items?.map((i: any) => ({ id: i.id, name: i.name, qty: i.quantity }))))
    
    if (!items || items.length === 0) {
      console.log('⚠️ No items to update')
    } else {
      for (const item of items) {
        try {
          if (!item.id) {
            console.error(`❌ Missing ID for: ${item.name}`)
            continue
          }
          
          const quantitySold = parseInt(item.quantity) || 0
          console.log(`\n📦 Processing: ${item.name}, ID: ${item.id}, Qty: ${quantitySold}`)
          
          let productId
          try {
            productId = new ObjectId(item.id)
          } catch (e) {
            console.error(`❌ Invalid ObjectId: ${item.id}`)
            continue
          }
          
          // First, check if product exists
          const existingProduct = await inventoryCollection.findOne({ _id: productId })
          if (!existingProduct) {
            console.error(`❌ Product not found in inventory`)
            continue
          }
          
          console.log(`✓ Found product, current stock: ${existingProduct.stock}`)
          
          // Update stock - try multiple field names
          const updateResult = await inventoryCollection.updateOne(
            { _id: productId },
            { 
              $inc: { 
                stock: -quantitySold,
                Stock: -quantitySold
              },
              $set: { updatedAt: new Date() }
            }
          )
          
          console.log(`✓ Update: matched=${updateResult.matchedCount}, modified=${updateResult.modifiedCount}`)
          
          // Verify the update
          const verifiedProduct = await inventoryCollection.findOne({ _id: productId })
          console.log(`✓ New stock: ${verifiedProduct?.stock}, Expected: ${existingProduct.stock - quantitySold}`)
          
          if (updateResult.modifiedCount > 0) {
            console.log(`✅ SUCCESS: Stock reduced from ${existingProduct.stock} to ${verifiedProduct?.stock}`)
          } else {
            console.error(`❌ FAILED: Stock not updated`)
          }
          
        } catch (err) {
          console.error(`❌ Error: ${item.name}:`, err instanceof Error ? err.message : String(err))
        }
      }
    }
    console.log('=== STOCK UPDATE END ===\n')

    const result = await salesCollection.insertOne(sale)
    
    // Update customer total spent and order count
    if (customerName && customerName.trim()) {
      const customersCollection = await getTenantCollection(session.user.tenantId, 'customers')
      
      // Check if customer exists, if not create with orderCount: 1
      const existingCustomer = await customersCollection.findOne({
        $or: [
          { phone: customerPhone },
          { name: customerName }
        ]
      })
      
      if (existingCustomer) {
        await customersCollection.updateOne(
          { _id: existingCustomer._id },
          { 
            $inc: { 
              totalSpent: parseFloat(total) || 0,
              orderCount: 1
            },
            $set: { 
              lastOrderDate: new Date(),
              updatedAt: new Date() 
            }
          }
        )
      } else {
        // Create new customer with orderCount starting at 1
        await customersCollection.insertOne({
          name: customerName,
          phone: customerPhone || null,
          orderCount: 1,
          totalSpent: parseFloat(total) || 0,
          lastOrderDate: new Date(),
          tenantId: session.user.tenantId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    }
    
    console.log('=== SALE COMPLETED ===')
    console.log('Sale ID:', result.insertedId.toString())
    
    return NextResponse.json({ 
      ...sale, 
      id: result.insertedId.toString() 
    }, { status: 201 })
  } catch (error) {
    console.error('POS sales error:', error)
    return NextResponse.json({ error: 'Failed to process sale' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    const search = searchParams.get('search')
    
    const salesCollection = await getTenantCollection(session.user.tenantId, 'sales')
    
    let query = {}
    if (search) {
      query = {
        $or: [
          { billNo: { $regex: search, $options: 'i' } },
          { customerName: { $regex: search, $options: 'i' } },
          { customerPhone: { $regex: search, $options: 'i' } }
        ]
      }
    }
    
    const total = await salesCollection.countDocuments(query)
    const sales = await salesCollection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()
    
    const formattedSales = sales.map(sale => ({
      ...sale,
      id: sale._id.toString()
    }))
    
    return NextResponse.json({
      data: formattedSales,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Fetch sales error:', error)
    return NextResponse.json({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } })
  }
}
