"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, XCircle, Clock } from "lucide-react"
import { showToast } from "@/lib/toast"

interface FieldRequest {
  id: string
  tenantName: string
  fieldType: 'customer' | 'product'
  field: {
    name: string
    label: string
    type: string
    reason: string
  }
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export default function FieldRequestsPage() {
  const [requests, setRequests] = useState<FieldRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/field-requests')
      if (response.ok) {
        const data = await response.json()
        setRequests(data)
      }
    } catch (error) {
      console.error('Failed to fetch field requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateRequestStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/field-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (response.ok) {
        fetchRequests()
        if (status === 'approved') {
          showToast.success('Request approved! Field added to all business type templates.')
        } else {
          showToast.success('Request rejected successfully!')
        }
      }
    } catch (error) {
      showToast.error('Failed to update request')
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Field Requests</h1>
        <p className="text-muted-foreground">Manage tenant field requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Field Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Field Name</TableHead>
                <TableHead>Field Label</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.tenantName}</TableCell>
                  <TableCell>{request.field?.name || 'N/A'}</TableCell>
                  <TableCell>{request.field?.label || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={request.fieldType === 'customer' ? 'default' : 'secondary'}>
                      {request.fieldType}
                    </Badge>
                  </TableCell>
                  <TableCell>{request.field?.type || 'N/A'}</TableCell>
                  <TableCell>{request.field?.reason || 'No reason provided'}</TableCell>
                  <TableCell>
                    <Badge variant={
                      request.status === 'approved' ? 'default' :
                      request.status === 'rejected' ? 'destructive' : 'secondary'
                    }>
                      {request.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => updateRequestStatus(request.id, 'approved')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateRequestStatus(request.id, 'rejected')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}