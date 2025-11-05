"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Building2, Phone, Mail, Plus } from "lucide-react"

interface Distributor {
  id?: string
  name: string
  location: string
  orders: number
  status: string
  createdAt: string
}

export default function DistributorsPage() {
  const { data: session } = useSession()
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDistributors()
  }, [])

  const fetchDistributors = async () => {
    try {
      const response = await fetch('/api/factory/distributors')
      if (response.ok) {
        const data = await response.json()
        setDistributors(data.distributors || [])
      } else {
        setDistributors([])
      }
    } catch (error) {
      console.error('Failed to fetch distributors:', error)
      setDistributors([])
    } finally {
      setLoading(false)
    }
  }

  const totalDistributors = distributors.length
  const activePartners = distributors.filter(d => d.status === 'Active').length
  const monthlyOrders = distributors.reduce((sum, d) => sum + (d.orders || 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Distributor Network</h1>
          <p className="text-muted-foreground">Manage distribution partners</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Distributor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Distributors</p>
                <p className="text-2xl font-bold">{totalDistributors}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Partners</p>
                <p className="text-2xl font-bold">{activePartners}</p>
              </div>
              <Building2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Orders</p>
                <p className="text-2xl font-bold">{monthlyOrders}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Distributor List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading distributors...</div>
            ) : distributors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="mx-auto h-12 w-12 mb-4" />
                <p>No distributors found</p>
                <p className="text-sm">Add your first distribution partner</p>
              </div>
            ) : (
              distributors.map((distributor, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Building2 className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="font-medium">{distributor.name}</p>
                      <p className="text-sm text-muted-foreground">{distributor.location} • {distributor.orders} orders</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant={distributor.status === 'Active' ? 'default' : 'secondary'}>
                      {distributor.status}
                    </Badge>
                    <Button variant="outline" size="sm">Contact</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}