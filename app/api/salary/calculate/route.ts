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
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    const employeesCollection = await getTenantCollection(session.user.tenantId, 'employees')
    const leavesCollection = await getTenantCollection(session.user.tenantId, 'leaves')
    
    const employees = await employeesCollection.find({}).toArray()
    
    const salaryData = await Promise.all(employees.map(async (employee) => {
      const empId = employee.employeeId || employee._id.toString()
      
      console.log('\n=== Employee:', employee.name, 'ID:', empId)
      
      // Try multiple queries to find leaves
      const allLeaves = await leavesCollection.find({}).toArray()
      console.log('Total leaves in DB:', allLeaves.length)
      if (allLeaves.length > 0) {
        console.log('Sample leave structure:', JSON.stringify(allLeaves[0], null, 2))
      }
      
      // Try different field name variations
      const approvedLeaves = await leavesCollection.find({
        $or: [
          { employeeId: empId, status: 'approved' },
          { employeeId: empId, status: 'Approved' },
          { employeeId: employee.employeeId, status: 'approved' },
          { employeeId: employee._id.toString(), status: 'approved' }
        ]
      }).toArray()
      
      console.log('Approved leaves found:', approvedLeaves.length)
      
      let leaveDays = 0
      const monthStart = new Date(year, month - 1, 1)
      const monthEnd = new Date(year, month, 0)
      
      console.log('Month range:', monthStart.toISOString(), 'to', monthEnd.toISOString())
      
      approvedLeaves.forEach(leave => {
        console.log('Processing leave:', leave)
        const leaveStart = new Date(leave.startDate || leave.fromDate)
        const leaveEnd = new Date(leave.endDate || leave.toDate)
        
        console.log('Leave dates:', leaveStart.toISOString(), 'to', leaveEnd.toISOString())
        
        if (leaveStart <= monthEnd && leaveEnd >= monthStart) {
          const overlapStart = leaveStart > monthStart ? leaveStart : monthStart
          const overlapEnd = leaveEnd < monthEnd ? leaveEnd : monthEnd
          const days = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
          leaveDays += days
          console.log('Leave days added:', days, 'Total now:', leaveDays)
        }
      })
      
      const workingDays = 30 - leaveDays
      const baseSalary = parseFloat(employee.salary) || 0
      const effectiveSalary = Math.round((baseSalary / 30) * workingDays)
      
      console.log('Final:', { leaveDays, workingDays, effectiveSalary })
      
      return {
        employeeId: empId,
        employeeName: employee.name || 'Unknown',
        baseSalary,
        workingDays,
        leaveDays,
        effectiveSalary
      }
    }))
    
    return NextResponse.json(salaryData)
  } catch (error) {
    console.error('Salary calculation error:', error)
    return NextResponse.json({ error: 'Failed to calculate salary' }, { status: 500 })
  }
}
