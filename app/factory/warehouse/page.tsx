"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Package, AlertTriangle, TrendingUp } from "lucide-react"

export default function WarehousePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Warehouse Management</h1>
        <p className="text-muted-foreground">Manage storage and inventory</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Storage Used</p>
                <p className="text-2xl font-bold">75%</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">2,450</p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold">15</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Turnover Rate</p>
                <p className="text-2xl font-bold">85%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Storage Zones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { zone: "Zone A", type: "Raw Materials", capacity: "80%", items: 450 },
              { zone: "Zone B", type: "Finished Goods", capacity: "65%", items: 320 },
              { zone: "Zone C", type: "Packaging", capacity: "90%", items: 180 }
            ].map((zone, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{zone.zone}</p>
                  <p className="text-sm text-muted-foreground">{zone.type}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm">{zone.items} items</span>
                  <Badge variant={parseInt(zone.capacity) > 85 ? 'destructive' : 'default'}>
                    {zone.capacity} Full
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}