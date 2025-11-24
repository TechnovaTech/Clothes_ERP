"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Type, Image, Table, Minus } from 'lucide-react'

export function QuickGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Guide</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Text Guide */}
        <div className="border rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Type className="w-4 h-4 text-blue-600" />
            <span className="font-medium">Adding Text</span>
          </div>
          <div className="text-sm space-y-1">
            <p><strong>Step 1:</strong> Click "Text" button</p>
            <p><strong>Step 2:</strong> Click the text element on canvas</p>
            <p><strong>Step 3:</strong> In Properties panel:</p>
            <ul className="ml-4 space-y-1">
              <li>• Type custom text in "Text Content"</li>
              <li>• OR choose from "Dynamic Data" dropdown</li>
              <li>• Adjust font size, color, alignment</li>
            </ul>
          </div>
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              Example: Store Name → Choose "Store Name" from dropdown
            </Badge>
          </div>
        </div>

        {/* Image Guide */}
        <div className="border rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Image className="w-4 h-4 text-green-600" />
            <span className="font-medium">Adding Images</span>
          </div>
          <div className="text-sm space-y-1">
            <p><strong>Step 1:</strong> Click "Image" button</p>
            <p><strong>Step 2:</strong> Click the image placeholder</p>
            <p><strong>Step 3:</strong> In Properties panel:</p>
            <ul className="ml-4 space-y-1">
              <li>• Enter image URL in "Image URL"</li>
              <li>• OR click "Upload Image" to select file</li>
              <li>• OR choose "Store Logo" for dynamic logo</li>
            </ul>
          </div>
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              Tip: Upload your logo once, it will appear on all bills
            </Badge>
          </div>
        </div>

        {/* Table Guide */}
        <div className="border rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Table className="w-4 h-4 text-purple-600" />
            <span className="font-medium">Adding Tables</span>
          </div>
          <div className="text-sm space-y-1">
            <p><strong>Step 1:</strong> Click "Table" button</p>
            <p><strong>Step 2:</strong> Position and resize as needed</p>
            <p><strong>Note:</strong> Table automatically shows items from bill</p>
          </div>
        </div>

        {/* Common Placeholders */}
        <div className="border rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-medium">Popular Dynamic Content</span>
          </div>
          <div className="grid grid-cols-1 gap-1 text-xs">
            <div className="flex justify-between">
              <span>Store Name:</span>
              <code className="bg-gray-100 px-1 rounded">tenant.companyName</code>
            </div>
            <div className="flex justify-between">
              <span>Bill Number:</span>
              <code className="bg-gray-100 px-1 rounded">invoice.billNo</code>
            </div>
            <div className="flex justify-between">
              <span>Total Amount:</span>
              <code className="bg-gray-100 px-1 rounded">invoice.total</code>
            </div>
            <div className="flex justify-between">
              <span>Customer Name:</span>
              <code className="bg-gray-100 px-1 rounded">customer.name</code>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="font-medium text-blue-900 mb-2">💡 Quick Tips</div>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Drag elements to move them around</li>
            <li>• Click element to select and edit properties</li>
            <li>• Use "Preview" tab to see final result</li>
            <li>• Save your template when done</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}