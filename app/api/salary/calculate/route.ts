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
    const month = parseInt(searchParams.get('month') || new Date().getMonth() + 1)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear())

    const employeesCollection = await getTenantCollection(session.user.tenantId, 'employees')
    const leavesCollection = await getTenantCollection(session.user.tenantId, 'leaves')
    
    const employees = await employeesCollection.find({}).toArray()
    
    const salaryData = await Promise.all(employees.map(async (employee) => {
      const empId = employee.employeeId || employee._id.toString()
      
      // Get all approved leaves for this employee
      const approvedLeaves = await leavesCollection.find({
        employeeId: empId,
        status: 'approved'
      }).toArray()
      
      // Calculate leave days for the selected month
      let leaveDays = 0
      const monthStart = new Date(year, month - 1, 1)
      const monthEnd = new Date(year, month, 0)
      
      approvedLeaves.forEach(leave => {
        const leaveStart = new Date(leave.startDate || leave.fromDate)
        const leaveEnd = new Date(leave.endDate || leave.toDate)
        
        // Check if leave falls in this month
        if (leaveStart <= monthEnd && leaveEnd >= monthStart) {
          // Calculate overlap days
          const overlapStart = leaveStart > monthStart ? leaveStart : monthStart
          const overlapEnd = leaveEnd < monthEnd ? leaveEnd : monthEnd
          const days = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
          leaveDays += days
        }
      })
      
      const workingDays = 30 - leaveDays
      const baseSalary = parseFloat(employee.salary) || 0
      const effectiveSalary = Math.round((baseSalary / 30) * workingDays)
      
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
