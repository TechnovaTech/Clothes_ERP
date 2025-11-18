'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Eye, CreditCard } from 'lucide-react'

interface Tenant {
  _id: string
  name: string
  email: string
  phone?: string
  plan?: string
  status: string
  createdAt: string
}

export default function PaymentsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/tenants')
      const data = await response.json()
      setTenants(data.data || [])
    } catch (error) {
      console.error('Error fetching tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading tenants...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Management</h1>
          <p className="text-muted-foreground">View payment transactions for all tenants</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            All Tenants
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {filteredTenants.map((tenant) => (
              <div
                key={tenant._id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-semibold">{tenant.name}</h3>
                      <p className="text-sm text-muted-foreground">{tenant.email}</p>
                      {tenant.phone && (
                        <p className="text-sm text-muted-foreground">{tenant.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                    {tenant.status}
                  </Badge>
                  <Link href={`/super-admin/payments/${tenant._id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Payments
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            {filteredTenants.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No tenants found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}