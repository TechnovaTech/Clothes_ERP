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
    console.log('CSV content:', text.substring(0, 200))
    const lines = text.split('\n').filter(line => line.trim())
    console.log('Total lines:', lines.length)
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV must have header and at least one data row' }, { status: 400 })
    }

    const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, ''))
    console.log('Headers:', headers)
    const employeesCollection = await getTenantCollection(session.user.tenantId, 'employees')
    
    let imported = 0
    let skipped = 0
    let errors = []
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]).map(v => v.replace(/"/g, ''))
        console.log(`Row ${i} values:`, values)
        
        if (values.length === 0 || values.every(v => !v.trim())) {
          console.log(`Skipping empty row ${i}`)
          continue
        }
        
        // Expect: Employee ID, Employee Name, Commission Type, Commission Rate
        const [employeeId, employeeName, commissionType, commissionRate] = values
        
        if (!employeeId || !commissionType) {
          console.log(`Missing required fields in row ${i}:`, { employeeId, commissionType })
          skipped++
          errors.push(`Row ${i}: Missing Employee ID or Commission Type`)
          continue
        }
        
        console.log(`Updating employee ${employeeId} with commission ${commissionType}, rate ${commissionRate}`)
        
        const result = await employeesCollection.updateOne(
          { employeeId: employeeId.trim() },
          { 
            $set: { 
              commissionType: commissionType.trim(),
              commissionRate: parseFloat(commissionRate) || 0,
              updatedAt: new Date()
            } 
          }
        )
        
        console.log(`Update result for ${employeeId}:`, { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount })
        
        if (result.matchedCount > 0) {
          imported++
        } else {
          skipped++
          errors.push(`Row ${i}: Employee ID '${employeeId}' not found`)
        }
      } catch (rowError) {
        console.error(`Error processing row ${i}:`, rowError)
        errors.push(`Row ${i}: ${rowError.message}`)
        skipped++
      }
    }

    console.log('Import summary:', { imported, skipped, errors })
    return NextResponse.json({ imported, skipped, errors: errors.slice(0, 5) })
  } catch (error) {
    console.error('Import error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Import failed: ' + errorMessage }, { status: 500 })
  }
}