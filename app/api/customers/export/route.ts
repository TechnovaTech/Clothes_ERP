import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customersCollection = await getTenantCollection(session.user.tenantId, 'customers')
    const customers = await customersCollection.find({}).toArray()
    
    if (customers.length === 0) {
      return NextResponse.json({ error: 'No customers to export' }, { status: 400 })
    }

    // Get all unique field names
    const allFields = new Set<string>()
    customers.forEach(customer => {
      Object.keys(customer).forEach(key => {
        if (!['_id', 'tenantId', 'createdAt', 'updatedAt'].includes(key)) {
          allFields.add(key)
        }
      })
    })
    
    const headers = Array.from(allFields)
    let csv = headers.join(',') + '\n'
    
    customers.forEach(customer => {
      const row = headers.map(header => {
        const value = customer[header] || ''
        return `"${String(value).replace(/"/g, '""')}"`
      }).join(',')
      csv += row + '\n'
    })
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="customers.csv"'
      }
    })
  } catch (error) {
    console.error('Customer export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}