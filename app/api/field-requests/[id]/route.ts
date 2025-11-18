import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (session?.user?.role !== 'super-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const db = await connectDB()
    
    let query
    try {
      query = { _id: new ObjectId(params.id) }
    } catch {
      query = { _id: params.id }
    }
    
    // Get the field request details
    const fieldRequest = await db.collection('field_requests').findOne(query)
    
    if (!fieldRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }
    
    // Update request status
    await db.collection('field_requests').updateOne(
      query,
      { 
        $set: { 
          status: body.status,
          updatedAt: new Date()
        }
      }
    )
    
    // If approved, add field to all business types as template
    if (body.status === 'approved' && fieldRequest.field) {
      const newField = {
        name: fieldRequest.field.name,
        label: fieldRequest.field.label,
        type: fieldRequest.field.type,
        required: false,
        enabled: true
      }
      
      // Add to all business types based on field type
      const fieldKey = fieldRequest.fieldType === 'customer' ? 'customerFields' : 'fields'
      
      await db.collection('business_types').updateMany(
        {},
        { 
          $push: { [fieldKey]: newField },
          $set: { updatedAt: new Date() }
        }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
  }
}