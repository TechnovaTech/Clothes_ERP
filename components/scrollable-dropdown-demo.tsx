"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

// Demo component to test scrollable dropdowns
export function ScrollableDropdownDemo() {
  // Generate sample data for testing
  const products = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    category: `Category ${Math.floor(i / 10) + 1}`
  }))

  const categories = Array.from({ length: 20 }, (_, i) => `Category ${i + 1}`)

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Scrollable Dropdown Demo</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Select Component Demo */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Product (50 items)</label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Choose a product..." />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id.toString()}>
                  {product.name} - {product.category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* DropdownMenu Component Demo */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Dropdown Menu (20 items)</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                Choose Category
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full">
              {categories.map((category) => (
                <DropdownMenuItem key={category}>
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        <p>✅ Both dropdowns now have:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Maximum height of 300px</li>
          <li>Smooth scrolling with custom scrollbars</li>
          <li>Thin, styled scrollbars (6px width)</li>
          <li>Hover effects on scrollbar thumbs</li>
        </ul>
      </div>
    </div>
  )
}