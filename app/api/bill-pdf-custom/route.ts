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

    // Get tenant settings for company info and sequencing
    const settings = await db.collection('settings').findOne({ tenantId: session.user.tenantId })

    // Ensure bill/invoice number
    let billNo: string = billData.billNo
    let series: string | undefined = billData.series
    let number: string | undefined = billData.number
    if (!billNo) {
      const today = new Date()
      const yyyymmdd = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`
      const seq = (settings?.invoiceSeq ?? 0) + 1
      await db.collection('settings').updateOne(
        { tenantId: session.user.tenantId },
        { $set: { invoiceSeq: seq } },
        { upsert: true }
      )
      series = billData.series || 'INV'
      number = `${yyyymmdd}-${String(seq).padStart(4,'0')}`
      billNo = `${series}-${number}`
    }

    // Compute tax breakup if not provided
    const items = Array.isArray(billData.items) ? billData.items : []
    const storeState = settings?.state || body.storeState
    const taxMode = billData.taxMode || ((billData.customerState && storeState && billData.customerState !== storeState) ? 'inter' : 'intra')
    const taxAgg = items.reduce((acc: any, it: any) => {
      const qty = Number(it.quantity || 0)
      const price = Number(it.price || 0)
      const line = qty * price
      const normalizeRate = (r: any) => {
        return r === undefined || r === null || r === '' ? undefined : Number(r)
      }
      const overrideRate = normalizeRate(billData.billGstRate)
      const fallbackTaxRate = normalizeRate(billData.gstRate) ?? 0
      const effectiveRate = billData.gstRateOverride
        ? (overrideRate ?? fallbackTaxRate)
        : (normalizeRate(it.gstRate) ?? overrideRate ?? fallbackTaxRate)
      const rate = Number(effectiveRate ?? 0)
      const taxType = it.taxType || billData.taxType || taxMode || 'intra' // intra: cgst+sgst, inter: igst
      const gstAmount = it.gstAmount != null ? Number(it.gstAmount) : (line * rate / 100)
      it.gstAmount = gstAmount
      it.gstRate = rate
      it.taxType = taxType
      if (taxType === 'inter') {
        const igstVal = it.igst != null ? Number(it.igst) : gstAmount
        acc.igst += igstVal
        it.igst = igstVal
        it.cgst = 0
        it.sgst = 0
      } else {
        const half = gstAmount / 2
        const cgstVal = it.cgst != null ? Number(it.cgst) : half
        const sgstVal = it.sgst != null ? Number(it.sgst) : half
        acc.cgst += cgstVal
        acc.sgst += sgstVal
        it.cgst = cgstVal
        it.sgst = sgstVal
        it.igst = 0
      }
      acc.cess += it.cess != null ? Number(it.cess) : 0
      acc.gstAmount += gstAmount
      acc.gstRate = rate
      return acc
    }, { cgst: 0, sgst: 0, igst: 0, cess: 0, gstAmount: 0, gstRate: billData.gstRate || 0 })

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
        billNo,
        series,
        number,
        total: billData.total,
        subtotal: billData.subtotal,
        tax: billData.tax ?? taxAgg.gstAmount,
        discount: billData.discountAmount || billData.discount,
        date: new Date(billData.createdAt || Date.now()).toLocaleDateString('en-IN'),
        items,
        taxBreakup: taxAgg,
        taxMode
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
