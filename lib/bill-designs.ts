// Fixed bill design templates

function convertToWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only'
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  
  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return ''
    if (n < 10) return ones[n]
    if (n < 20) return teens[n - 10]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertLessThanThousand(n % 100) : '')
  }
  
  let intPart = Math.floor(num)
  const decPart = Math.round((num - intPart) * 100)
  
  let result = ''
  
  if (intPart >= 10000000) {
    result += convertLessThanThousand(Math.floor(intPart / 10000000)) + ' Crore '
    intPart %= 10000000
  }
  if (intPart >= 100000) {
    result += convertLessThanThousand(Math.floor(intPart / 100000)) + ' Lakh '
    intPart %= 100000
  }
  if (intPart >= 1000) {
    result += convertLessThanThousand(Math.floor(intPart / 1000)) + ' Thousand '
    intPart %= 1000
  }
  if (intPart > 0) {
    result += convertLessThanThousand(intPart)
  }
  
  result = result.trim() + ' Rupees'
  if (decPart > 0) result += ' and ' + convertLessThanThousand(decPart) + ' Paise'
  return result + ' Only'
}

export interface BillData {
  billNo: string
  customerName: string
  customerPhone?: string
  items: Array<{
    name: string
    quantity: number
    price: number
    total: number
    gstRate?: number
    hsn?: string
  }>
  subtotal: number
  discountAmount?: number
  tax: number
  total: number
  paymentMethod: string
  cashier: string
  createdAt: string
  storeName: string
  address: string
  phone: string
  email: string
  gst: string
  terms?: string
  taxRate?: number
  includeTax?: boolean
}

export interface StoreSettings {
  storeName: string
  address: string
  phone: string
  email: string
  gst: string
  logo?: string
  signature?: string
  terms?: string
}

