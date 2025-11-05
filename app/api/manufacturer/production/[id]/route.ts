import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/database'
import { ObjectId } from 'mongodb'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const db = await connectDB()
    const collection = db.collection(`tenant_${session.user.tenantId}_production_orders`)
    
    const updateData: any = {
      updatedAt: new Date()
    }
    
    // Handle progress update
    if (body.progress !== undefined) {
      updateData.progress = body.progress
      
      // Update status based on progress value
      if (body.progress > 0 && body.progress < 100) {
        updateData.status = 'In Progress'
      } else if (body.progress === 100) {
        updateData.status = 'Completed'
      } else {
        updateData.status = 'Pending'
      }
    }
    
    // Handle other field updates
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.quantity !== undefined) updateData.quantity = body.quantity
    if (body.productionCost !== undefined) updateData.productionCost = body.productionCost
    if (body.factory !== undefined) updateData.factory = body.factory
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.startDate !== undefined) updateData.startDate = body.startDate
    if (body.endDate !== undefined) updateData.endDate = body.endDate
    
    await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update production order' }, { status: 500 })
  }
}