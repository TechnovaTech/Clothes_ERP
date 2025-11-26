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

    const body = await request.json()
    console.log('=== UPDATE DEBUG START ===')
    console.log('Update request body:', JSON.stringify(body, null, 2))
    console.log('Tenant ID:', session.user.tenantId)
    console.log('Item ID to update:', params.id)
    
    const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')
    console.log('Got inventory collection')
    
    // Get tenant field configuration
    const tenantFieldsCollection = await getTenantCollection(session.user.tenantId, 'fields')
    const tenantConfig = await tenantFieldsCollection.findOne({})
    
    // Base update data
    const updateData: any = {
      updatedAt: new Date()
    }
    
    // Add dynamic fields based on tenant configuration
    if (tenantConfig?.fields) {
      tenantConfig.fields.forEach((field: any) => {
        if (field.enabled) {
          const fieldKey = field.name.toLowerCase().replace(/\s+/g, '_')
          const fieldName = field.name
          
          // Try multiple field name variations
          let fieldValue = body[fieldKey] || body[fieldName] || body[fieldName.toLowerCase()]
          
          if (fieldValue !== undefined) {
            // Handle array fields (sizes, colors)
            if (field.type === 'text' && (fieldName.toLowerCase().includes('size') || fieldName.toLowerCase().includes('color'))) {
              if (typeof fieldValue === 'string') {
                updateData[fieldKey] = fieldValue.split(',').map((s: string) => s.trim()).filter((s: string) => s)
              } else {
                updateData[fieldKey] = fieldValue
              }
            } else if (field.type === 'number') {
              updateData[fieldKey] = parseFloat(fieldValue) || 0
            } else if (field.type === 'date') {
              // Store date directly
              updateData[fieldKey] = fieldValue || ''
            } else {
              updateData[fieldKey] = fieldValue
            }
          }
        }
      })
    }
    
    // Always process name field even if empty to allow clearing
    if (body.name !== undefined) {
      updateData.name = body.name || 'Unnamed Product'
    }
    
    // Keep backward compatibility for existing fields
    const backwardCompatFields = ['sku', 'barcode', 'category', 'price', 'costPrice', 'stock', 'minStock', 'sizes', 'colors', 'brand', 'material', 'description']
    backwardCompatFields.forEach(fieldName => {
      if (body[fieldName] !== undefined) {
        if (fieldName === 'price' || fieldName === 'costPrice') {
          updateData[fieldName] = parseFloat(body[fieldName]) || 0
        } else if (fieldName === 'stock' || fieldName === 'minStock') {
          updateData[fieldName] = parseInt(body[fieldName]) || 0
        } else if (fieldName === 'sizes' || fieldName === 'colors') {
          if (typeof body[fieldName] === 'string') {
            updateData[fieldName] = body[fieldName].split(',').map((s: string) => s.trim()).filter((s: string) => s)
          } else {
            updateData[fieldName] = body[fieldName]
          }
        } else {
          updateData[fieldName] = body[fieldName]
        }
      }
    })
    
    // Also add ALL fields from body that aren't system fields
    Object.keys(body).forEach(key => {
      if (!['_id', 'id', 'tenantId', 'storeId', 'createdAt', 'updatedAt'].includes(key)) {
        if (updateData[key] === undefined) {
          // Handle date fields - preserve full date format
          if (key.toLowerCase().includes('date')) {
            console.log('Processing date field:', key, 'value:', body[key])
            updateData[key] = body[key] || ''
          }
          // Handle numeric fields properly
          else if (key.toLowerCase().includes('price') || key.toLowerCase().includes('cost')) {
            updateData[key] = parseFloat(body[key]) || 0
          } else if (key.toLowerCase().includes('stock') || key.toLowerCase().includes('min')) {
            updateData[key] = parseInt(body[key]) || 0
          } else {
            updateData[key] = body[key]
          }
        }
      }
    })
    
    // Ensure critical fields are always updated with proper field name variations and data types
    const criticalFields = {
      'costPrice': ['costPrice', 'cost_price', 'Cost Price', 'costprice'],
      'stock': ['stock', 'Stock'],
      'minStock': ['minStock', 'min_stock', 'Min Stock', 'minstock']
    }
    
    Object.entries(criticalFields).forEach(([standardKey, variations]) => {
      variations.forEach(variation => {
        if (body[variation] !== undefined) {
          let value
          if (standardKey.includes('Price')) {
            // Handle price fields as floats
            value = body[variation] === '' || body[variation] === null ? 0 : parseFloat(body[variation]) || 0
          } else {
            // Handle stock fields as integers
            value = body[variation] === '' || body[variation] === null ? 0 : parseInt(body[variation]) || 0
          }
          updateData[standardKey] = value
          updateData[variation] = value
        }
      })
    })
    
    // Force update critical fields even if not in body (to fix existing undefined values)
    if (updateData.costPrice === undefined) updateData.costPrice = 0
    if (updateData.stock === undefined) updateData.stock = 0
    if (updateData.minStock === undefined) updateData.minStock = 0
    
    console.log('Final update data:', JSON.stringify(updateData, null, 2))
    
    // Check if item exists first
    const existingItem = await inventoryCollection.findOne({ _id: new ObjectId(params.id) })
    console.log('Existing item found:', existingItem ? 'YES' : 'NO')
    if (existingItem) {
      console.log('Existing item data:', JSON.stringify(existingItem, null, 2))
    }

    const result = await inventoryCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    console.log('Update result:', { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount })
    
    // Verify the update
    const updatedItem = await inventoryCollection.findOne({ _id: new ObjectId(params.id) })
    console.log('Updated item after save:', JSON.stringify(updatedItem, null, 2))
    console.log('=== UPDATE DEBUG END ===')

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Item updated successfully', modifiedCount: result.modifiedCount })
  } catch (error) {
    console.error('=== UPDATE ERROR ===')
    console.error('Update error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('=== UPDATE ERROR END ===')
    return NextResponse.json({ error: 'Failed to update item', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
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

    const inventoryCollection = await getTenantCollection(session.user.tenantId, 'inventory')
    
    const result = await inventoryCollection.deleteOne({
      _id: new ObjectId(params.id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}