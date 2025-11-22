import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/database'
import { TemplateEngine, TemplateData } from '@/lib/template-engine'
import { getDefaultTemplate } from '@/lib/default-templates'

// POST - Generate custom bill PDF using template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { billId, billData } = body

    if (!billData) {
      return NextResponse.json({ error: 'Bill data required' }, { status: 400 })
    }

    const db = await connectDB()
    
    // Load tenant's invoice template
    let template = await db.collection('templates').findOne({
      tenantId: session.user.tenantId,
      templateType: 'invoice'
    })

    // If no template exists, create default
    if (!template) {
      const defaultTemplate = {
        tenantId: session.user.tenantId,
        templateType: 'invoice',
        name: 'Default Invoice Template',
        canvasJSON: {
          elements: getDefaultTemplate('invoice'),
          settings: {
            pageSize: 'A4',
            orientation: 'portrait',
            margins: { top: 20, right: 20, bottom: 20, left: 20 }
          }
        },
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await db.collection('templates').insertOne(defaultTemplate)
      template = { ...defaultTemplate, _id: result.insertedId }
    }

    // Get tenant settings for company info
    const settings = await db.collection('settings').findOne({ tenantId: session.user.tenantId })

    // Prepare template data
    const templateData: TemplateData = {
      tenant: {
        companyName: settings?.storeName || billData.storeName || 'Store',
        address: settings?.address || billData.address || 'Store Address',
        phone: settings?.phone || billData.phone || '9427300816',
        email: settings?.email || billData.email || '',
        gst: settings?.gst || billData.gst || '',
        logo: settings?.logo || ''
      },
      user: {
        name: billData.cashier || 'Admin',
        email: session.user.email || '',
        role: 'Cashier'
      },
      invoice: {
        billNo: billData.billNo,
        total: billData.total,
        subtotal: billData.subtotal,
        tax: billData.tax,
        discount: billData.discountAmount || billData.discount,
        date: new Date(billData.createdAt).toLocaleDateString('en-IN'),
        items: billData.items || []
      },
      customer: {
        name: billData.customerName || 'Walk-in Customer',
        phone: billData.customerPhone || '',
        address: '',
        email: ''
      }
    }

    // Render template to HTML
    const html = TemplateEngine.renderToHTML(template, templateData)

    // Return HTML for PDF generation (can be enhanced with puppeteer for actual PDF)
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice ${billData.billNo}</title>
          <style>
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
            .template-container { margin: 0; }
            @media print {
              body { margin: 0; padding: 0; }
              .template-container { margin: 0; page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `

    return new NextResponse(fullHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="invoice-${billData.billNo}.html"`
      }
    })
  } catch (error) {
    console.error('Custom bill PDF error:', error)
    return NextResponse.json({ error: 'Failed to generate custom bill' }, { status: 500 })
  }
}