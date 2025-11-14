import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'


function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let i = 0
  const len = text.length
  let row: string[] = []
  let field = ''
  let inQuotes = false
  while (i < len) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        } else {
          inQuotes = false
          i++
          continue
        }
      } else {
        field += ch
        i++
        continue
      }
    } else {
      if (ch === '"') {
        inQuotes = true
        i++
        continue
      }
      if (ch === ',') {
        row.push(field)
        field = ''
        i++
        continue
      }
      if (ch === '\n') {
        row.push(field)
        rows.push(row)
        row = []
        field = ''
        i++
        continue
      }
      if (ch === '\r') {
        i++
        continue
      }
      field += ch
      i++
      continue
    }
  }
  row.push(field)
  rows.push(row)
  return rows
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const form = await request.formData()
    const file = form.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const rows = parseCSV(text).filter(r => r.length > 1)
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Empty CSV' }, { status: 400 })
    }

    const header = rows[0].map(h => h.trim().toLowerCase())
    const dataRows = rows.slice(1)

    const idxName = header.indexOf('employee name')
    const idxType = header.indexOf('leave type')
    const idxStart = header.indexOf('start date')
    const idxEnd = header.indexOf('end date')
    const idxDays = header.indexOf('days')
    const idxReason = header.indexOf('reason')
    const idxStatus = header.indexOf('status')

    const employeesCollection = await getTenantCollection(session.user.tenantId, 'employees')
    const leavesCollection = await getTenantCollection(session.user.tenantId, 'leaves')

    const docs: any[] = []
    for (const r of dataRows) {
      const employeeName = (r[idxName] ?? '').trim()
      const leaveType = (r[idxType] ?? '').trim()
      const startDate = (r[idxStart] ?? '').trim()
      const endDate = (r[idxEnd] ?? '').trim()
      const reason = (r[idxReason] ?? '').trim()
      const status = ((r[idxStatus] ?? '') || 'Pending').trim()
      const d = (r[idxDays] ?? '').trim()
      const start = new Date(startDate)
      const end = new Date(endDate)
      const daysCalc = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const days = d ? parseInt(d) || daysCalc : daysCalc
      let employeeId = ''
      if (employeeName) {
        const emp = await employeesCollection.findOne({ name: employeeName })
        if (emp?._id) employeeId = emp._id.toString()
      }
      if (!employeeName || !leaveType || !startDate || !endDate) continue
      docs.push({
        employeeId,
        employeeName,
        leaveType,
        startDate,
        endDate,
        days,
        reason,
        status,
        tenantId: session.user.tenantId,
        createdAt: new Date()
      })
    }

    if (docs.length === 0) {
      return NextResponse.json({ imported: 0 })
    }

    const result = await leavesCollection.insertMany(docs)
    return NextResponse.json({ imported: result.insertedCount })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to import leaves' }, { status: 500 })
  }
}
