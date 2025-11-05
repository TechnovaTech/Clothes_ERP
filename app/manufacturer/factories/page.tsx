"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, MapPin, Users, Phone } from "lucide-react"
import { AddFactoryForm } from "@/components/forms/add-factory-form"
import { getUserRole, hasPermission } from "@/lib/role-permissions"

export default function FactoriesPage() {
  const { data: session } = useSession()
  const [factories, setFactories] = useState([])
  const [loading, setLoading] = useState(true)
  
  const userRole = getUserRole(session)
  const canCreateFactory = hasPermission(userRole, 'canCreateFactory')
  const canViewAllFactories = hasPermission(userRole, 'canViewAllFactories')

  const fetchFactories = async () => {
    try {
      const response = await fetch('/api/manufacturer/factories')
      if (response.ok) {
        const data = await response.json()
        setFactories(data)
      }
    } catch (error) {
      console.error('Failed to fetch factories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddFactory = async (newFactory: any) => {
    try {
      const response = await fetch('/api/manufacturer/factories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFactory)
      })
      if (response.ok) {
        const factory = await response.json()
        setFactories([...factories, factory])
      } else {
        const error = await response.json()
        console.error('API Error:', error)
        alert('Failed to add factory: ' + error.error)
      }
    } catch (error) {
      console.error('Failed to add factory:', error)
      alert('Failed to add factory. Please try again.')
    }
  }

  useEffect(() => {
    fetchFactories()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Factory Management</h1>
          <p className="text-muted-foreground">
            {canViewAllFactories ? 'Manage all your manufacturing facilities' : 'Manage your assigned factory'}
          </p>
        </div>
        {canCreateFactory && <AddFactoryForm onAddFactory={handleAddFactory} />}
      </div>

      {loading ? (
        <div className="text-center py-8">Loading factories...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {factories.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No factories found. Add your first factory to get started.
            </div>
          ) : (
            factories.map((factory) => (
          <Card key={factory._id || factory.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-blue-500" />
                {factory.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start">
                <MapPin className="w-4 h-4 mr-2 mt-1 text-gray-500" />
                <span className="text-sm text-muted-foreground">{factory.address}</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">{factory.phone}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">{factory.employees} Employees</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-medium">Manager: {factory.manager}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  factory.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {factory.status}
                </span>
              </div>
              <Link href={`/manufacturer/factories/${factory._id || factory.id}`}>
                <Button variant="outline" className="w-full mt-4">
                  View Details
                </Button>
              </Link>
            </CardContent>
          </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}