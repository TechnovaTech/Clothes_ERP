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
    const { items, customerName, customerPhone, subtotal, discount, discountAmount, tax, cess, total, paymentMethod, taxRate, cessRate, storeName, staffMember, includeTax, includeCess } = body
    
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
    const billNo = `${storeSettings.billPrefix || 'BILL'}-${currentCounter.toString().padStart(3, '0')}`
    
    // Increment counter for next bill
    await settingsCollection.updateOne(
      {},
      { $inc: { billCounter: 1 } },
      { upsert: true }
    )

    // Create sale record with all data
    const sale = {
      billNo,
      items: items || [],
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || null,
      subtotal: parseFloat(subtotal) || 0,
      discount: parseFloat(discount) || 0,
      discountAmount: parseFloat(discountAmount) || 0,
      tax: parseFloat(tax) || 0,
      cess: parseFloat(cess) || 0,
      total: parseFloat(total) || 0,
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
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Update inventory stock
    console.log('=== STOCK UPDATE START ===')
    console.log('Items to update:', items?.map((i: any) => ({ id: i.id, name: i.name, qty: i.quantity })))
    
    if (!items || items.length === 0) {
      console.log('⚠️ No items to update')
    } else {
      for (const item of items) {
        try {
          if (!item.id) {
            console.error(`❌ Missing ID for: ${item.name}`)
            continue
          }
          
          if (!ObjectId.isValid(item.id)) {
            console.error(`❌ Invalid ID format: ${item.id}`)
            continue
          }
          
          const productId = new ObjectId(item.id)
          const quantitySold = parseInt(item.quantity) || 0
          
          console.log(`\n📦 Updating: ${item.name}`)
          console.log(`   ID: ${item.id}`)
          console.log(`   Quantity: ${quantitySold}`)
          
          const updateResult = await inventoryCollection.updateOne(
            { _id: productId },
            { 
              $inc: { stock: -quantitySold },
              $set: { updatedAt: new Date() }
            }
          )
          
          console.log(`   Result: matched=${updateResult.matchedCount}, modified=${updateResult.modifiedCount}`)
          
          if (updateResult.matchedCount === 0) {
            console.error(`   ❌ Product not found in inventory`)
          } else if (updateResult.modifiedCount === 0) {
            console.warn(`   ⚠️ No changes made (stock field might not exist)`)
          } else {
            console.log(`   ✅ Stock updated successfully`)
          }
          
        } catch (err) {
          console.error(`❌ Error updating ${item.name}:`, err instanceof Error ? err.message : 'Unknown error')
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