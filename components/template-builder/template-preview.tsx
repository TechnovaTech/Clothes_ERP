"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TemplateElement, TemplateData, TemplateEngine } from '@/lib/template-engine'
import { Eye, Download, FileText } from 'lucide-react'

interface TemplatePreviewProps {
  elements: TemplateElement[]
  templateType: string
}

export function TemplatePreview({ elements, templateType }: TemplatePreviewProps) {
  const [previewData, setPreviewData] = useState<TemplateData>({
    tenant: {
      companyName: 'Sample Store Name',
      address: '123 Business Street, City, State 12345',
      phone: '+91 9427300816',
      email: 'store@example.com',
      gst: '22AAAAA0000A1Z5',
      logo: '/placeholder-logo.png'
    },
    user: {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Admin'
    },
    invoice: {
      billNo: 'BILL-001',
      total: 1250.00,
      subtotal: 1000.00,
      tax: 180.00,
      discount: 50.00,
      date: new Date().toLocaleDateString('en-IN'),
      items: [
        { name: 'Product 1', quantity: 2, price: 300, total: 600 },
        { name: 'Product 2', quantity: 1, price: 400, total: 400 }
      ]
    },
    customer: {
      name: 'Jane Smith',
      phone: '+91 9876543210',
      address: '456 Customer Lane, City, State 54321',
      email: 'jane@customer.com'
    }
  })

  const renderPreview = () => {
    const mockTemplate = {
      id: 'preview',
      tenantId: 'preview',
      templateType: templateType as any,
      name: 'Preview',
      canvasJSON: {
        elements,
        settings: {
          pageSize: 'A4' as const,
          orientation: 'portrait' as const,
          margins: { top: 20, right: 20, bottom: 20, left: 20 }
        }
      },
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return TemplateEngine.renderToHTML(mockTemplate, previewData)
  }

  const downloadPreview = () => {
    const html = renderPreview()
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Template Preview</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            .template-container { margin: 0 auto; }
            @media print {
              body { margin: 0; padding: 0; }
              .template-container { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `
    
    const blob = new Blob([fullHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `template-preview-${templateType}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>Live Preview</span>
          </CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={downloadPreview}>
              <Download className="w-4 h-4 mr-2" />
              Download HTML
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t">
          <div 
            className="p-4 overflow-auto max-h-[600px] bg-gray-50"
            dangerouslySetInnerHTML={{ __html: renderPreview() }}
          />
        </div>
      </CardContent>
    </Card>
  )
}