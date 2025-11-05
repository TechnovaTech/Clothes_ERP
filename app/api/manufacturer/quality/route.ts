import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    const collection = db.collection(`tenant_${session.user.tenantId}_quality_checks`)
    
    const qualityChecks = await collection.find({}).sort({ createdAt: -1 }).toArray()
    
    return NextResponse.json({ qualityChecks })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch quality checks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    
    const qualityCheck = {
      ...body,
      id: `QC-${Date.now()}`,
      defectRate,
      status,
      passedItems,
      failedItems,
      createdAt: new Date(),
      updatedAt: new Date(),
      tenantId: session.user.tenantId
    }
    
    await collection.insertOne(qualityCheck)
    
    // Automatically add defective items to returns if any
    if (failedItems > 0) {
      const returnsCollection = db.collection(`tenant_${session.user.tenantId}_returns`)
      
      const getDefectType = (checkpoints: any) => {
        if (!checkpoints?.stitchingQuality) return 'stitching'
        if (!checkpoints?.fabricQuality) return 'fabric'
        if (!checkpoints?.colorConsistency) return 'color'
        if (!checkpoints?.sizeAccuracy) return 'size'
        return 'other'
      }
      
      const defectRecord = {
        productName: body.productType,
        batchNumber: body.batchId,
        quantity: failedItems,
        type: 'defect',
        reason: body.notes || 'Quality control rejection - failed inspection',
        qcInspector: body.inspector,
        returnDate: body.checkDate,
        status: 'pending',
        defectType: getDefectType(body.checkpoints),
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await returnsCollection.insertOne(defectRecord)
    }
    
    return NextResponse.json({ qualityCheck })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create quality check' }, { status: 500 })
  }
}