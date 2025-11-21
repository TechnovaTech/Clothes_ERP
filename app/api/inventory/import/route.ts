import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTenantPlanLimits } from '@/lib/plan-limits'
import { getTenantsCollection, connectDB } from '@/lib/database'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Get tenant field configuration
    const tenantsCollection = await getTenantsCollection()
    const tenant = await tenantsCollection.findOne({ _id: new ObjectId(session.user.tenantId) })
    
    let enabledFields: any[] = []
    if (tenant?.businessType) {
      const db = await connectDB()
      const businessType = await db.collection('business_types').findOne({ _id: new ObjectId(tenant.businessType) })
      enabledFields = businessType?.fields?.filter((f: any) => f.enabled) || []
    }

    const text = await file.text()
    const lines = text.split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    
    // Skip header validation to allow flexible CSV imports
    console.log('CSV Headers:', headers)
    console.log('Enabled Fields:', enabledFields.map(f => f.name))
    
    // Check current product count and limits
    const limits = await getTenantPlanLimits(session.user.tenantId)
    const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')
    const currentCount = await inventoryCollection.countDocuments({})
    
    const items = []
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
      
      const item: any = {
        tenantId: session.user.tenantId,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      // Map ALL CSV columns to item properties
      headers.forEach((header, index) => {
        const value = values[index] || ''
        const fieldKey = header.toLowerCase().replace(/\s+/g, '_')
        
        // Store with original header name
        item[header] = value
        // Store with field key version
        item[fieldKey] = value
        // Store with lowercase version
        item[header.toLowerCase()] = value
        
        // Handle numeric fields
        if (['price', 'costprice', 'cost_price', 'stock', 'minstock', 'min_stock'].includes(fieldKey)) {
          const numValue = parseFloat(value) || 0
          item[header] = numValue
          item[fieldKey] = numValue
          item[header.toLowerCase()] = numValue
        }
        // Handle array fields
        else if (['sizes', 'colors'].includes(fieldKey) && value) {
          const arrayValue = value.split(',').map(v => v.trim()).filter(v => v)
          item[header] = arrayValue
          item[fieldKey] = arrayValue
          item[header.toLowerCase()] = arrayValue
        }
      })
      
      // Set name field for consistency - try multiple variations
      const nameVariations = ['name', 'productname', 'product_name', 'Product Name', 'ProductName']
      let productName = ''
      for (const variation of nameVariations) {
        if (item[variation]) {
          productName = item[variation]
          break
        }
      }
      
      // Skip items without name
      if (!productName || !productName.toString().trim()) {
        console.log('Skipping item without name:', item)
        continue
      }
      
      // Set name field consistently
      item.name = productName.toString().trim()
      
      // Generate SKU if not provided
      if (!item.sku && !item.SKU) {
        item.sku = `SKU-${Date.now()}-${i}`
      } else {
        item.sku = item.sku || item.SKU || `SKU-${Date.now()}-${i}`
      }
      
      // Generate barcode if not provided
      if (!item.barcode && !item.Barcode) {
        item.barcode = `${Date.now()}${i.toString().padStart(4, '0')}`
      } else {
        item.barcode = item.barcode || item.Barcode || `${Date.now()}${i.toString().padStart(4, '0')}`
      }
      
      // Set default category if not provided
      if (!item.category && !item.Category) {
        item.category = 'General'
      } else {
        item.category = item.category || item.Category || 'General'
      }
      
      // Ensure numeric fields have proper values
      item.price = item.price || item.Price || 0
      item.costPrice = item.costPrice || item.costprice || item.cost_price || item['Cost Price'] || 0
      item.stock = item.stock || item.Stock || 0
      item.minStock = item.minStock || item.minstock || item.min_stock || item['Min Stock'] || 0
      
      console.log('Processing item:', { name: item.name, sku: item.sku, category: item.category })
      
      items.push(item)
    }
    
    if (items.length > 0) {
      // Check if importing would exceed limits
      if (limits && (currentCount + items.length) > limits.maxProducts) {
        return NextResponse.json({ 
          error: 'PRODUCT_LIMIT_EXCEEDED',
          message: `Cannot import ${items.length} products. Your ${limits.planName} plan allows ${limits.maxProducts} products. You currently have ${currentCount} products.`,
          limits: {
            ...limits,
            currentProducts: currentCount
          }
        }, { status: 403 })
      }
      
      await inventoryCollection.insertMany(items)
    }
    
    return NextResponse.json({ 
      message: `Successfully imported ${items.length} items`,
      count: items.length 
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Failed to import inventory' }, { status: 500 })
  }
}