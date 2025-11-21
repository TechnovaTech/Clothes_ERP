import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

function parseCSVLine(line: string): string[] {
  const result = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV must have header and at least one data row' }, { status: 400 })
    }

    const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, ''))
    const customersCollection = await getTenantCollection(session.user.tenantId, 'customers')
    
    let imported = 0
    let skipped = 0
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]).map(v => v.replace(/"/g, ''))
        
        if (values.length === 0 || values.every(v => !v.trim())) continue
        
        const customer: any = {
          tenantId: session.user.tenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
          orderCount: 0,
          totalSpent: 0,
          lastOrderDate: null
        }
        
        headers.forEach((header, index) => {
          if (values[index] !== undefined) {
            customer[header] = values[index] || ''
          }
        })
        
        // Only check for duplicates if name or phone exists
        let existing = null
        if (customer.name || customer.phone) {
          const queries: any[] = []
          
          if (customer.name && customer.name.trim()) {
            queries.push({ name: customer.name.trim() })
          }
          
          // Extract individual phone numbers from comma-separated string
          if (customer.phone && customer.phone.trim()) {
            const phoneNumbers = customer.phone.split(',').map((p: string) => p.trim()).filter(Boolean)
            phoneNumbers.forEach((phone: string) => {
              queries.push({ phone: { $regex: phone, $options: 'i' } })
            })
          }
          
          if (queries.length > 0) {
            existing = await customersCollection.findOne({ $or: queries })
          }
        }
        
        if (!existing) {
          await customersCollection.insertOne(customer)
          imported++
        } else {
          skipped++
        }
      } catch (rowError) {
        console.error(`Error processing row ${i}:`, rowError)
        skipped++
      }
    }
    
    return NextResponse.json({ count: imported, skipped })
  } catch (error) {
    console.error('Customer import error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Import failed: ' + errorMessage }, { status: 500 })
  }
}