"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Receipt, Search, Eye, Pencil, MessageCircle, Download, X, Upload, FileDown, Trash2, Plus } from "lucide-react"
import { FeatureGuard } from "@/components/feature-guard"
import { showToast } from "@/lib/toast"
import { useLanguage } from "@/lib/language-context"

interface Bill {
  id: string
  billNo: string
  customerName: string
  customerPhone?: string
  items: any[]
  subtotal: number
  discount: number
  discountAmount: number
  tax: number
  total: number
  paymentMethod: string
  cashier: string
  storeName: string
  address: string
  phone: string
  email: string
  gst: string
  terms: string
  createdAt: string
}

export default function BillsPage() {
  const { t, language } = useLanguage()
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null)
  const [password, setPassword] = useState('')
  const [settings, setSettings] = useState<any>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 20
  const [selectedBills, setSelectedBills] = useState<string[]>([])
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false)
  const [customerDetails, setCustomerDetails] = useState<any>(null)
  const [customerFields, setCustomerFields] = useState<any[]>([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const recalcTotals = (form: any) => {
    const items = Array.isArray(form.items) ? form.items : []
    const subtotal = items.reduce((sum: number, it: any) => sum + ((parseFloat(it.price) || 0) * (parseInt(it.quantity) || 0)), 0)
    const discountAmount = parseFloat(form.discountAmount) || 0
    const tax = parseFloat(form.tax) || 0
    const total = subtotal - discountAmount + tax
    return { subtotal, discountAmount, tax, total }
  }

  const fetchBills = async (page = 1) => {
    try {
      const response = await fetch(`/api/pos/sales?page=${page}&limit=${itemsPerPage}&t=${Date.now()}`)
      if (response.ok) {
        const result = await response.json()
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages)
          setTotalItems(result.pagination.total)
          setBills(result.data || [])
        } else {
          setBills(result.data || result || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch bills:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  useEffect(() => {
    fetchBills(1)
    fetchSettings()
  }, [])

  useEffect(() => {
    fetchBills(currentPage)
  }, [currentPage])

  const filteredBills = bills.filter(bill =>
    bill.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bill.customerPhone && bill.customerPhone.includes(searchTerm))
  )

  const viewBill = async (bill: Bill) => {
    setSelectedBill(bill)
    
    // Fetch customer details if customer name exists
    if (bill.customerName && bill.customerName !== 'Walk-in Customer') {
      try {
        const [customerResponse, fieldsResponse] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/customer-fields')
        ])
        
        if (customerResponse.ok && fieldsResponse.ok) {
          const customers = await customerResponse.json()
          const fields = await fieldsResponse.json()
          
          // Find customer by name or phone
          const customer = customers.data?.find((c: any) => 
            c.name === bill.customerName || 
            (bill.customerPhone && c.phone === bill.customerPhone) ||
            Object.values(c).some(value => value === bill.customerName)
          )
          
          setCustomerDetails(customer || null)
          setCustomerFields(fields || [])
        }
      } catch (error) {
        console.error('Failed to fetch customer details:', error)
        setCustomerDetails(null)
        setCustomerFields([])
      }
    } else {
      setCustomerDetails(null)
      setCustomerFields([])
    }
    
    setIsViewModalOpen(true)
  }

  const openEditModal = (bill: Bill) => {
    setSelectedBill(bill)
    setEditForm({
      customerName: bill.customerName || '',
      customerPhone: bill.customerPhone || '',
      paymentMethod: bill.paymentMethod || 'cash',
      cashier: bill.cashier || 'Admin',
      terms: bill.terms || '',
      storeName: bill.storeName || '',
      address: bill.address || '',
      phone: bill.phone || '',
      email: bill.email || '',
      gst: bill.gst || '',
      items: bill.items.map(it => ({ ...it })),
      subtotal: bill.subtotal || 0,
      discount: bill.discount || 0,
      discountAmount: bill.discountAmount || 0,
      tax: bill.tax || 0,
      total: bill.total || 0
    })
    setIsEditModalOpen(true)
  }

  const saveBillEdits = async () => {
    if (!selectedBill) return
    try {
      const billId = (selectedBill as any)._id || selectedBill.id
      const response = await fetch(`/api/pos/sales/${billId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      if (response.ok) {
        setIsEditModalOpen(false)
        setSelectedBill(null)
        setEditForm({})
        showToast.success(`✅ ${t('billUpdated')}`)
        fetchBills(currentPage)
      } else {
        showToast.error(`❌ ${t('failedToUpdateBill')}`)
      }
    } catch (error) {
      showToast.error(`❌ ${t('errorUpdatingBill')}`)
    }
  }

  const handleDeleteBill = async () => {
    if (!billToDelete) return
    
    const correctPassword = settings.deletePassword || 'admin123'
    if (password !== correctPassword) {
      showToast.error(`❌ ${t('incorrectPassword')}`)
      return
    }
    
    try {
      const response = await fetch(`/api/pos/sales/${(billToDelete as any)._id || billToDelete.id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setBills(prevBills => prevBills.filter(b => {
          const billId = (b as any)._id || b.id
          const deleteId = (billToDelete as any)._id || billToDelete.id
          return billId !== deleteId
        }))
        setIsPasswordModalOpen(false)
        setPassword('')
        setBillToDelete(null)
        showToast.success(`✅ ${t('billDeletedSuccess')}`)
        fetchBills(currentPage)
      } else {
        showToast.error(`❌ ${t('failedToDeleteBill')}`)
      }
    } catch (error) {
      showToast.error(`❌ ${t('errorDeletingBill')}`)
    }
  }

  const handleBulkDelete = async () => {
    const correctPassword = settings.deletePassword || 'admin123'
    
    if (password !== correctPassword) {
      showToast.error(`❌ ${t('incorrectPassword')}`)
      return
    }

    try {
      let successCount = 0
      for (const billId of selectedBills) {
        const response = await fetch(`/api/pos/sales/${billId}`, { method: 'DELETE' })
        if (response.ok) successCount++
      }
      
      setIsPasswordModalOpen(false)
      setPassword('')
      setSelectedBills([])
      
      if (successCount > 0) {
        showToast.success(`✅ ${t('billsDeletedSuccess').replace('{0}', successCount.toString())}`)
        fetchBills(currentPage)
      } else {
        showToast.error(`❌ ${t('failedToDeleteBills')}`)
      }
    } catch (error) {
      console.error('Bulk delete error:', error)
      showToast.error(`❌ ${t('errorDeletingBills')}`)
    }
  }

  const sendBillViaWhatsApp = (bill: Bill) => {
    if (!bill.customerPhone) {
      showToast.error(t('customerPhoneRequired'))
      return
    }

    const addedText = settings.whatsappText || ''
    
    const storeName = settings.storeName || bill.storeName || 'Store'
    const storeAddress = settings.address || bill.address || 'Store Address'
    const storePhone = settings.phone || bill.phone || '9427300816'

    // Create receipt link based on settings
    const billFormat = settings.billFormat || 'professional'
    const receiptLink = billFormat === 'simple' 
      ? `${window.location.origin}/api/receipt-simple/${(bill as any)._id || bill.id}`
      : `${window.location.origin}/api/receipt/${(bill as any)._id || bill.id}`

    const billMessage = `*${storeName.toUpperCase()}*

*Bill No:* ${bill.billNo}
*Customer:* ${bill.customerName}
*Date:* ${new Date(bill.createdAt).toLocaleDateString('en-IN')}
*Time:* ${new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}

*ITEMS PURCHASED:*
${bill.items.map(item => `• ${item.name} x${item.quantity} = Rs${(item.total || 0).toFixed(2)}`).join('\n')}

*Subtotal:* Rs${(bill.subtotal || 0).toFixed(2)}
*Discount:* Rs${(bill.discount || 0).toFixed(2)}
*Tax:* Rs${(bill.tax || 0).toFixed(2)}
*TOTAL AMOUNT: Rs${(bill.total || 0).toFixed(2)}*
*Payment Method:* ${bill.paymentMethod}

*View Your Receipt:*
${receiptLink}

thanks for shopping

come again

${storeAddress}
Contact: ${storePhone}`
    
    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${bill.customerPhone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(billMessage)}`
    window.open(whatsappUrl, '_blank')
  }

  const exportBills = async () => {
    try {
      showToast.success(t('fetchingAllBills'))
      const response = await fetch('/api/pos/sales?limit=999999')
      if (!response.ok) {
        showToast.error(t('failedToFetchBills'))
        return
      }
      const result = await response.json()
      const allBills = result.data || result || []

      const csvData = allBills.map((bill: Bill) => ({
        'Bill No': bill.billNo,
        'Store Name': bill.storeName,
        'Customer Name': bill.customerName,
        'Customer Phone': bill.customerPhone || '',
        'Date': new Date(bill.createdAt).toLocaleDateString('en-IN'),
        'Time': new Date(bill.createdAt).toLocaleTimeString('en-IN'),
        'Items': bill.items.map(item => `${item.name} (Qty: ${item.quantity}, Price: ${item.price}, Total: ${item.total})`).join(' | '),
        'Subtotal': bill.subtotal,
        'Discount': bill.discountAmount,
        'Tax': bill.tax,
        'Total': bill.total,
        'Payment Method': bill.paymentMethod,
        'Cashier': bill.cashier,
        'Store Address': bill.address,
        'Store Phone': bill.phone,
        'Store Email': bill.email,
        'GST': bill.gst,
        'Terms': bill.terms
      }))

      const headers = Object.keys(csvData[0] || {})
      const csv = [
        headers.join(','),
        ...csvData.map((row: any) => headers.map(header => {
          const value = row[header]
          return `"${String(value).replace(/"/g, '""')}"`
        }).join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bills-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast.success(t('billsExportedSuccess').replace('{0}', allBills.length.toString()))
    } catch (error) {
      console.error('Export error:', error)
      showToast.error(t('failedToExportBills'))
    }
  }

  const importBills = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const csv = event.target?.result as string
        const lines = csv.split('\n').filter(line => line.trim())
        if (lines.length < 2) {
          showToast.error(t('csvFileEmpty'))
          return
        }

        // Parse CSV properly handling quoted fields
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = []
          let current = ''
          let inQuotes = false
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i]
            const nextChar = line[i + 1]
            
            if (char === '"' && nextChar === '"') {
              current += '"'
              i++
            } else if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
              result.push(current)
              current = ''
            } else {
              current += char
            }
          }
          result.push(current)
          return result
        }

        const headers = parseCSVLine(lines[0])
        const importedBills = []

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i])
          
          if (values.length < headers.length) continue

          const row: any = {}
          headers.forEach((header, index) => {
            row[header] = values[index] || ''
          })

          // Skip if Bill No is empty or invalid
          if (!row['Bill No'] || row['Bill No'].trim() === '') continue

          const items = row['Items'] ? row['Items'].split(' | ').map((itemStr: string) => {
            const match = itemStr.match(/(.+?)\s*\(Qty:\s*(\d+),\s*Price:\s*([\d.]+),\s*Total:\s*([\d.]+)\)/)
            if (match) {
              return {
                name: match[1].trim(),
                quantity: parseInt(match[2]),
                price: parseFloat(match[3]),
                total: parseFloat(match[4])
              }
            }
            return null
          }).filter(Boolean) : []

          importedBills.push({
            billNo: row['Bill No'],
            storeName: row['Store Name'] || 'Store',
            customerName: row['Customer Name'] || 'Walk-in Customer',
            customerPhone: row['Customer Phone'] || null,
            items: items,
            subtotal: parseFloat(row['Subtotal']) || 0,
            discount: 0,
            discountAmount: parseFloat(row['Discount']) || 0,
            tax: parseFloat(row['Tax']) || 0,
            total: parseFloat(row['Total']) || 0,
            paymentMethod: row['Payment Method'] || 'cash',
            cashier: row['Cashier'] || 'Admin',
            address: row['Store Address'] || '',
            phone: row['Store Phone'] || '',
            email: row['Store Email'] || '',
            gst: row['GST'] || '',
            terms: row['Terms'] || ''
          })
        }

        if (importedBills.length === 0) {
          showToast.error(t('noValidBillsInCSV'))
          return
        }

        const response = await fetch('/api/pos/sales/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bills: importedBills })
        })

        if (response.ok) {
          showToast.success(t('billsImportedSuccess').replace('{0}', importedBills.length.toString()))
          fetchBills(currentPage)
        } else {
          const error = await response.json()
          showToast.error(error.error || t('failedToImportBills'))
        }
      } catch (error) {
        console.error('Import error:', error)
        showToast.error(t('errorImportingBills'))
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const generateBillPDF = (bill: Bill) => {
    const storeName = settings.storeName || bill.storeName || 'Store'
    const storeAddress = settings.address || bill.address || 'Store Address'
    const storePhone = settings.phone || bill.phone || '9427300816'
    
    // Create a canvas to generate PDF content
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      canvas.width = 400
      canvas.height = 600
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Add content to canvas
      ctx.fillStyle = 'black'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(storeName.toUpperCase(), 200, 30)
      
      ctx.font = '12px Arial'
      ctx.fillText(storeAddress, 200, 50)
      ctx.fillText(`Phone: ${storePhone}`, 200, 70)
      
      // Bill details
      ctx.textAlign = 'left'
      ctx.font = 'bold 14px Arial'
      ctx.fillText(`Bill No: ${bill.billNo}`, 20, 110)
      ctx.fillText(`Customer: ${bill.customerName}`, 20, 130)
      ctx.fillText(`Date: ${new Date(bill.createdAt).toLocaleDateString('en-IN')}`, 20, 150)
      
      // Items
      let yPos = 180
      ctx.fillText('ITEMS:', 20, yPos)
      yPos += 20
      
      bill.items.forEach(item => {
        ctx.font = '12px Arial'
        ctx.fillText(`${item.name} x${item.quantity} = ₹${(item.total || 0).toFixed(2)}`, 20, yPos)
        yPos += 20
      })
      
      // Total
      yPos += 20
      ctx.font = 'bold 14px Arial'
      ctx.fillText(`TOTAL AMOUNT: ₹${(bill.total || 0).toFixed(2)}`, 20, yPos)
      yPos += 20
      ctx.font = '12px Arial'
      ctx.fillText(`Payment: ${bill.paymentMethod}`, 20, yPos)
      
      // Footer
      yPos += 40
      ctx.textAlign = 'center'
      ctx.fillText('Thank you for your business!', 200, yPos)
      ctx.fillText(`Contact: ${storePhone}`, 200, yPos + 20)
      
      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `Bill-${bill.billNo}.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
      })
    }
  }

  if (loading) {
    return (
      <MainLayout title={t('billHistory')}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('loading')}</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title={t('billHistory')}>
      <FeatureGuard feature="bills">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Receipt className="w-5 h-5" />
                <span>{t('allBills')} ({bills.length})</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                {selectedBills.length > 0 && (
                  <Button 
                    onClick={() => {
                      setBillToDelete(null)
                      setIsPasswordModalOpen(true)
                    }} 
                    variant="destructive" 
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('delete')} ({selectedBills.length})
                  </Button>
                )}
                <Button 
                  onClick={() => setIsClearAllModalOpen(true)}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('clearAll')}
                </Button>
                <Button onClick={exportBills} variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  {t('export')}
                </Button>
                <Button onClick={() => document.getElementById('import-bills')?.click()} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  {t('importCSV')}
                </Button>
                <input
                  id="import-bills"
                  type="file"
                  accept=".csv"
                  onChange={importBills}
                  className="hidden"
                />
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t('searchBillsPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredBills.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">{t('noBillsFound')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {bills.length === 0 ? t('noBillsGenerated') : t('tryAdjustingSearchFilters')}
                </p>
                <Button onClick={() => window.location.href = '/tenant/pos'}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('createFirstBill')}
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center w-12">
                      <input
                        type="checkbox"
                        checked={selectedBills.length === filteredBills.length && filteredBills.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBills(filteredBills.map(b => (b as any)._id || b.id))
                          } else {
                            setSelectedBills([])
                          }
                        }}
                        className="cursor-pointer"
                      />
                    </TableHead>
                    <TableHead className="text-center w-16">{t('srNo')}</TableHead>
                    <TableHead className="text-center">{t('billNo')}</TableHead>
                    <TableHead className="text-center">{t('customer')}</TableHead>
                    <TableHead className="text-center">{t('items')}</TableHead>
                    <TableHead className="text-center">{t('gstRate')}</TableHead>
                    <TableHead className="text-center">{t('gstAmount')}</TableHead>
                    <TableHead className="text-center">{t('total')}</TableHead>
                    <TableHead className="text-center">{t('payment')}</TableHead>
                    <TableHead className="text-center">{t('date')}</TableHead>
                    <TableHead className="text-center">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.map((bill, index) => {
                    const billId = (bill as any)._id || bill.id
                    return (
                    <TableRow key={bill.id}>
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          checked={selectedBills.includes(billId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBills([...selectedBills, billId])
                            } else {
                              setSelectedBills(selectedBills.filter(id => id !== billId))
                            }
                          }}
                          className="cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {((currentPage - 1) * itemsPerPage) + index + 1}
                      </TableCell>
                      <TableCell className="font-medium text-center">{bill.billNo}</TableCell>
                      <TableCell className="text-center">
                        <div>
                          <div>{bill.customerName}</div>
                          {bill.customerPhone && (
                            <div className="text-sm text-muted-foreground">{bill.customerPhone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{bill.items.length} {t('items')}</TableCell>
                      <TableCell className="text-center">{typeof (bill as any).taxBreakup?.gstRate === 'number' ? ((bill as any).taxBreakup.gstRate || 0) + '%' : ((bill as any).taxRate || 0) + '%'}
                      </TableCell>
                      <TableCell className="text-center">₹  {(((bill as any).includeTax === false) ? 0 : ((bill as any).tax ?? (bill as any).taxBreakup?.gstAmount ?? 0)).toFixed(2)}</TableCell>
                      <TableCell className="text-center">₹  {(bill.total || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{bill.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {new Date(bill.createdAt).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => viewBill(bill)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditModal(bill)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={async () => {
                              try {
                                const response = await fetch('/api/bill-pdf-custom', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ billData: bill })
                                })
                                
                                if (response.ok) {
                                  const html = await response.text()
                                  const blob = new Blob([html], { type: 'text/html' })
                                  const url = URL.createObjectURL(blob)
                                  const a = document.createElement('a')
                                  a.href = url
                                  a.download = `Bill-${bill.billNo}.html`
                                  document.body.appendChild(a)
                                  a.click()
                                  document.body.removeChild(a)
                                  URL.revokeObjectURL(url)
                                } else {
                                  showToast.error(t('failedToGenerateBill'))
                                }
                              } catch (error) {
                                showToast.error(t('errorGeneratingBill'))
                              }
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          {bill.customerPhone && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => sendBillViaWhatsApp(bill)}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => {
                              setBillToDelete(bill)
                              setIsPasswordModalOpen(true)
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  {t('showing')} {((currentPage - 1) * itemsPerPage) + 1} {t('to')} {Math.min(currentPage * itemsPerPage, totalItems)} {t('of')} {totalItems} {t('bills')}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    {t('previous')}
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => 
                        page === 1 || 
                        page === totalPages || 
                        Math.abs(page - currentPage) <= 1
                      )
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        </div>
                      ))
                    }
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    {t('next')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clear All Confirmation Modal */}
        <Dialog open={isClearAllModalOpen} onOpenChange={setIsClearAllModalOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                <span>{t('clearAllBills')}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('confirmClearAllBills')}
              </p>
              <div className="space-y-2">
                <Label htmlFor="clearAllPassword">{t('password')}</Label>
                <Input
                  id="clearAllPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('enterPassword')}
                  autoComplete="new-password"
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setIsClearAllModalOpen(false)
                    setPassword('')
                  }}
                >
                  {t('cancel')}
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={async () => {
                    const correctPassword = settings.deletePassword || 'admin123'
                    if (password !== correctPassword) {
                      showToast.error(`❌ ${t('incorrectPassword')}`)
                      return
                    }
                    try {
                      const response = await fetch('/api/pos/sales/clear', { method: 'DELETE' })
                      if (response.ok) {
                        setIsClearAllModalOpen(false)
                        setPassword('')
                        showToast.success(`✅ ${t('allBillsDeletedSuccess')}`)
                        fetchBills(1)
                        setSelectedBills([])
                      } else {
                        showToast.error(`❌ ${t('failedToClearBills')}`)
                      }
                    } catch (error) {
                      showToast.error(`❌ ${t('errorClearingBills')}`)
                    }
                  }}
                >
                  {t('deleteAllBills')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Password Modal */}
        <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <X className="w-5 h-5 text-red-500" />
                <span>{t('deleteBill')}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {billToDelete ? (
                  <>{t('enterPasswordToDelete')} <strong>{billToDelete.billNo}</strong></>
                ) : (
                  <>{t('enterPasswordToDeleteBills').replace('{0}', selectedBills.length.toString())}</>
                )}
              </p>
              <div className="space-y-2">
                <Label htmlFor="deletePassword">{t('password')}</Label>
                <Input
                  id="deletePassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('enterPassword')}
                  autoComplete="new-password"
                  autoFocus={false}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleDeleteBill()
                    }
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyUp={(e) => e.stopPropagation()}
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setIsPasswordModalOpen(false)
                    setPassword('')
                    setBillToDelete(null)
                    setSelectedBills([])
                  }}
                >
                  {t('cancel')}
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => {
                    if (billToDelete) {
                      handleDeleteBill()
                    } else if (selectedBills.length > 0) {
                      handleBulkDelete()
                    }
                  }}
                >
                  {t('delete')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Bill Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-none max-h-[90vh] flex flex-col" style={{width: '90vw'}}>
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>{t('billDetails')} - {selectedBill?.billNo}</DialogTitle>
            </DialogHeader>
            {selectedBill && (
              <div className="flex-1 overflow-y-auto py-4 space-y-6 scrollbar-hide">
                {/* Company Details */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-bold text-lg text-center mb-2">{settings.storeName || selectedBill.storeName}</h3>
                  <div className="text-center space-y-1 text-sm">
                    <p>{settings.address || selectedBill.address}</p>
                    <p>{t('phone')}: {settings.phone || selectedBill.phone}</p>
                    <p>{t('email')}: {settings.email || selectedBill.email}</p>
                    {(settings.gst || selectedBill.gst) && <p>GST: {settings.gst || selectedBill.gst}</p>}
                  </div>
                </div>

                {/* Bill Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{t('billNo')}:</span>
                      <span>{selectedBill.billNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">{t('date')}:</span>
                      <span>{new Date(selectedBill.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">{t('time')}:</span>
                      <span>{new Date(selectedBill.createdAt).toLocaleTimeString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{t('cashier')}:</span>
                      <span>{selectedBill.cashier || 'Admin'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">{t('payment')}:</span>
                      <span className="capitalize">{selectedBill.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-bold mb-3">{t('customerDetails')}</h4>
                  {customerDetails ? (
                    <div className="space-y-2">
                      {customerFields.map((field) => {
                        const value = customerDetails[field.name]
                        if (!value) return null
                        return (
                          <div key={field.name} className="flex justify-between text-sm">
                            <span className="font-medium">{field.label}:</span>
                            <span>{value}</span>
                          </div>
                        )
                      })}
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Customer Since:</span>
                        <span>{new Date(customerDetails.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Name:</span>
                        <span>{selectedBill.customerName}</span>
                      </div>
                      {selectedBill.customerPhone && (
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Phone:</span>
                          <span>{selectedBill.customerPhone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-bold mb-3">{t('items')} ({selectedBill.items.length})</h4>
                  <div className="space-y-2">
                    {selectedBill.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Qty: {item.quantity} × ₹{(item.price || 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="font-medium">₹{(item.total || 0).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>{t('subtotal')}:</span>
                    <span>₹{(selectedBill.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {selectedBill.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{t('discount')}:</span>
                      <span>-₹{(selectedBill.discountAmount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {selectedBill.tax > 0 && (
                    <div className="flex justify-between">
                      <span>{t('tax')}:</span>
                      <span>₹{(selectedBill.tax || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>{t('total')}:</span>
                      <span>₹{(selectedBill.total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                {(settings.terms || selectedBill.terms) && (
                  <div className="text-xs text-muted-foreground p-3 bg-gray-50 rounded">
                    <div className="font-medium mb-1">{t('termsConditions')}:</div>
                    <div>{settings.terms || selectedBill.terms}</div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button 
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/bill-pdf-custom', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ billData: selectedBill })
                        })
                        
                        if (response.ok) {
                          const html = await response.text()
                          const blob = new Blob([html], { type: 'text/html' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `Bill-${selectedBill.billNo}.html`
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                          URL.revokeObjectURL(url)
                        } else {
                          showToast.error(t('failedToGenerateBill'))
                        }
                      } catch (error) {
                        showToast.error(t('errorGeneratingBill'))
                      }
                    }}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('downloadPDF')}
                  </Button>
                  {selectedBill.customerPhone && (
                    <Button 
                      onClick={() => sendBillViaWhatsApp(selectedBill)}
                      variant="outline"
                      className="flex-1"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {t('sendWhatsApp')}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Bill Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('editBill')} - {selectedBill?.billNo}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input
                    value={editForm.customerName || ''}
                    onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Customer Phone</Label>
                  <Input
                    value={editForm.customerPhone || ''}
                    onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Input
                    value={editForm.paymentMethod || ''}
                    onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cashier</Label>
                  <Input
                    value={editForm.cashier || ''}
                    onChange={(e) => setEditForm({ ...editForm, cashier: e.target.value })}
                  />
                </div>
              </div>
              <div className="border rounded p-3 space-y-3">
                <div className="font-medium">Items</div>
                <div className="space-y-2">
                  {(editForm.items || []).map((it: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <Input
                          value={it.name || ''}
                          onChange={(e) => {
                            const items = [...editForm.items]
                            items[idx] = { ...items[idx], name: e.target.value }
                            setEditForm({ ...editForm, items })
                          }}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={it.quantity || 0}
                          onChange={(e) => {
                            const qty = Math.max(0, parseInt(e.target.value || '0'))
                            const items = [...editForm.items]
                            const price = parseFloat(items[idx].price) || 0
                            items[idx] = { ...items[idx], quantity: qty, total: qty * price }
                            const totals = recalcTotals({ ...editForm, items })
                            setEditForm({ ...editForm, items, ...totals })
                          }}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={it.price || 0}
                          onChange={(e) => {
                            const price = Math.max(0, parseFloat(e.target.value || '0'))
                            const items = [...editForm.items]
                            const qty = parseInt(items[idx].quantity) || 0
                            items[idx] = { ...items[idx], price, total: qty * price }
                            const totals = recalcTotals({ ...editForm, items })
                            setEditForm({ ...editForm, items, ...totals })
                          }}
                        />
                      </div>
                      <div className="col-span-2 text-right">
                        ₹{(((parseFloat(it.price) || 0) * (parseInt(it.quantity) || 0)) || 0).toFixed(2)}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          variant="ghost"
                          className="text-red-500"
                          onClick={() => {
                            const items = (editForm.items || []).filter((_: any, i: number) => i !== idx)
                            const totals = recalcTotals({ ...editForm, items })
                            setEditForm({ ...editForm, items, ...totals })
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subtotal</Label>
                  <Input
                    type="number"
                    value={editForm.subtotal || 0}
                    onChange={(e) => {
                      const subtotal = parseFloat(e.target.value || '0')
                      const total = subtotal - (parseFloat(editForm.discountAmount) || 0) + (parseFloat(editForm.tax) || 0)
                      setEditForm({ ...editForm, subtotal, total })
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount Amount</Label>
                  <Input
                    type="number"
                    value={editForm.discountAmount || 0}
                    onChange={(e) => {
                      const discountAmount = parseFloat(e.target.value || '0')
                      const total = (parseFloat(editForm.subtotal) || 0) - discountAmount + (parseFloat(editForm.tax) || 0)
                      setEditForm({ ...editForm, discountAmount, total })
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tax</Label>
                  <Input
                    type="number"
                    value={editForm.tax || 0}
                    onChange={(e) => {
                      const tax = parseFloat(e.target.value || '0')
                      const total = (parseFloat(editForm.subtotal) || 0) - (parseFloat(editForm.discountAmount) || 0) + tax
                      setEditForm({ ...editForm, tax, total })
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total</Label>
                  <Input
                    type="number"
                    value={editForm.total || 0}
                    onChange={(e) => setEditForm({ ...editForm, total: parseFloat(e.target.value || '0') })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Store Name</Label>
                  <Input
                    value={editForm.storeName || ''}
                    onChange={(e) => setEditForm({ ...editForm, storeName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>GST</Label>
                  <Input
                    value={editForm.gst || ''}
                    onChange={(e) => setEditForm({ ...editForm, gst: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={editForm.address || ''}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Terms</Label>
                <Input
                  value={editForm.terms || ''}
                  onChange={(e) => setEditForm({ ...editForm, terms: e.target.value })}
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsEditModalOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button className="flex-1" onClick={saveBillEdits}>
                  {t('updateBill')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      </FeatureGuard>
    </MainLayout>
  )
}