export function generateClassicDesign(bill: BillData, settings: StoreSettings): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${bill.billNo}</title>
  <style>
    @page { size: A4; margin: 0; }
    @media print { body { margin: 0; padding: 0; } .page-break { page-break-before: always; } }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; background: white; }
    .invoice { max-width: 800px; margin: 0 auto; border: 2px solid #333; padding: 30px; }
    .header { text-align: center; border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
    .logo { max-width: 120px; max-height: 80px; margin-bottom: 10px; }
    .company-name { font-size: 28px; font-weight: bold; color: #333; margin-bottom: 5px; }
    .company-details { font-size: 12px; color: #666; line-height: 1.6; }
    .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .invoice-info div { flex: 1; }
    .invoice-title { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
    .info-label { font-weight: bold; color: #333; }
    .info-row { margin: 5px 0; }
    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .items-table th { background: #333; color: white; padding: 12px; text-align: left; font-weight: bold; }
    .items-table td { padding: 10px; border-bottom: 1px solid #ddd; }
    .items-table tr:last-child td { border-bottom: 2px solid #333; }
    .totals { margin-top: 20px; text-align: right; }
    .totals-row { display: flex; justify-content: flex-end; padding: 8px 0; }
    .totals-label { width: 150px; font-weight: bold; text-align: right; padding-right: 20px; }
    .totals-value { width: 120px; text-align: right; }
    .grand-total { font-size: 20px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #333; text-align: center; }
    .signature { margin-top: 60px; text-align: right; }
    .signature img { max-width: 150px; max-height: 60px; }
    .terms { font-size: 10px; color: #666; margin-top: 20px; text-align: left; padding: 10px; background: #f9f9f9; border: 1px solid #ddd; }
    .payment-info { margin-top: 10px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      ${settings.logo ? `<img src="${settings.logo}" alt="Logo" class="logo" />` : ''}
      <div class="company-name">${settings.storeName}</div>
      <div class="company-details">
        ${settings.address}<br/>
        Phone: ${settings.phone} | Email: ${settings.email}<br/>
        GST No: ${settings.gst}
      </div>
    </div>
    
    <div class="invoice-info">
      <div>
        <div class="invoice-title">INVOICE</div>
        <div class="info-row"><span class="info-label">Invoice No:</span> ${bill.billNo}</div>
        <div class="info-row"><span class="info-label">Date:</span> ${new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
        <div class="info-row"><span class="info-label">Time:</span> ${new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
        <div class="info-row"><span class="info-label">Cashier:</span> ${bill.cashier}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: bold; margin-bottom: 5px;">BILL TO:</div>
        <div>${bill.customerName}</div>
        ${bill.customerPhone ? `<div>${bill.customerPhone}</div>` : ''}
        <div class="payment-info">Payment: ${bill.paymentMethod}</div>
      </div>
    </div>
    
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 50px;">Sr.</th>
          <th>Item Description</th>
          <th style="width: 80px; text-align: center;">Qty</th>
          <th style="width: 100px; text-align: right;">Rate</th>
          <th style="width: 120px; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${bill.items.map((item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.name}</td>
            <td style="text-align: center;">${item.quantity}</td>
            <td style="text-align: right;">₹${item.price.toFixed(2)}</td>
            <td style="text-align: right;">₹${item.total.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="totals">
      <div class="totals-row">
        <div class="totals-label">Subtotal:</div>
        <div class="totals-value">₹${bill.subtotal.toFixed(2)}</div>
      </div>
      ${bill.discountAmount && bill.discountAmount > 0 ? `
      <div class="totals-row">
        <div class="totals-label">Discount:</div>
        <div class="totals-value">-₹${bill.discountAmount.toFixed(2)}</div>
      </div>
      ` : ''}
      ${bill.tax > 0 ? `
      <div class="totals-row">
        <div class="totals-label">Tax:</div>
        <div class="totals-value">₹${bill.tax.toFixed(2)}</div>
      </div>
      ` : ''}
      <div class="totals-row grand-total">
        <div class="totals-label">TOTAL AMOUNT:</div>
        <div class="totals-value">₹${bill.total.toFixed(2)}</div>
      </div>
    </div>
    
    ${settings.signature ? `
    <div class="signature">
      <div style="margin-bottom: 10px;">Authorized Signature</div>
      <img src="${settings.signature}" alt="Signature" />
    </div>
    ` : ''}
    
    ${settings.terms || bill.terms ? `
    <div class="terms">
      <strong>Terms & Conditions:</strong><br/>
      ${settings.terms || bill.terms}
    </div>
    ` : ''}
    
    <div class="footer">
      <div style="font-weight: bold; font-size: 16px;">Thank You For Your Business!</div>
      <div style="margin-top: 10px; font-size: 12px;">For any queries, please contact: ${settings.phone}</div>
      <div style="margin-top: 10px; font-size: 11px;"><strong>Exchange Policy:</strong> Items can be exchanged within 7 days with receipt</div>
    </div>
  </div>
</body>
</html>
  `
}

export function generateModernDesign(bill: BillData, settings: StoreSettings): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${bill.billNo}</title>
  <style>
    @page { size: A4; margin: 0; }
    @media print { body { margin: 0; padding: 0; background: white; } .page-break { page-break-before: always; } }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f5f5f5; }
    .invoice { max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; }
    .logo { max-width: 100px; max-height: 60px; margin-bottom: 15px; }
    .company-name { font-size: 32px; font-weight: 300; letter-spacing: 2px; margin-bottom: 10px; }
    .company-details { font-size: 13px; opacity: 0.9; line-height: 1.8; }
    .content { padding: 40px; }
    .invoice-meta { display: flex; justify-content: space-between; margin-bottom: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
    .meta-section h3 { font-size: 12px; text-transform: uppercase; color: #667eea; margin-bottom: 10px; letter-spacing: 1px; }
    .meta-section p { font-size: 14px; color: #333; margin: 5px 0; }
    .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    .items-table th { background: #f8f9fa; padding: 15px; text-align: left; font-size: 12px; text-transform: uppercase; color: #667eea; font-weight: 600; letter-spacing: 1px; }
    .items-table td { padding: 15px; border-bottom: 1px solid #eee; font-size: 14px; }
    .totals { margin-top: 30px; }
    .totals-row { display: flex; justify-content: flex-end; padding: 10px 0; font-size: 15px; }
    .totals-label { width: 150px; text-align: right; padding-right: 30px; color: #666; }
    .totals-value { width: 120px; text-align: right; font-weight: 500; }
    .grand-total { background: #667eea; color: white; padding: 15px 0; margin-top: 10px; border-radius: 8px; font-size: 18px; font-weight: 600; }
    .footer { margin-top: 50px; padding: 30px; background: #f8f9fa; text-align: center; border-radius: 8px; }
    .signature { text-align: right; margin-top: 40px; }
    .signature img { max-width: 150px; max-height: 60px; }
    .terms { font-size: 11px; color: #666; margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 3px solid #667eea; }
    .payment-info { margin-top: 10px; font-weight: 600; color: #667eea; }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      ${settings.logo ? `<img src="${settings.logo}" alt="Logo" class="logo" />` : ''}
      <div class="company-name">${settings.storeName}</div>
      <div class="company-details">
        ${settings.address} • ${settings.phone}<br/>
        ${settings.email} • GST: ${settings.gst}
      </div>
    </div>
    
    <div class="content">
      <div class="invoice-meta">
        <div class="meta-section">
          <h3>Invoice Details</h3>
          <p><strong>${bill.billNo}</strong></p>
          <p>${new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
          <p>${new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
          <p>Cashier: ${bill.cashier}</p>
        </div>
        <div class="meta-section" style="text-align: right;">
          <h3>Bill To</h3>
          <p><strong>${bill.customerName}</strong></p>
          ${bill.customerPhone ? `<p>${bill.customerPhone}</p>` : ''}
          <p class="payment-info">Payment: ${bill.paymentMethod}</p>
        </div>
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 50px;">#</th>
            <th>Description</th>
            <th style="width: 80px; text-align: center;">Qty</th>
            <th style="width: 100px; text-align: right;">Rate</th>
            <th style="width: 120px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${bill.items.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.name}</td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: right;">₹${item.price.toFixed(2)}</td>
              <td style="text-align: right;">₹${item.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="totals-row">
          <div class="totals-label">Subtotal</div>
          <div class="totals-value">₹${bill.subtotal.toFixed(2)}</div>
        </div>
        ${bill.discountAmount && bill.discountAmount > 0 ? `
        <div class="totals-row">
          <div class="totals-label">Discount</div>
          <div class="totals-value">-₹${bill.discountAmount.toFixed(2)}</div>
        </div>
        ` : ''}
        ${bill.tax > 0 ? `
        <div class="totals-row">
          <div class="totals-label">Tax</div>
          <div class="totals-value">₹${bill.tax.toFixed(2)}</div>
        </div>
        ` : ''}
        <div class="totals-row grand-total">
          <div class="totals-label">Total Amount</div>
          <div class="totals-value">₹${bill.total.toFixed(2)}</div>
        </div>
      </div>
      
      ${settings.signature ? `
      <div class="signature">
        <p style="margin-bottom: 10px; color: #666;">Authorized Signature</p>
        <img src="${settings.signature}" alt="Signature" />
      </div>
      ` : ''}
      
      ${settings.terms || bill.terms ? `
      <div class="terms">
        <strong>Terms & Conditions:</strong><br/>
        ${settings.terms || bill.terms}
      </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <div style="font-size: 18px; font-weight: 600; color: #667eea; margin-bottom: 10px;">Thank You For Your Purchase!</div>
      <div style="font-size: 13px; color: #666;">For support: ${settings.phone} | ${settings.email}</div>
      <div style="margin-top: 10px; font-size: 12px; color: #666;"><strong>Exchange Policy:</strong> Items can be exchanged within 7 days with receipt</div>
    </div>
  </div>
</body>
</html>
  `
}

export function generateElegantDesign(bill: BillData, settings: StoreSettings): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${bill.billNo}</title>
  <style>
    @page { size: A4; margin: 0; }
    @media print { body { margin: 0; padding: 0; background: white; } .page-break { page-break-before: always; } }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Georgia', serif; padding: 40px; background: #fafafa; }
    .invoice { max-width: 800px; margin: 0 auto; background: white; border: 1px solid #d4af37; }
    .header { background: #1a1a1a; color: #d4af37; padding: 40px; text-align: center; border-bottom: 3px solid #d4af37; }
    .logo { max-width: 120px; max-height: 80px; margin-bottom: 15px; }
    .company-name { font-size: 36px; font-weight: normal; letter-spacing: 3px; margin-bottom: 10px; }
    .company-details { font-size: 13px; color: #ccc; line-height: 1.8; }
    .content { padding: 40px; }
    .invoice-header { display: flex; justify-content: space-between; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #d4af37; }
    .invoice-title { font-size: 28px; color: #1a1a1a; font-weight: normal; letter-spacing: 2px; }
    .invoice-details { text-align: right; }
    .detail-row { margin: 8px 0; font-size: 14px; }
    .detail-label { color: #666; margin-right: 10px; }
    .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    .items-table th { background: #1a1a1a; color: #d4af37; padding: 15px; text-align: left; font-weight: normal; letter-spacing: 1px; }
    .items-table td { padding: 15px; border-bottom: 1px solid #eee; }
    .items-table tbody tr:hover { background: #f9f9f9; }
    .totals { margin-top: 40px; border-top: 2px solid #d4af37; padding-top: 20px; }
    .totals-row { display: flex; justify-content: flex-end; padding: 12px 0; font-size: 16px; }
    .totals-label { width: 180px; text-align: right; padding-right: 40px; color: #666; }
    .totals-value { width: 140px; text-align: right; }
    .grand-total { background: #1a1a1a; color: #d4af37; padding: 20px; margin-top: 15px; font-size: 20px; font-weight: bold; letter-spacing: 1px; }
    .footer { margin-top: 60px; padding: 30px; background: #1a1a1a; color: #d4af37; text-align: center; }
    .signature { text-align: right; margin: 50px 0; }
    .signature img { max-width: 150px; max-height: 60px; border-top: 2px solid #d4af37; padding-top: 10px; }
    .terms { font-size: 11px; color: #666; margin-top: 20px; padding: 15px; background: #f9f9f9; border-left: 3px solid #d4af37; }
    .payment-info { margin-top: 10px; font-weight: bold; color: #d4af37; }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      ${settings.logo ? `<img src="${settings.logo}" alt="Logo" class="logo" />` : ''}
      <div class="company-name">${settings.storeName}</div>
      <div class="company-details">
        ${settings.address}<br/>
        ${settings.phone} • ${settings.email}<br/>
        GST: ${settings.gst}
      </div>
    </div>
    
    <div class="content">
      <div class="invoice-header">
        <div>
          <div class="invoice-title">INVOICE</div>
          <div style="margin-top: 15px; font-size: 14px; color: #666;">
            <div><strong>Bill To:</strong></div>
            <div style="margin-top: 5px;">${bill.customerName}</div>
            ${bill.customerPhone ? `<div>${bill.customerPhone}</div>` : ''}
          </div>
        </div>
        <div class="invoice-details">
          <div class="detail-row"><span class="detail-label">Invoice No:</span><strong>${bill.billNo}</strong></div>
          <div class="detail-row"><span class="detail-label">Date:</span>${new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
          <div class="detail-row"><span class="detail-label">Time:</span>${new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
          <div class="detail-row"><span class="detail-label">Cashier:</span>${bill.cashier}</div>
          <div class="payment-info">Payment: ${bill.paymentMethod}</div>
        </div>
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 50px;">No.</th>
            <th>Item Description</th>
            <th style="width: 80px; text-align: center;">Quantity</th>
            <th style="width: 100px; text-align: right;">Rate</th>
            <th style="width: 120px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${bill.items.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.name}</td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: right;">₹${item.price.toFixed(2)}</td>
              <td style="text-align: right;">₹${item.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="totals-row">
          <div class="totals-label">Subtotal:</div>
          <div class="totals-value">₹${bill.subtotal.toFixed(2)}</div>
        </div>
        ${bill.discountAmount && bill.discountAmount > 0 ? `
        <div class="totals-row">
          <div class="totals-label">Discount:</div>
          <div class="totals-value">-₹${bill.discountAmount.toFixed(2)}</div>
        </div>
        ` : ''}
        ${bill.tax > 0 ? `
        <div class="totals-row">
          <div class="totals-label">Tax:</div>
          <div class="totals-value">₹${bill.tax.toFixed(2)}</div>
        </div>
        ` : ''}
        <div class="totals-row grand-total">
          <div class="totals-label">GRAND TOTAL:</div>
          <div class="totals-value">₹${bill.total.toFixed(2)}</div>
        </div>
      </div>
      
      ${settings.signature ? `
      <div class="signature">
        <div style="margin-bottom: 15px; color: #666;">Authorized Signature</div>
        <img src="${settings.signature}" alt="Signature" />
      </div>
      ` : ''}
      
      ${settings.terms || bill.terms ? `
      <div class="terms">
        <strong>Terms & Conditions:</strong><br/>
        ${settings.terms || bill.terms}
      </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <div style="font-size: 18px; letter-spacing: 2px; margin-bottom: 10px;">Thank You For Your Purchase</div>
      <div style="font-size: 12px; opacity: 0.8;">Contact: ${settings.phone} | ${settings.email}</div>
      <div style="margin-top: 10px; font-size: 11px; opacity: 0.8;"><strong>Exchange Policy:</strong> Items can be exchanged within 7 days with receipt</div>
    </div>
  </div>
</body>
</html>
  `
}

export function generateCompactDesign(bill: BillData, settings: StoreSettings): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${bill.billNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; padding: 20px; background: white; }
    .receipt { max-width: 350px; margin: 0 auto; border: 2px dashed #333; padding: 20px; }
    .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 15px; margin-bottom: 15px; }
    .logo { max-width: 80px; max-height: 60px; margin-bottom: 10px; }
    .store-name { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
    .store-info { font-size: 11px; line-height: 1.5; }
    .receipt-title { text-align: center; font-size: 16px; font-weight: bold; margin: 15px 0; }
    .info-row { display: flex; justify-content: space-between; font-size: 11px; margin: 5px 0; }
    .items { margin: 15px 0; }
    .item { margin: 10px 0; padding: 8px 0; border-bottom: 1px dashed #999; }
    .item-name { font-weight: bold; font-size: 12px; margin-bottom: 3px; }
    .item-details { display: flex; justify-content: space-between; font-size: 11px; }
    .totals { margin-top: 15px; border-top: 2px dashed #333; padding-top: 10px; }
    .total-row { display: flex; justify-content: space-between; font-size: 12px; margin: 5px 0; }
    .grand-total { font-size: 16px; font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 2px solid #333; }
    .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 2px dashed #333; font-size: 11px; }
    .signature { text-align: center; margin: 20px 0; }
    .signature img { max-width: 100px; max-height: 50px; }
    .terms { font-size: 9px; margin-top: 15px; padding: 8px; background: #f9f9f9; border: 1px dashed #999; text-align: justify; }
    .payment-info { margin-top: 10px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      ${settings.logo ? `<img src="${settings.logo}" alt="Logo" class="logo" />` : ''}
      <div class="store-name">${settings.storeName}</div>
      <div class="store-info">
        ${settings.address}<br/>
        Ph: ${settings.phone}<br/>
        Email: ${settings.email}<br/>
        GST: ${settings.gst}
      </div>
    </div>
    
    <div class="receipt-title">*** RECEIPT ***</div>
    
    <div class="info-row">
      <span>Bill No:</span>
      <span><strong>${bill.billNo}</strong></span>
    </div>
    <div class="info-row">
      <span>Date:</span>
      <span>${new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
    </div>
    <div class="info-row">
      <span>Time:</span>
      <span>${new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
    </div>
    <div class="info-row">
      <span>Cashier:</span>
      <span>${bill.cashier}</span>
    </div>
    <div class="info-row">
      <span>Customer:</span>
      <span>${bill.customerName}</span>
    </div>
    ${bill.customerPhone ? `
    <div class="info-row">
      <span>Phone:</span>
      <span>${bill.customerPhone}</span>
    </div>
    ` : ''}
    
    <div class="items">
      ${bill.items.map((item, index) => `
        <div class="item">
          <div class="item-name">${index + 1}. ${item.name}</div>
          <div class="item-details">
            <span>${item.quantity} x ₹${item.price.toFixed(2)}</span>
            <span>₹${item.total.toFixed(2)}</span>
          </div>
        </div>
      `).join('')}
    </div>
    
    <div class="totals">
      <div class="total-row">
        <span>Subtotal:</span>
        <span>₹${bill.subtotal.toFixed(2)}</span>
      </div>
      ${bill.discountAmount && bill.discountAmount > 0 ? `
      <div class="total-row">
        <span>Discount:</span>
        <span>-₹${bill.discountAmount.toFixed(2)}</span>
      </div>
      ` : ''}
      ${bill.tax > 0 ? `
      <div class="total-row">
        <span>Tax:</span>
        <span>₹${bill.tax.toFixed(2)}</span>
      </div>
      ` : ''}
      <div class="total-row grand-total">
        <span>TOTAL AMOUNT:</span>
        <span>₹${bill.total.toFixed(2)}</span>
      </div>
      <div class="payment-info">
        <span>Payment Method: ${bill.paymentMethod}</span>
      </div>
    </div>
    
    ${settings.signature ? `
    <div class="signature">
      <img src="${settings.signature}" alt="Signature" />
    </div>
    ` : ''}
    
    ${settings.terms || bill.terms ? `
    <div class="terms">
      <strong>Terms & Conditions:</strong><br/>
      ${settings.terms || bill.terms}
    </div>
    ` : ''}
    
    <div class="footer">
      <div style="font-weight: bold; margin-bottom: 5px;">THANK YOU FOR YOUR PURCHASE!</div>
      <div>Please Visit Again</div>
      <div style="margin-top: 10px;">For queries: ${settings.phone}</div>
      <div style="margin-top: 10px; font-size: 10px;"><strong>Exchange Policy:</strong> Items can be exchanged within 7 days with receipt</div>
    </div>
  </div>
</body>
</html>
  `
}

export function generateThermalDesign(bill: BillData, settings: StoreSettings): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${bill.billNo}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
    body { 
      font-family: 'Courier New', monospace; 
      max-width: 300px; 
      margin: 0 auto; 
      padding: 8px; 
      font-size: 10px; 
      line-height: 1.2;
      background: white;
      color: black;
    }
    .receipt-header {
      text-align: center;
      margin-bottom: 15px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    .store-name {
      font-size: 14px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .store-info {
      font-size: 9px;
      line-height: 1.3;
    }
    .bill-info {
      margin: 8px 0;
      font-size: 9px;
    }
    .bill-info-row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
    }
    .separator {
      border-bottom: 1px dashed #000;
      margin: 10px 0;
    }
    .double-separator {
      border-bottom: 2px solid #000;
      margin: 10px 0;
    }
    .items-header {
      display: grid;
      grid-template-columns: 2fr 0.8fr 1fr 1fr;
      gap: 2px;
      font-weight: bold;
      font-size: 8px;
      text-align: center;
      margin-bottom: 3px;
      padding: 3px 0;
      background: #f0f0f0;
    }
    .item-row {
      display: grid;
      grid-template-columns: 2fr 0.8fr 1fr 1fr;
      gap: 2px;
      font-size: 8px;
      margin: 2px 0;
      padding: 1px 0;
    }
    .item-name {
      font-weight: bold;
      text-align: left;
    }
    .item-qty, .item-rate, .item-amount {
      text-align: center;
    }
    .totals {
      margin-top: 15px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin: 2px 0;
      font-size: 9px;
    }
    .subtotal-row {
      padding: 3px 0;
    }
    .tax-row {
      padding: 3px 0;
      font-style: italic;
    }
    .discount-row {
      padding: 3px 0;
      color: #d00;
    }
    .final-total {
      font-weight: bold;
      font-size: 11px;
      padding: 4px 0;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      margin: 4px 0;
    }
    .payment-info {
      margin: 6px 0;
      text-align: center;
      font-size: 9px;
    }
    .footer {
      text-align: center;
      margin-top: 10px;
      font-size: 8px;
      line-height: 1.3;
    }
    .thank-you {
      font-weight: bold;
      font-size: 10px;
      margin-bottom: 4px;
    }
    .terms {
      font-size: 7px;
      margin: 8px 0;
      text-align: justify;
      line-height: 1.2;
      padding: 4px;
      background: #f9f9f9;
      border: 1px solid #ddd;
    }
    .powered-by {
      font-size: 10px;
      color: #666;
      margin-top: 15px;
      font-style: italic;
    }
    .currency {
      font-family: Arial, sans-serif;
    }
  </style>
</head>
<body>
  <div class="receipt-header">
    <div class="store-name">${settings.storeName}</div>
    <div class="store-info">
      <div>${settings.address}</div>
      <div>Phone: ${settings.phone}</div>
      <div>GST No: ${settings.gst}</div>
      <div>Email: ${settings.email}</div>
    </div>
  </div>
  
  <div class="bill-info">
    <div class="bill-info-row">
      <span><strong>Receipt No:</strong></span>
      <span><strong>${bill.billNo}</strong></span>
    </div>
    <div class="bill-info-row">
      <span>Date:</span>
      <span>${new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
    </div>
    <div class="bill-info-row">
      <span>Time:</span>
      <span>${new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
    </div>
    <div class="bill-info-row">
      <span>Cashier:</span>
      <span>Admin</span>
    </div>
    ${bill.customerName ? `
    <div class="bill-info-row">
      <span>Customer:</span>
      <span>${bill.customerName}</span>
    </div>
    ` : ''}
    ${bill.customerPhone ? `
    <div class="bill-info-row">
      <span>Phone:</span>
      <span>${bill.customerPhone}</span>
    </div>
    ` : ''}
  </div>
  
  <div class="double-separator"></div>
  
  <div class="items-header">
    <div>ITEM</div>
    <div>QTY</div>
    <div>RATE</div>
    <div>AMOUNT</div>
  </div>
  
  ${bill.items.map((item: any) => `
    <div class="item-row">
      <div class="item-name">${item.name}</div>
      <div class="item-qty">${item.quantity}</div>
      <div class="item-rate">${(item.price || 0)}</div>
      <div class="item-amount"><span class="currency">₹</span>${(item.total || 0)}</div>
    </div>
  `).join('')}
  
  <div class="separator"></div>
  
  <div class="totals">
    <div class="total-row subtotal-row">
      <span>Subtotal:</span>
      <span><span class="currency">₹</span>${(bill.subtotal || 0).toFixed(2)}</span>
    </div>
    ${(bill.discountAmount && bill.discountAmount > 0) ? `
    <div class="total-row discount-row">
      <span>Discount:</span>
      <span>- <span class="currency">₹</span>${bill.discountAmount.toFixed(2)}</span>
    </div>
    ` : ''}
    ${(bill.tax && bill.tax > 0) ? `
    <div class="total-row tax-row">
      <span>Tax:</span>
      <span><span class="currency">₹</span>${bill.tax.toFixed(2)}</span>
    </div>
    ` : ''}
    <div class="total-row final-total">
      <span>TOTAL AMOUNT:</span>
      <span><span class="currency">₹</span>${(bill.total || 0).toFixed(2)}</span>
    </div>
  </div>
  
  <div class="payment-info">
    <strong>Payment Method: ${bill.paymentMethod || 'Cash'}</strong>
  </div>
  
  ${(settings.terms || bill.terms) ? `
    <div class="terms">
      <strong>Terms & Conditions:</strong><br>
      ${settings.terms || bill.terms}
    </div>
  ` : ''}
  
  <div class="double-separator"></div>
  
  <div class="footer">
    <div class="thank-you">🙏 THANK YOU FOR YOUR PURCHASE! 🙏</div>
    <div>Please visit us again</div>
    <div>For any queries: ${settings.phone}</div>
    <div style="margin-top: 10px; font-size: 11px;">
      <strong>Exchange Policy:</strong> Items can be exchanged within 7 days with receipt
    </div>
    <div class="powered-by">
      Powered by Fashion ERP System
    </div>
  </div>
  
  <script>
    window.onload = function() {
      // Auto print after 1 second
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  </script>
</body>
</html>
  `
}

export function generateTaxInvoiceDesign(bill: BillData, settings: StoreSettings): string {
  const ITEMS_PER_PAGE = 15
  const totalItems = bill.items.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  
  let pagesHTML = ''
  
  for (let pageNum = 0; pageNum < totalPages; pageNum++) {
    const startIdx = pageNum * ITEMS_PER_PAGE
    const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, totalItems)
    const pageItems = bill.items.slice(startIdx, endIdx)
    const isLastPage = pageNum === totalPages - 1
    const emptyRows = ITEMS_PER_PAGE - pageItems.length
    
    pagesHTML += `
  <div class="invoice${pageNum > 0 ? ' page-break' : ''}">
    <div class="header">
      <div class="company-name">${settings.storeName}</div>
      <div class="company-address">
        ${settings.address}<br/>
        ${settings.phone ? `Phone: ${settings.phone}` : ''} ${settings.email ? `| Email: ${settings.email}` : ''}
      </div>
    </div>
    
    <div class="invoice-type">
      <div class="invoice-type-left">Debit Memo</div>
      <div class="invoice-type-center">TAX INVOICE</div>
      <div class="invoice-type-right">Original ${totalPages > 1 ? `(Page ${pageNum + 1}/${totalPages})` : ''}</div>
    </div>
    
    <div class="customer-section">
      <div class="customer-left">
        <div class="customer-label">M/s.: ${bill.customerName}</div>
        <div class="customer-info">
          ${bill.customerPhone ? `Phone: ${bill.customerPhone}<br/>` : ''}
          Place of Supply: ${settings.address || 'N/A'}<br/>
          GSTIN No.: ${settings.gst || 'N/A'}
        </div>
      </div>
      <div class="customer-right">
        <div class="invoice-details">
          <div class="detail-row">
            <div class="detail-label">Invoice No.</div>
            <div class="detail-value">: ${bill.billNo}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Date</div>
            <div class="detail-value">: ${new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
          </div>
        </div>
      </div>
    </div>
    
    <table class="items-table">
      <thead>
        <tr>
          <th class="sr-no">SrNo</th>
          <th class="product-name">Product Name</th>
          <th class="hsn">HSN/SAC</th>
          <th class="qty">Qty</th>
          <th class="rate">Rate</th>
          <th class="gst">IGST %</th>
          <th class="amount">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${pageItems.map((item, index) => {
          const itemGstRate = item.gstRate !== undefined ? item.gstRate : (bill.taxRate || 0)
          return `
          <tr>
            <td class="sr-no">${startIdx + index + 1}</td>
            <td class="product-name">${item.name}</td>
            <td class="hsn">${item.hsn || '-'}</td>
            <td class="qty">${item.quantity.toFixed(3)}</td>
            <td class="rate">${item.price.toFixed(2)}</td>
            <td class="gst">${bill.includeTax !== false ? itemGstRate.toFixed(2) : '0.00'}</td>
            <td class="amount">${item.total.toFixed(2)}</td>
          </tr>
        `}).join('')}
        ${isLastPage ? Array(emptyRows).fill(0).map(() => `
          <tr>
            <td class="sr-no">&nbsp;</td>
            <td class="product-name">&nbsp;</td>
            <td class="hsn">&nbsp;</td>
            <td class="qty">&nbsp;</td>
            <td class="rate">&nbsp;</td>
            <td class="gst">&nbsp;</td>
            <td class="amount">&nbsp;</td>
          </tr>
        `).join('') : ''}
      </tbody>
    </table>
    
    ${isLastPage ? `
    <div class="footer-section">
      <div class="footer-left">
        <div class="gst-row">
          <div class="gst-label">GSTIN No.: ${settings.gst || 'N/A'}</div>
        </div>
        <div class="amount-words">
          <strong>Total GST:</strong> ${convertToWords(bill.tax)}<br/>
          <strong>Bill Amount:</strong> ${convertToWords(bill.total)}
        </div>
        <div class="terms">
          <div class="terms-title">Terms & Condition:</div>
          ${settings.terms || '1. Goods once sold will not be taken back.<br/>2. Interest @18% p.a. will be charged if payment is not made within due date.<br/>3. Our risk and responsibility ceases as soon as the goods leave our premises.<br/>4. Subject to jurisdiction only.'}
        </div>
      </div>
      <div class="footer-right">
        <div class="total-section">
          <div class="total-row">
            <span>Sub Total</span>
            <span>${bill.subtotal.toFixed(2)}</span>
          </div>
          ${bill.discountAmount && bill.discountAmount > 0 ? `
          <div class="total-row">
            <span>Discount</span>
            <span>-${bill.discountAmount.toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="total-row">
            <span>Taxable Amount</span>
            <span>${(bill.subtotal - (bill.discountAmount || 0)).toFixed(2)}</span>
          </div>
          ${bill.tax > 0 ? `
          <div class="total-row">
            <span>Integrated Tax ${(bill.taxRate || 0).toFixed(2)}%</span>
            <span>${bill.tax.toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="total-row grand-total">
            <span>Grand Total</span>
            <span>₹${bill.total.toFixed(2)}</span>
          </div>
        </div>
        <div class="signature">
          For, ${settings.storeName}<br/>
          ${settings.signature ? `<img src="${settings.signature}" style="max-width: 150px; max-height: 50px; margin: 10px 0;" />` : '<br/><br/><br/>'}
          (Authorised Signatory)
        </div>
      </div>
    </div>
    ` : `
    <div style="text-align: right; padding: 15px; border-top: 2px solid #000; font-size: 11px; font-style: italic;">
      Continued on next page...
    </div>
    `}
  </div>
    `
  }
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${bill.billNo}</title>
  <style>
    @page { size: A4; margin: 20px; }
    @media print { 
      body { margin: 0; padding: 20px; } 
      .page-break { page-break-before: always; margin-top: 20px; } 
      .invoice { margin-bottom: 0; page-break-inside: avoid; }
      .invoice:last-child { page-break-after: avoid; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 20px; background: white; }
    .invoice { max-width: 900px; margin: 0 auto; border: 3px solid #000; margin-bottom: 20px; }
    .header { border-bottom: 2px solid #000; padding: 15px; text-align: center; }
    .company-name { font-size: 24px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase; }
    .company-address { font-size: 11px; line-height: 1.4; }
    .invoice-type { display: flex; justify-content: space-between; align-items: center; padding: 8px 15px; border-bottom: 2px solid #000; background: #f5f5f5; }
    .invoice-type-left { font-weight: bold; font-size: 12px; }
    .invoice-type-center { font-weight: bold; font-size: 16px; text-transform: uppercase; }
    .invoice-type-right { font-weight: bold; font-size: 12px; }
    .customer-section { display: flex; border-bottom: 2px solid #000; }
    .customer-left { flex: 1; padding: 15px; border-right: 2px solid #000; }
    .customer-right { width: 300px; padding: 15px; }
    .customer-label { font-weight: bold; font-size: 12px; margin-bottom: 8px; }
    .customer-info { font-size: 11px; line-height: 1.6; }
    .invoice-details { display: flex; flex-direction: column; gap: 8px; }
    .detail-row { display: flex; font-size: 11px; }
    .detail-label { width: 100px; font-weight: bold; }
    .detail-value { flex: 1; }
    .items-table { width: 100%; border-collapse: collapse; }
    .items-table th { background: #f5f5f5; border: 1px solid #000; padding: 8px; font-size: 11px; font-weight: bold; text-align: center; }
    .items-table td { border: 1px solid #000; padding: 8px; font-size: 11px; }
    .items-table .sr-no { width: 50px; text-align: center; }
    .items-table .product-name { text-align: left; }
    .items-table .hsn { width: 80px; text-align: center; }
    .items-table .qty { width: 80px; text-align: right; }
    .items-table .rate { width: 80px; text-align: right; }
    .items-table .gst { width: 70px; text-align: center; }
    .items-table .amount { width: 100px; text-align: right; }
    .footer-section { display: flex; border-top: 2px solid #000; }
    .footer-left { flex: 1; padding: 15px; border-right: 2px solid #000; }
    .footer-right { width: 300px; padding: 15px; }
    .gst-row { display: flex; justify-content: space-between; font-size: 11px; padding: 5px 0; border-bottom: 1px solid #ddd; }
    .gst-label { font-weight: bold; }
    .total-section { margin-top: 10px; }
    .total-row { display: flex; justify-content: space-between; font-size: 12px; padding: 5px 0; }
    .grand-total { font-weight: bold; font-size: 14px; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; }
    .amount-words { font-size: 11px; margin-top: 10px; font-style: italic; }
    .terms { font-size: 10px; line-height: 1.5; margin-top: 10px; }
    .terms-title { font-weight: bold; margin-bottom: 5px; }
    .signature { text-align: right; margin-top: 30px; font-size: 11px; }
  </style>
</head>
<body>
  ${pagesHTML}
</body>
</html>
  `
}

export function generateBillHTML(design: string, bill: BillData, settings: StoreSettings): string {
  switch (design) {
    case 'modern':
      return generateModernDesign(bill, settings)
    case 'elegant':
      return generateElegantDesign(bill, settings)
    case 'compact':
      return generateCompactDesign(bill, settings)
    case 'thermal':
      return generateThermalDesign(bill, settings)
    case 'taxinvoice':
      return generateTaxInvoiceDesign(bill, settings)
    case 'classic':
    default:
      return generateClassicDesign(bill, settings)
  }
}
