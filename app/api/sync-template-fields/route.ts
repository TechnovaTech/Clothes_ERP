import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTenantCollection } from '@/lib/tenant-data'
import { connectDB } from '@/lib/database'
import { ObjectId } from 'mongodb'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    
    // Get all business types (since we're adding to all templates)
    const businessTypes = await db.collection('business_types').find({}).toArray()
    
    if (businessTypes.length === 0) {
      return NextResponse.json({ error: 'No business types found' }, { status: 404 })
    }

    // Get all unique fields from all business types
    const allCustomerFields = []
    const allProductFields = []
    
    businessTypes.forEach(businessType => {
      if (businessType.customerFields) {
        businessType.customerFields.forEach(field => {
          const exists = allCustomerFields.find(f => f.name === field.name)
          if (!exists) {
            allCustomerFields.push(field)
          }
        })
      }
      if (businessType.fields) {
        businessType.fields.forEach(field => {
          const exists = allProductFields.find(f => f.name === field.name)
          if (!exists) {
            allProductFields.push({
              ...field,
              label: field.label || field.name,
              enabled: true
            })
          }
        })
      }
    })

    // Update tenant's customer fields
    const customerFieldsCollection = await getTenantCollection(session.user.tenantId, 'customer_field_settings')
    const currentCustomerSettings = await customerFieldsCollection.findOne({})
    const existingCustomerFields = currentCustomerSettings?.fields || []
    
    const mergedCustomerFields = [...existingCustomerFields]
    let addedCustomerFields = 0
    
    allCustomerFields.forEach(templateField => {
      const exists = existingCustomerFields.find(field => field.name === templateField.name)
      if (!exists) {
        mergedCustomerFields.push(templateField)
        addedCustomerFields++
      }
    })

    await customerFieldsCollection.updateOne(
      {},
      { $set: { fields: mergedCustomerFields, updatedAt: new Date() } },
      { upsert: true }
    )

    // Update tenant's product fields
    const productFieldsCollection = await getTenantCollection(session.user.tenantId, 'product_field_settings')
    const currentProductSettings = await productFieldsCollection.findOne({})
    const existingProductFields = currentProductSettings?.fields || []
    
    const mergedProductFields = [...existingProductFields]
    let addedProductFields = 0
    
    allProductFields.forEach(templateField => {
      const exists = existingProductFields.find(field => field.name === templateField.name)
      if (!exists) {
        mergedProductFields.push(templateField)
        addedProductFields++
      }
    })

    await productFieldsCollection.updateOne(
      {},
      { $set: { fields: mergedProductFields, updatedAt: new Date() } },
      { upsert: true }
    )

    return NextResponse.json({ 
      success: true, 
      addedCustomerFields,
      addedProductFields
    })
  } catch (error) {
    console.error('Failed to sync template fields:', error)
    return NextResponse.json({ error: 'Failed to sync fields' }, { status: 500 })
  }
}