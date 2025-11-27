import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { generateBillHTML, BillData, StoreSettings } from '@/lib/bill-designs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const billId = params.id
    console.log('Bill PDF request for ID:', billId)
    
    if (!billId) {
      return new NextResponse('Bill ID required', { status: 400 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      console.error('No tenant ID in session')
      return new NextResponse('Unauthorized', { status: 401 })
    }
    
    console.log('Tenant ID:', session.user.tenantId)

    // Fetch the actual bill from database
    const salesCollection = await getTenantCollection(session.user.tenantId, 'sales')
    const bill = await salesCollection.findOne({ _id: new ObjectId(billId) })
    console.log('Bill found:', !!bill)
    
    if (!bill) {
      return new NextResponse('Bill not found', { status: 404 })
    }

    // Fetch store settings
    const settingsCollection = await getTenantCollection(session.user.tenantId, 'settings')
    const settings = await settingsCollection.findOne({}) || {}

    // Get selected bill design from settings (default to 'classic')
    const billDesign = (settings as any).billDesign || 'classic'

    // Prepare bill data with safe defaults
    const billData: BillData = {
      billNo: bill.billNo || 'N/A',
      customerName: bill.customerName || 'Walk-in Customer',
      customerPhone: bill.customerPhone || '',
      items: (bill.items || []).map((item: any) => ({
        name: item.name || 'Item',
        quantity: Number(item.quantity) || 0,
        price: Number(item.price) || 0,
        total: Number(item.total) || 0
      })),
      subtotal: Number(bill.subtotal) || 0,
      discountAmount: Number(bill.discountAmount) || 0,
      tax: Number(bill.tax) || 0,
      total: Number(bill.total) || 0,
      paymentMethod: bill.paymentMethod || 'Cash',
      cashier: bill.staffMember || bill.cashier || 'Admin',
      createdAt: bill.createdAt || new Date().toISOString(),
      storeName: (settings as any).storeName || 'Store',
      address: (settings as any).address || '',
      phone: (settings as any).phone || '',
      email: (settings as any).email || '',
      gst: (settings as any).gst || '',
      terms: (settings as any).terms || ''
    }

    // Prepare store settings
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

    // Generate HTML using selected design
    const htmlContent = generateBillHTML(billDesign, billData, storeSettings)


    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    })

  } catch (error) {
    console.error('Error generating bill PDF:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', errorMessage)
    return new NextResponse(`Error: ${errorMessage}`, { status: 500 })
  }
}