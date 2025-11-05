"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Truck, Package, Clock, CheckCircle } from "lucide-react"

export default function ShipmentPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Shipment Management</h1>
        <p className="text-muted-foreground">Track outbound shipments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Shipments</p>
                <p className="text-2xl font-bold">28</p>
              </div>
              <Truck className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Transit</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <Package className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold">18</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">2</p>
              </div>
              <Clock className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { id: "SHP-001", destination: "Mumbai", items: "500 T-Shirts", status: "Delivered", date: "2024-01-15" },
              { id: "SHP-002", destination: "Delhi", items: "200 Jeans", status: "In Transit", date: "2024-01-14" },
              { id: "SHP-003", destination: "Bangalore", items: "300 Shirts", status: "Pending", date: "2024-01-13" }
            ].map((shipment, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{shipment.id}</p>
                  <p className="text-sm text-muted-foreground">{shipment.destination} - {shipment.items}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm">{shipment.date}</span>
                  <Badge variant={
                    shipment.status === 'Delivered' ? 'default' : 
                    shipment.status === 'In Transit' ? 'secondary' : 'destructive'
                  }>
                    {shipment.status}
                  </Badge>
                  <Button variant="outline" size="sm">Track</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}