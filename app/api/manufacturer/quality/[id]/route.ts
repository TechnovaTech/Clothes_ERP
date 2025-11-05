import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/database'

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
    const db = await connectDB()
    const collection = db.collection(`tenant_${session.user.tenantId}_quality_checks`)
    
    // Use actual defect rate from form input
    const defectRate = parseFloat(body.actualDefectRate || '0')
    
    // Determine status based on defect rate
    let status = 'pending'
    if (defectRate <= parseInt(body.acceptableDefectRate || '5')) {
      status = 'passed'
    } else {
      status = 'failed'
    }
    
    const totalQuantity = parseInt(body.totalQuantity || '0')
    const passedItems = Math.round((totalQuantity * (100 - defectRate)) / 100)
    const failedItems = totalQuantity - passedItems
    
    const updateData = {
      ...body,
      defectRate,
      status,
      passedItems,
      failedItems,
      updatedAt: new Date()
    }
    
    const result = await collection.updateOne(
      { id: params.id, tenantId: session.user.tenantId },
      { $set: updateData }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Quality check not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Quality check updated successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update quality check' }, { status: 500 })
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

    const db = await connectDB()
    const collection = db.collection(`tenant_${session.user.tenantId}_quality_checks`)
    
    const result = await collection.deleteOne({
      id: params.id,
      tenantId: session.user.tenantId
    })
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Quality check not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Quality check deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete quality check' }, { status: 500 })
  }
}