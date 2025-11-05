"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RotateCcw, AlertTriangle, CheckCircle, Clock, Plus, Package } from "lucide-react"

interface ReturnItem {
  id?: string
  product: string
  reason: string
  quantity: number
  status: string
  type: 'return' | 'defect'
  createdAt: string
}

export default function ReturnsPage() {
  const { data: session } = useSession()
  const [returns, setReturns] = useState<ReturnItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('returns')

  useEffect(() => {
    fetchReturns()
  }, [])

  const fetchReturns = async () => {
    try {
      const response = await fetch('/api/factory/returns')
      if (response.ok) {
        const data = await response.json()
        setReturns(data.returns || [])
      } else {
        setReturns([])
      }
    } catch (error) {
      console.error('Failed to fetch returns:', error)
      setReturns([])
    } finally {
      setLoading(false)
    }
  }

  const totalReturns = returns.length
  const returnProducts = returns.filter(r => r.type === 'return')
  const defectProducts = returns.filter(r => r.type === 'defect')
  const resolved = returns.filter(r => r.status === 'Resolved').length
  const pending = returns.filter(r => r.status === 'Pending').length

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Returns & Defects</h1>
          <p className="text-muted-foreground">Manage product returns and quality issues</p>
        </div>
        <div />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{totalReturns}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Return Products</p>
                <p className="text-2xl font-bold">{returnProducts.length}</p>
              </div>
              <RotateCcw className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pending}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold">{resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="returns" className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Return Products ({returnProducts.length})
          </TabsTrigger>
          <TabsTrigger value="defects" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Defect Products ({defectProducts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="returns" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Return Products
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Return
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">Loading returns...</div>
                ) : returnProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <RotateCcw className="mx-auto h-12 w-12 mb-4" />
                    <p>No return products</p>
                    <p className="text-sm">Add your first return</p>
                  </div>
                ) : (
                  returnProducts.map((returnItem, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{returnItem.id}</p>
                        <p className="text-sm text-muted-foreground">{returnItem.product} - {returnItem.reason} ({returnItem.quantity} units)</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant={
                          returnItem.status === 'Resolved' ? 'default' : 
                          returnItem.status === 'Pending' ? 'destructive' : 'secondary'
                        }>
                          {returnItem.status}
                        </Badge>
                        <Button variant="outline" size="sm">Process</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="defects" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Defect Products
                </div>
                <Button variant="outline">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Add Defect
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">Loading defects...</div>
                ) : defectProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
                    <p>No defect products</p>
                    <p className="text-sm">Add your first defect</p>
                  </div>
                ) : (
                  defectProducts.map((defectItem, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{defectItem.id}</p>
                        <p className="text-sm text-muted-foreground">{defectItem.product} - {defectItem.reason} ({defectItem.quantity} units)</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant={
                          defectItem.status === 'Resolved' ? 'default' : 
                          defectItem.status === 'Pending' ? 'destructive' : 'secondary'
                        }>
                          {defectItem.status}
                        </Badge>
                        <Button variant="outline" size="sm">Process</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}