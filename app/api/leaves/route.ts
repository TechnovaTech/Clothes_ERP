import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
    const employeeId = searchParams.get('employeeId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const leavesCollection = await getTenantCollection(session.user.tenantId, 'leaves')
    
    let query: any = { tenantId: session.user.tenantId }
    
    if (employeeId) query.employeeId = employeeId
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0)
      query.startDate = { $gte: startDate.toISOString().split('T')[0] }
      query.endDate = { $lte: endDate.toISOString().split('T')[0] }
    }
    
    const total = await leavesCollection.countDocuments(query)
    const leaves = await leavesCollection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()
    
    return NextResponse.json({
      data: leaves,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch leaves' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const leavesCollection = await getTenantCollection(session.user.tenantId, 'leaves')

    const employeeId = (body.employeeId ?? '').toString()
    const employeeName = (body.employeeName ?? '').toString()
    const leaveType = (body.leaveType ?? '').toString()
    const startDate = (body.startDate ?? '').toString()
    const endDate = (body.endDate ?? '').toString()
    const reason = (body.reason ?? '').toString()

    if (!employeeId || !employeeName || !leaveType || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const daysCalc = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const days = Number.isFinite(Number(body.days)) ? Number(body.days) : daysCalc

    const doc = {
      employeeId,
      employeeName,
      leaveType,
      startDate,
      endDate,
      days,
      reason,
      status: (body.status ?? 'Pending').toString(),
      tenantId: session.user.tenantId,
      createdAt: new Date()
    }

    const result = await leavesCollection.insertOne(doc)
    return NextResponse.json({ insertedId: result.insertedId.toString() })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create leave' }, { status: 500 })
  }
}