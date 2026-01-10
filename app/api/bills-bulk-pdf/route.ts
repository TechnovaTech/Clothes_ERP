import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { generateBillHTML, BillData, StoreSettings } from '@/lib/bill-designs'
import puppeteer from 'puppeteer'

export async function POST(request: NextRequest) {
  try {
    const { billIds } = await request.json()
    
    if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
      return new NextResponse('Bill IDs required', { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const tenantId = session?.user?.tenantId
    
    if (!tenantId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Fetch store settings once
    const settingsCollection = await getTenantCollection(tenantId as string, 'settings')
    const settings = await settingsCollection.findOne({}) || {}
    const billDesign = (settings as any).billDesign || 'classic'

    const storeSettings: StoreSettings = {
      storeName: (settings as any).storeName || '',
      address: (settings as any).address || '',
      phone: (settings as any).phone || '',
      email: (settings as any).email || '',
      gst: (settings as any).gst || '',
      logo: (settings as any).logo || '',
      signature: (settings as any).signature || '',
      terms: (settings as any).terms || ''
    }

    // Fetch all bills
    const salesCollection = await getTenantCollection(tenantId as string, 'sales')
    const bills = await salesCollection.find({ 
      _id: { $in: billIds.map((id: string) => new ObjectId(id)) } 
    }).toArray()

    if (bills.length === 0) {
      return new NextResponse('No bills found', { status: 404 })
    }

    // Generate HTML for all bills with page breaks
    let combinedHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @media print {
      .page-break {
        page-break-after: always;
        break-after: page;
      }
    }
    body {
      margin: 0;
      padding: 20px;
    }
    .bill-container {
      padding-top: 20px;
    }
  </style>
</head>
<body>
`

    bills.forEach((bill, index) => {
      const billData: BillData = {
        billNo: bill.billNo || 'N/A',
        customerName: bill.customerName || 'Walk-in Customer',
        customerPhone: bill.customerPhone || '',
        customerAddress: bill.customerAddress || '',
        customerGst: bill.customerGst || '',
        items: (bill.items || []).map((item: any) => ({
          name: item.name || 'Item',
          quantity: Number(item.quantity) || 0,
          price: Number(item.price) || 0,
          total: Number(item.total) || 0,
          gstRate: item.gstRate !== undefined ? Number(item.gstRate) : undefined,
          hsn: item.hsn || undefined
        })),
        subtotal: Number(bill.subtotal) || 0,
        discountAmount: Number(bill.discountAmount) || 0,
        tax: Number(bill.tax) || 0,
        total: Number(bill.total) || 0,
        paymentMethod: bill.paymentMethod || 'Cash',
        cashAmount: Number(bill.cashAmount) || 0,
        onlineAmount: Number(bill.onlineAmount) || 0,
        cashier: bill.staffMember || bill.cashier || 'Admin',
        createdAt: bill.createdAt || new Date().toISOString(),
        storeName: (settings as any).storeName || 'Store',
        address: (settings as any).address || '',
        phone: (settings as any).phone || '',
        email: (settings as any).email || '',
        gst: (settings as any).gst || '',
        terms: (settings as any).terms || '',
        taxRate: Number(bill.taxRate) || Number((settings as any).taxRate) || 0,
        includeTax: bill.includeTax !== false
      }

      const billHTML = generateBillHTML(billDesign, billData, storeSettings)
      
      // Wrap each bill in a page-break div (except the last one)
      if (index < bills.length - 1) {
        combinedHTML += `<div class="page-break bill-container">${billHTML}</div>`
      } else {
        combinedHTML += `<div class="bill-container">${billHTML}</div>`
      }
    })

    combinedHTML += `
</body>
</html>
`

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    const page = await browser.newPage()
    await page.setContent(combinedHTML, { waitUntil: 'networkidle0' })
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    })
    await browser.close()

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bills-${new Date().toISOString().split('T')[0]}.pdf"`
      }
    })

  } catch (error) {
    console.error('Error generating bulk PDF:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new NextResponse(`Error: ${errorMessage}`, { status: 500 })
  }
}
