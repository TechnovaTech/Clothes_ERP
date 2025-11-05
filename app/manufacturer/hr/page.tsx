"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  DollarSign, 
  Calendar, 
  Clock,
  UserCheck,
  UserX,
  TrendingUp,
  Award,
  Building2
} from "lucide-react"

interface Employee {
  id: string
  name: string
  email: string
  phone: string
  position: string
  department: string
  salary: number
  joinDate: string
  status: "active" | "inactive"
  address: string
  emergencyContact: string
  skills: string[]
  performance: number
}

const mockEmployees: Employee[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john@company.com",
    phone: "+1234567890",
    position: "Production Manager",
    department: "Production",
    salary: 75000,
    joinDate: "2023-01-15",
    status: "active",
    address: "123 Main St, City",
    emergencyContact: "+1234567891",
    skills: ["Leadership", "Quality Control", "Process Optimization"],
    performance: 4.5
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah@company.com",
    phone: "+1234567892",
    position: "Quality Inspector",
    department: "Quality Control",
    salary: 45000,
    joinDate: "2023-03-20",
    status: "active",
    address: "456 Oak Ave, City",
    emergencyContact: "+1234567893",
    skills: ["Quality Assurance", "Testing", "Documentation"],
    performance: 4.2
  }
]

export default function ManufacturerHRPage() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  const departments = ["Production", "Quality Control", "Warehouse", "Administration", "Sales", "HR"]
  
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.position.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = selectedDepartment === "all" || emp.department === selectedDepartment
    return matchesSearch && matchesDepartment
  })

  const totalSalary = employees.reduce((sum, emp) => sum + emp.salary, 0)
  const activeEmployees = employees.filter(emp => emp.status === "active").length

  const EmployeeForm = ({ employee, onSave, onCancel }: {
    employee?: Employee
    onSave: (emp: Employee) => void
    onCancel: () => void
  }) => {
    const [formData, setFormData] = useState<Partial<Employee>>(employee || {
      name: "",
      email: "",
      phone: "",
      position: "",
      department: "",
      salary: 0,
      address: "",
      emergencyContact: "",
      status: "active"
    })

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      const newEmployee: Employee = {
        id: employee?.id || Date.now().toString(),
        name: formData.name || "",
        email: formData.email || "",
        phone: formData.phone || "",
        position: formData.position || "",
        department: formData.department || "",
        salary: formData.salary || 0,
        joinDate: employee?.joinDate || new Date().toISOString().split('T')[0],
        status: formData.status as "active" | "inactive" || "active",
        address: formData.address || "",
        emergencyContact: formData.emergencyContact || "",
        skills: employee?.skills || [],
        performance: employee?.performance || 0
      }
      onSave(newEmployee)
    }

    return (
      <div className="max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Personal Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="h-10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="employee@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="h-10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="h-10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency" className="text-sm font-medium">Emergency Contact</Label>
                <Input
                  id="emergency"
                  placeholder="Emergency contact number"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">Address</Label>
              <Textarea
                id="address"
                placeholder="Enter complete address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>

          {/* Job Information Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b">
              <Building2 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Job Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position" className="text-sm font-medium">Position/Title *</Label>
                <Input
                  id="position"
                  placeholder="e.g. Production Manager"
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  className="h-10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-medium">Department *</Label>
                <Select value={formData.department} onValueChange={(value) => setFormData({...formData, department: value})}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary" className="text-sm font-medium">Monthly Salary ($) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="salary"
                    type="number"
                    placeholder="50000"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: Number(e.target.value)})}
                    className="h-10 pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">Employment Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value as "active" | "inactive"})}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} className="px-6">
              Cancel
            </Button>
            <Button type="submit" className="px-6">
              <Users className="w-4 h-4 mr-2" />
              {employee ? 'Update Employee' : 'Add Employee'}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  const handleSaveEmployee = (employee: Employee) => {
    if (editingEmployee) {
      setEmployees(employees.map(emp => emp.id === employee.id ? employee : emp))
      setEditingEmployee(null)
    } else {
      setEmployees([...employees, employee])
      setIsAddDialogOpen(false)
    }
  }

  const handleDeleteEmployee = (id: string) => {
    setEmployees(employees.filter(emp => emp.id !== id))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">HR Management</h1>
          <p className="text-muted-foreground">Manage staff, salaries, and HR operations</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle className="text-xl font-semibold flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary" />
                Add New Employee
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Fill in the employee details to add them to your team
              </p>
            </DialogHeader>
            <div className="px-6 py-4">
              <EmployeeForm
                onSave={handleSaveEmployee}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Staff</p>
                <p className="text-2xl font-bold">{activeEmployees}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Payroll</p>
                <p className="text-2xl font-bold">${totalSalary.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold">{departments.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees">Employee Directory</TabsTrigger>
          <TabsTrigger value="payroll">Payroll Management</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Employee List */}
          <div className="grid gap-4">
            {filteredEmployees.map((employee) => (
              <Card key={employee.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{employee.name}</h3>
                        <p className="text-sm text-muted-foreground">{employee.position}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <Badge variant="outline">{employee.department}</Badge>
                          <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                            {employee.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">${employee.salary.toLocaleString()}/month</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingEmployee(employee)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEmployee(employee.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p>{employee.email}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p>{employee.phone}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Join Date:</span>
                      <p>{new Date(employee.joinDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Performance:</span>
                      <p>{employee.performance}/5.0 ⭐</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{employee.name}</h4>
                      <p className="text-sm text-muted-foreground">{employee.position}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${employee.salary.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Monthly Salary</p>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Monthly Payroll:</span>
                    <span className="text-xl font-bold">${totalSalary.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Attendance tracking features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{employee.name}</h4>
                      <p className="text-sm text-muted-foreground">{employee.position}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold">{employee.performance}/5.0</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Employee Dialog */}
      {editingEmployee && (
        <Dialog open={!!editingEmployee} onOpenChange={() => setEditingEmployee(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle className="text-xl font-semibold flex items-center">
                <Edit className="w-5 h-5 mr-2 text-primary" />
                Edit Employee - {editingEmployee.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Update employee information and job details
              </p>
            </DialogHeader>
            <div className="px-6 py-4">
              <EmployeeForm
                employee={editingEmployee}
                onSave={handleSaveEmployee}
                onCancel={() => setEditingEmployee(null)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}