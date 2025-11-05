"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Package, Plus, AlertTriangle, TrendingUp, QrCode, Search, Scan } from "lucide-react"

interface InventoryItem {
  id?: string
  productType: string
  batchId: string
  perfectQuantity: number
  qcId: string
  status: string
  source: string
  description: string
  createdAt: string
  barcode?: string
}

export default function InventoryPage() {
  const { data: session } = useSession()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [scannerActive, setScannerActive] = useState(false)

  const [generatingBarcode, setGeneratingBarcode] = useState<string | null>(null)

  const generateBarcode = async (item: InventoryItem) => {
    setGeneratingBarcode(item.qcId)
    try {
      const barcodeData = {
        productType: item.productType,
        batchId: item.batchId,
        qcId: item.qcId,
        quantity: item.perfectQuantity
      }
      
      const response = await fetch('/api/barcode/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(barcodeData)
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // Open barcode in new window for printing
        const newWindow = window.open('', '_blank')
        if (newWindow) {
          newWindow.document.write(result.htmlContent)
          newWindow.document.close()
        }
        
        // Update inventory with barcode
        setInventory(prev => prev.map(inv => 
          inv.qcId === item.qcId ? { ...inv, barcode: result.barcode } : inv
        ))
        
        // Show success message
        alert('Barcode generated successfully!')
      } else {
        throw new Error('Failed to generate barcode')
      }
    } catch (error) {
      console.error('Error generating barcode:', error)
      alert('Failed to generate barcode. Please try again.')
    } finally {
      setGeneratingBarcode(null)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  useEffect(() => {
    // Filter inventory based on search term
    if (searchTerm) {
      const filtered = inventory.filter(item => 
        item.productType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.qcId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredInventory(filtered)
    } else {
      setFilteredInventory(inventory)
    }
  }, [inventory, searchTerm])

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/manufacturer/inventory')
      if (response.ok) {
        const data = await response.json()
        setInventory(data.inventory || [])
        setFilteredInventory(data.inventory || [])
      } else {
        setInventory([])
        setFilteredInventory([])
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
      setInventory([])
      setFilteredInventory([])
    } finally {
      setLoading(false)
    }
  }

  const totalItems = inventory.reduce((sum, item) => sum + (item.perfectQuantity || 0), 0)
  const lowStockItems = inventory.filter(item => (item.perfectQuantity || 0) < 50).length
  const qcApproved = inventory.filter(item => item.source === 'quality_control').length
  const availableStock = inventory.filter(item => item.status === 'available').length

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Factory Inventory</h1>
          <p className="text-muted-foreground">Manage raw materials and finished goods</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Scan className="w-4 h-4 mr-2" />
            Scan Barcode
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by product type, batch ID, QC ID, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold">{lowStockItems}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">QC Approved</p>
                <p className="text-2xl font-bold">{qcApproved}</p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Stock</p>
                <p className="text-2xl font-bold">{availableStock}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Items */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading inventory...</div>
            ) : inventory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="mx-auto h-12 w-12 mb-4" />
                <p>{searchTerm ? 'No matching inventory items found' : 'No inventory items found'}</p>
                <p className="text-sm">{searchTerm ? 'Try adjusting your search terms' : 'Add items to start tracking inventory'}</p>
              </div>
            ) : (
              filteredInventory.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Package className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="font-medium">{item.productType}</p>
                      <p className="text-sm text-muted-foreground">Batch: {item.batchId} | QC: {item.qcId}</p>
                      {item.barcode && <p className="text-xs text-blue-600">Barcode: {item.barcode}</p>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-medium">{item.perfectQuantity} pieces</p>
                      <p className="text-sm text-muted-foreground">{item.status}</p>
                    </div>
                    <Badge variant={item.perfectQuantity < 50 ? 'destructive' : 'default'}>
                      {item.perfectQuantity < 50 ? 'Low Stock' : 'In Stock'}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => generateBarcode(item)}
                      disabled={generatingBarcode === item.qcId}
                    >
                      <QrCode className="w-4 h-4 mr-1" />
                      {generatingBarcode === item.qcId ? 'Generating...' : item.barcode ? 'Print Barcode' : 'Generate Barcode'}
                    </Button>
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