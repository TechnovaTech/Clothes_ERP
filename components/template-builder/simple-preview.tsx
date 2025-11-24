"use client"

import { TemplateElement, TemplateEngine } from '@/lib/template-engine'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SimplePreviewProps {
  elements: TemplateElement[]
  templateType: string
}

export function SimplePreview({ elements, templateType }: SimplePreviewProps) {
  // Sample data for preview
  const sampleData = {
    tenant: {
      companyName: 'Fashion Store',
      address: '123 Main Street, City, State 12345',
      phone: '+91 9876543210',
      email: 'store@fashion.com',
      gst: 'GST123456789'
    },
    invoice: {
      billNo: 'INV-001',
      date: new Date().toLocaleDateString(),
      total: 1250.00,
      subtotal: 1000.00,
      tax: 180.00,
      discount: 50.00,
      items: [
        { name: 'T-Shirt', quantity: 2, price: 250, total: 500 },
        { name: 'Jeans', quantity: 1, price: 500, total: 500 }
      ]
    },
    customer: {
      name: 'John Doe',
      phone: '+91 9876543210',
      address: '456 Customer Street'
    }
  }

  const renderElement = (element: TemplateElement) => {
    let content = element.content || ''
    
    // Replace placeholders with sample data
    if (element.placeholder) {
      content = TemplateEngine.replacePlaceholders(element.placeholder, sampleData)
    }

    const style = {
      position: 'absolute' as const,
      left: element.position?.x || 0,
      top: element.position?.y || 0,
      width: element.size?.width || 200,
      height: element.size?.height || 30,
      fontSize: element.style?.fontSize || 14,
      fontWeight: element.style?.fontWeight || 'normal',
      textAlign: element.style?.textAlign || 'left' as const,
      color: element.style?.color || '#000000',
      display: 'flex',
      alignItems: 'center',
      padding: '4px'
    }

    switch (element.type) {
      case 'text':
        return (
          <div key={element.id} style={style}>
            {content || 'Sample Text'}
          </div>
        )
      
      case 'image':
        return (
          <div key={element.id} style={style}>
            <div className="w-full h-full bg-gray-200 border flex items-center justify-center text-xs">
              [Logo Image]
            </div>
          </div>
        )
      
      case 'table':
        return (
          <div key={element.id} style={style}>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-1">Item</th>
                  <th className="text-center p-1">Qty</th>
                  <th className="text-right p-1">Rate</th>
                  <th className="text-right p-1">Amount</th>
                </tr>
              </thead>
              <tbody>
                {sampleData.invoice.items.map((item, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-1">{item.name}</td>
                    <td className="text-center p-1">{item.quantity}</td>
                    <td className="text-right p-1">₹{item.price}</td>
                    <td className="text-right p-1">₹{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      
      case 'divider':
        return (
          <div key={element.id} style={style}>
            <div className="w-full h-full bg-gray-400"></div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="relative bg-white border min-h-[600px] mx-auto"
          style={{ width: '210mm', height: '297mm', transform: 'scale(0.5)', transformOrigin: 'top left' }}
        >
          {elements.map(renderElement)}
          
          {elements.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              Add elements to see preview
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}