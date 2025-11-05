"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Plus, UserCheck, Clock } from "lucide-react"

interface Employee {
  id?: string
  name: string
  department: string
  status: string
  attendance: string
  createdAt: string
}

export default function HRPage() {
  const { data: session } = useSession()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/factory/hr')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.employees || [])
      } else {
        setEmployees([])
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error)
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }

  const totalStaff = employees.length
  const presentToday = employees.filter(emp => emp.attendance === 'present').length
  const onLeave = employees.filter(emp => emp.attendance === 'leave').length
  const attendanceRate = totalStaff > 0 ? Math.round((presentToday / totalStaff) * 100) : 0

  const deptCounts = employees.reduce((acc, emp) => {
    acc[emp.department] = (acc[emp.department] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const departments = Object.entries(deptCounts).map(([dept, count]) => ({
    dept,
    count,
    percentage: totalStaff > 0 ? `${Math.round((count / totalStaff) * 100)}%` : '0%'
  }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">HR & Staff Management</h1>
          <p className="text-muted-foreground">Manage factory workforce</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading HR data...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Staff</p>
                    <p className="text-2xl font-bold">{totalStaff}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Present Today</p>
                    <p className="text-2xl font-bold text-green-600">{presentToday}</p>
                  </div>
                  <UserCheck className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">On Leave</p>
                    <p className="text-2xl font-bold text-orange-600">{onLeave}</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                    <p className="text-2xl font-bold">{attendanceRate}%</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Department Wise Staff</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departments.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <Users className="mx-auto h-8 w-8 mb-2" />
                      <p>No departments found</p>
                    </div>
                  ) : (
                    departments.map((dept, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span>{dept.dept}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold">{dept.count}</span>
                          <Badge variant="secondary">{dept.percentage}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employees.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <Clock className="mx-auto h-8 w-8 mb-2" />
                      <p>No recent activities</p>
                    </div>
                  ) : (
                    employees.slice(0, 3).map((employee, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">Employee: {employee.name}</span>
                        <span className="text-xs text-muted-foreground">{employee.department}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}