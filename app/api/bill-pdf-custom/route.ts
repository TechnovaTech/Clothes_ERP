import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTenantCollection } from '@/lib/tenant-data'
import { generateBillHTML } from '@/lib/bill-designs'
import puppeteer from 'puppeteer'

// POST - Generate custom bill PDF using template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { billData } = body

    if (!billData) {
      return NextResponse.json({ error: 'Bill data required' }, { status: 400 })
    }

    // Get tenant settings
    const settingsCollection = await getTenantCollection(session.user.tenantId, 'settings')
    const settings = await settingsCollection.findOne({})

    // Prepare bill data
    const bill = {
      billNo: billData.billNo,
      customerName: billData.customerName || 'Walk-in Customer',
      customerPhone: billData.customerPhone || '',
      items: billData.items || [],
      subtotal: billData.subtotal || 0,
      discountAmount: billData.discountAmount || 0,
      tax: billData.tax || 0,
      total: billData.total || 0,
      paymentMethod: billData.paymentMethod || 'Cash',
      cashier: billData.cashier || 'Admin',
      createdAt: billData.createdAt || new Date().toISOString(),
      storeName: settings?.storeName || billData.storeName || 'Store',
      address: settings?.address || billData.address || '',
      phone: settings?.phone || billData.phone || '',
      email: settings?.email || billData.email || '',
      gst: settings?.gst || billData.gst || '',
      terms: settings?.terms || billData.terms || ''
    }

    // Prepare store settings
    const storeSettings = {
      storeName: settings?.storeName || 'Store',
      address: settings?.address || '',
      phone: settings?.phone || '',
      email: settings?.email || '',
      gst: settings?.gst || '',
      logo: settings?.logo || '',
      signature: settings?.signature || '',
      terms: settings?.terms || ''
    }

    // Get selected design from settings (default to 'classic')
    const billDesign = settings?.billDesign || 'classic'

    // Generate HTML using selected design
    const fullHtml = generateBillHTML(billDesign, bill, storeSettings)

    // Launch puppeteer and generate PDF
    const launchOptions: any = {
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
    }
    const browser = await puppeteer.launch(launchOptions)
    const page = await browser.newPage()
    
    // Set the HTML content
    await page.setContent(fullHtml, { waitUntil: 'load' })
    
    // Generate PDF buffer
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
      }
    })
    
    await browser.close()

    // Return PDF as response
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${billData.billNo}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('Custom bill PDF error:', error)
    return NextResponse.json({ error: 'Failed to generate custom bill' }, { status: 500 })
  }
}
