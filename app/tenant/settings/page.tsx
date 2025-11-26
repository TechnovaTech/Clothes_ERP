"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Store, Percent, Eye, EyeOff, Image, Palette, FileText } from "lucide-react"
import { FeatureGuard } from "@/components/feature-guard"
import { showToast } from "@/lib/toast"
import { useLanguage } from "@/lib/language-context"




interface BusinessType {
  id: string
  _id?: string
  name: string
  description: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    storeName: '',
    address: '',
    phone: '',
    email: '',
    gst: '',
    taxRate: 0,
    cessRate: 0,
    gstRate: 18,
    terms: '',
    billPrefix: 'BILL',
    billCounter: 1,
    whatsappMessage: '',
    deletePassword: '',
    discountMode: false,
    billFormat: 'professional',
    businessType: 'none',
    logo: '',
    signature: '',
    billDesign: 'classic'
  })
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const { t } = useLanguage()

  const fetchSettings = async () => {
    try {
      const [settingsResponse, businessTypesResponse, tenantResponse] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/business-types'),
        fetch('/api/tenant-features')
      ])
      
      if (settingsResponse.ok) {
        const data = await settingsResponse.json()
        console.log('Settings data:', data)
        setSettings(data)
      }
      
      if (businessTypesResponse.ok) {
        const businessTypesResult = await businessTypesResponse.json()
        const businessTypesData = businessTypesResult.data || businessTypesResult
        console.log('Business types data:', businessTypesData)
        setBusinessTypes(Array.isArray(businessTypesData) ? businessTypesData : [])
      } else {
        console.log('Business types response not ok:', businessTypesResponse.status)
        setBusinessTypes([])
      }
      
      if (tenantResponse.ok) {
        const tenantData = await tenantResponse.json()
        console.log('Tenant features data:', tenantData)
        if (tenantData.businessType) {
          setSettings(prev => ({ ...prev, businessType: tenantData.businessType }))
        }
      } else {
        console.log('Tenant response not ok:', tenantResponse.status)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      setBusinessTypes([])
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (response.ok) {
        const updatedSettings = await response.json()
        setSettings(updatedSettings)
        showToast.success(t('saveSuccess'))
      } else {
        showToast.error(t('saveError'))
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      showToast.error(t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  if (loading) {
    return (
      <MainLayout title={t('settings')}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('loading')}</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title={t('settings')}>
      <FeatureGuard feature="settings">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Image className="w-5 h-5" />
              <span>Logo & Signature</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="logo">Store Logo</Label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    className="cursor-pointer"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (event) => {
                          const base64 = event.target?.result as string
                          setSettings({...settings, logo: base64})
                          showToast.success('Logo uploaded successfully!')
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                  {settings.logo && (
                    <div className="mt-3 text-center">
                      <img src={settings.logo} alt="Logo" className="max-h-24 mx-auto border rounded shadow-sm" />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setSettings({...settings, logo: ''})}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="signature">Signature</Label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <Input
                    id="signature"
                    type="file"
                    accept="image/*"
                    className="cursor-pointer"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (event) => {
                          const base64 = event.target?.result as string
                          setSettings({...settings, signature: base64})
                          showToast.success('Signature uploaded successfully!')
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                  {settings.signature && (
                    <div className="mt-3 text-center">
                      <img src={settings.signature} alt="Signature" className="max-h-24 mx-auto border rounded shadow-sm" />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setSettings({...settings, signature: ''})}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Store className="w-5 h-5" />
              <span>{t('settings')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">{t('storeName')}</Label>
              <Input
                id="storeName"
                value={settings.storeName}
                onChange={(e) => setSettings({...settings, storeName: e.target.value})}
                placeholder={t('storeName')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">{t('storeAddress')}</Label>
              <Input
                id="address"
                value={settings.address}
                onChange={(e) => setSettings({...settings, address: e.target.value})}
                placeholder={t('storeAddress')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t('phoneNumber')}</Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => setSettings({...settings, phone: e.target.value})}
                  placeholder={t('enterPhoneNumber')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  value={settings.email}
                  onChange={(e) => setSettings({...settings, email: e.target.value})}
                  placeholder={t('enterEmail')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gst">{t('gstNumber')}</Label>
              <Input
                id="gst"
                value={settings.gst}
                onChange={(e) => setSettings({...settings, gst: e.target.value})}
                placeholder={t('enterGstNumber')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billPrefix">{t('billPrefix')}</Label>
                <Input
                  id="billPrefix"
                  value={settings.billPrefix}
                  onChange={(e) => setSettings({...settings, billPrefix: e.target.value})}
                  placeholder={t('enterBillPrefix')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billCounter">{t('nextBillNumber')}</Label>
                <Input
                  id="billCounter"
                  type="number"
                  value={settings.billCounter}
                  onChange={(e) => setSettings({...settings, billCounter: parseInt(e.target.value) || 1})}
                  placeholder="001"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="terms">{t('termsConditions')}</Label>
              <textarea
                id="terms"
                value={settings.terms}
                onChange={(e) => setSettings({...settings, terms: e.target.value})}
                placeholder={t('enterTermsConditions')}
                className="w-full p-2 border rounded-md h-20 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsappMessage">{t('customWhatsappMessage')}</Label>
              <textarea
                id="whatsappMessage"
                value={settings.whatsappMessage}
                onChange={(e) => setSettings({...settings, whatsappMessage: e.target.value})}
                placeholder={t('customMessageAfterThankYou')}
                className="w-full p-2 border rounded-md h-16 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billFormat">{t('billFormat')}</Label>
              <select
                id="billFormat"
                value={settings.billFormat}
                onChange={(e) => setSettings({...settings, billFormat: e.target.value})}
                className="w-full p-2 border rounded-md"
              >
                <option value="professional">{t('professionalInvoiceFormat')}</option>
                <option value="simple">{t('simpleReceiptFormat')}</option>
              </select>
              <p className="text-sm text-muted-foreground">
                {t('chooseBillFormat')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessType">{t('businessTypeAssigned')}</Label>
              <Input
                id="businessType"
                value={(() => {
                  if (!settings.businessType || settings.businessType === 'none') {
                    return t('noTemplateAssigned') || 'No Template Assigned'
                  }
                  if (!Array.isArray(businessTypes) || businessTypes.length === 0) {
                    return 'Loading...'
                  }
                  const businessType = businessTypes.find(bt => 
                    bt.id === settings.businessType || 
                    bt._id === settings.businessType ||
                    bt.id === settings.businessType.toString() ||
                    bt._id?.toString() === settings.businessType
                  )
                  return businessType?.name || `Unknown (ID: ${settings.businessType})`
                })()}
                readOnly
                className="w-full p-2 border rounded-md bg-gray-50 cursor-not-allowed"
              />
              <p className="text-sm text-muted-foreground">
                {t('businessTypeCannotChange') || 'Business type is assigned by super admin and cannot be changed'}
              </p>
              {settings.businessType && settings.businessType !== 'none' && Array.isArray(businessTypes) && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  {(() => {
                    const businessType = businessTypes.find(bt => 
                      bt.id === settings.businessType || 
                      bt._id === settings.businessType ||
                      bt.id === settings.businessType.toString() ||
                      bt._id?.toString() === settings.businessType
                    )
                    return businessType?.description || 'No description available'
                  })()}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="deletePassword">{t('deletePassword')}</Label>
              <div className="relative">
                <Input
                  id="deletePassword"
                  type={showPassword ? "text" : "password"}
                  value={settings.deletePassword || ''}
                  onChange={(e) => setSettings({...settings, deletePassword: e.target.value})}
                  placeholder={t('setPasswordForDeleting')}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>



        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="w-5 h-5" />
              <span>Bill Design</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="billDesign">Select Bill Design</Label>
              <select
                id="billDesign"
                value={settings.billDesign || 'classic'}
                onChange={(e) => setSettings({...settings, billDesign: e.target.value})}
                className="w-full p-2 border rounded-md"
              >
                <option value="classic">Classic Invoice</option>
                <option value="modern">Modern Minimal</option>
                <option value="elegant">Elegant Professional</option>
                <option value="compact">Compact Receipt</option>
                <option value="taxinvoice">Professional Tax Invoice</option>
                <option value="thermal">Thermal Receipt (Original)</option>
              </select>
              <p className="text-sm text-muted-foreground">
                Choose a design template for your bills and invoices
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                settings.billDesign === 'classic' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`} onClick={() => setSettings({...settings, billDesign: 'classic'})}>
                <div className="font-medium mb-1">Classic Invoice</div>
                <div className="text-xs text-muted-foreground">Traditional layout with header and itemized list</div>
              </div>
              <div className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                settings.billDesign === 'modern' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`} onClick={() => setSettings({...settings, billDesign: 'modern'})}>
                <div className="font-medium mb-1">Modern Minimal</div>
                <div className="text-xs text-muted-foreground">Clean and minimal design with focus on content</div>
              </div>
              <div className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                settings.billDesign === 'elegant' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`} onClick={() => setSettings({...settings, billDesign: 'elegant'})}>
                <div className="font-medium mb-1">Elegant Professional</div>
                <div className="text-xs text-muted-foreground">Sophisticated design with elegant typography</div>
              </div>
              <div className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                settings.billDesign === 'compact' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`} onClick={() => setSettings({...settings, billDesign: 'compact'})}>
                <div className="font-medium mb-1">Compact Receipt</div>
                <div className="text-xs text-muted-foreground">Space-efficient thermal printer style</div>
              </div>
              <div className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                settings.billDesign === 'taxinvoice' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`} onClick={() => setSettings({...settings, billDesign: 'taxinvoice'})}>
                <div className="font-medium mb-1">Professional Tax Invoice</div>
                <div className="text-xs text-muted-foreground">Formal tax invoice with GST details and table layout</div>
              </div>
              <div className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                settings.billDesign === 'thermal' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`} onClick={() => setSettings({...settings, billDesign: 'thermal'})}>
                <div className="font-medium mb-1">Thermal Receipt</div>
                <div className="text-xs text-muted-foreground">Original thermal printer format with auto-print</div>
              </div>
            </div>
            <Button 
              onClick={() => setShowPreview(true)} 
              variant="outline" 
              className="w-full mt-4"
            >
              <FileText className="w-4 h-4 mr-2" />
              Preview Design
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Percent className="w-5 h-5" />
              <span>{t('taxPricingSettings')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">{t('taxRate')}</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={settings.taxRate}
                    onChange={(e) => setSettings({...settings, taxRate: parseFloat(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cessRate">CESS Rate (%)</Label>
                  <Input
                    id="cessRate"
                    type="number"
                    value={settings.cessRate}
                    onChange={(e) => setSettings({...settings, cessRate: parseFloat(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="discountMode"
                    checked={settings.discountMode}
                    onChange={(e) => setSettings({...settings, discountMode: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="discountMode" className="cursor-pointer">
                    {t('enableTextMinusMode')}
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('textMinusModeDescription')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={saveSettings} disabled={saving} className="w-full">
          <Settings className="w-4 h-4 mr-2" />
          {saving ? t('loading') : t('save')}
        </Button>
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Bill Preview - {settings.billDesign === 'classic' ? 'Classic' : settings.billDesign === 'modern' ? 'Modern' : settings.billDesign === 'elegant' ? 'Elegant' : settings.billDesign === 'thermal' ? 'Thermal' : settings.billDesign === 'taxinvoice' ? 'Tax Invoice' : 'Compact'}</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>✕</Button>
            </div>
            <div className="p-4 overflow-y-auto" style={{maxHeight: 'calc(90vh - 80px)'}}>
              <iframe srcDoc={generatePreview()} className="w-full border-0" style={{height: '800px'}} title="Preview" />
            </div>
          </div>
        </div>
      )}
      </FeatureGuard>
    </MainLayout>
  )

  function generatePreview() {
    const sample = {
      billNo: 'BILL-001',
      customerName: 'Sample Customer',
      customerPhone: '+91 9876543210',
      items: [{name: 'Product 1', quantity: 2, price: 500, total: 1000}, {name: 'Product 2', quantity: 1, price: 750, total: 750}],
      subtotal: 1750,
      discountAmount: 100,
      tax: 297,
      total: 1947
    }
    const d = settings.billDesign || 'classic'
    const store = settings.storeName || 'Store Name'
    const addr = settings.address || 'Store Address'
    const ph = settings.phone || '0000000000'
    const em = settings.email || 'email@store.com'
    const gst = settings.gst || 'GSTIN'
    const logo = settings.logo
    
    if (d === 'taxinvoice') {
      return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:20px;background:#fff}.invoice{max-width:900px;margin:0 auto;border:3px solid #000}.header{border-bottom:2px solid #000;padding:15px;text-align:center}.company-name{font-size:24px;font-weight:700;margin-bottom:8px;text-transform:uppercase}.company-address{font-size:11px;line-height:1.4}.invoice-type{display:flex;justify-content:space-between;align-items:center;padding:8px 15px;border-bottom:2px solid #000;background:#f5f5f5}.invoice-type-left{font-weight:700;font-size:12px}.invoice-type-center{font-weight:700;font-size:16px;text-transform:uppercase}.invoice-type-right{font-weight:700;font-size:12px}.customer-section{display:flex;border-bottom:2px solid #000}.customer-left{flex:1;padding:15px;border-right:2px solid #000}.customer-right{width:300px;padding:15px}.customer-label{font-weight:700;font-size:12px;margin-bottom:8px}.customer-info{font-size:11px;line-height:1.6}.invoice-details{display:flex;flex-direction:column;gap:8px}.detail-row{display:flex;font-size:11px}.detail-label{width:100px;font-weight:700}.detail-value{flex:1}.items-table{width:100%;border-collapse:collapse}.items-table th{background:#f5f5f5;border:1px solid #000;padding:8px;font-size:11px;font-weight:700;text-align:center}.items-table td{border:1px solid #000;padding:8px;font-size:11px}.items-table .sr-no{width:50px;text-align:center}.items-table .product-name{text-align:left}.items-table .hsn{width:80px;text-align:center}.items-table .qty{width:80px;text-align:right}.items-table .rate{width:80px;text-align:right}.items-table .gst{width:70px;text-align:center}.items-table .amount{width:100px;text-align:right}.footer-section{display:flex;border-top:2px solid #000}.footer-left{flex:1;padding:15px;border-right:2px solid #000}.footer-right{width:300px;padding:15px}.gst-row{display:flex;justify-content:space-between;font-size:11px;padding:5px 0;border-bottom:1px solid #ddd}.gst-label{font-weight:700}.total-section{margin-top:10px}.total-row{display:flex;justify-content:space-between;font-size:12px;padding:5px 0}.grand-total{font-weight:700;font-size:14px;border-top:2px solid #000;padding-top:8px;margin-top:8px}.amount-words{font-size:11px;margin-top:10px;font-style:italic}.terms{font-size:10px;line-height:1.5;margin-top:10px}.terms-title{font-weight:700;margin-bottom:5px}.signature{text-align:right;margin-top:30px;font-size:11px}</style></head><body><div class="invoice"><div class="header"><div class="company-name">${store}</div><div class="company-address">${addr}<br/>${ph?`Phone: ${ph}`:''} ${em?`| Email: ${em}`:''}</div></div><div class="invoice-type"><div class="invoice-type-left">Debit Memo</div><div class="invoice-type-center">TAX INVOICE</div><div class="invoice-type-right">Original</div></div><div class="customer-section"><div class="customer-left"><div class="customer-label">M/s.: ${sample.customerName}</div><div class="customer-info">${sample.customerPhone?`Phone: ${sample.customerPhone}<br/>`:''} Place of Supply: ${addr||'N/A'}<br/>GSTIN No.: ${gst||'N/A'}</div></div><div class="customer-right"><div class="invoice-details"><div class="detail-row"><div class="detail-label">Invoice No.</div><div class="detail-value">: ${sample.billNo}</div></div><div class="detail-row"><div class="detail-label">Date</div><div class="detail-value">: ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'2-digit',year:'numeric'})}</div></div></div></div></div><table class="items-table"><thead><tr><th class="sr-no">SrNo</th><th class="product-name">Product Name</th><th class="hsn">HSN/SAC</th><th class="qty">Qty</th><th class="rate">Rate</th><th class="gst">IGST %</th><th class="amount">Amount</th></tr></thead><tbody>${sample.items.map((it,i)=>`<tr><td class="sr-no">${i+1}</td><td class="product-name">${it.name}</td><td class="hsn">-</td><td class="qty">${it.quantity.toFixed(3)}</td><td class="rate">${it.price.toFixed(2)}</td><td class="gst">18.00</td><td class="amount">${it.total.toFixed(2)}</td></tr>`).join('')}${Array(15-sample.items.length).fill(0).map(()=>'<tr><td class="sr-no">&nbsp;</td><td class="product-name">&nbsp;</td><td class="hsn">&nbsp;</td><td class="qty">&nbsp;</td><td class="rate">&nbsp;</td><td class="gst">&nbsp;</td><td class="amount">&nbsp;</td></tr>').join('')}</tbody></table><div class="footer-section"><div class="footer-left"><div class="gst-row"><div class="gst-label">GSTIN No.: ${gst||'N/A'}</div></div><div class="amount-words"><strong>Total GST:</strong> (In Words)<br/><strong>Bill Amount:</strong> (In Words)</div><div class="terms"><div class="terms-title">Terms & Condition:</div>${settings.terms||'1. Goods once sold will not be taken back.<br/>2. Interest @18% p.a. will be charged if payment is not made within due date.<br/>3. Our risk and responsibility ceases as soon as the goods leave our premises.<br/>4. Subject to jurisdiction only.'}</div></div><div class="footer-right"><div class="total-section"><div class="total-row"><span>Sub Total</span><span>${sample.subtotal.toFixed(2)}</span></div>${sample.discountAmount>0?`<div class="total-row"><span>Discount</span><span>-${sample.discountAmount.toFixed(2)}</span></div>`:''}<div class="total-row"><span>Taxable Amount</span><span>${(sample.subtotal-sample.discountAmount).toFixed(2)}</span></div>${sample.tax>0?`<div class="total-row"><span>Integrated Tax 18.00%</span><span>${sample.tax.toFixed(2)}</span></div>`:''}<div class="total-row grand-total"><span>Grand Total</span><span>₹${sample.total.toFixed(2)}</span></div></div><div class="signature">For, ${store}<br/>${settings.signature?`<img src="${settings.signature}" style="max-width:150px;max-height:50px;margin:10px 0"/>`:'<br/><br/><br/>'} (Authorised Signatory)</div></div></div></div></body></html>`
    }
    
    if (d === 'thermal') {
      return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@media print{body{margin:0}.no-print{display:none}}body{font-family:'Courier New',monospace;max-width:300px;margin:0 auto;padding:8px;font-size:10px;line-height:1.2;background:white;color:black}.receipt-header{text-align:center;margin-bottom:15px;border-bottom:2px solid #000;padding-bottom:10px}.store-name{font-size:14px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px}.store-info{font-size:9px;line-height:1.3}.bill-info{margin:8px 0;font-size:9px}.bill-info-row{display:flex;justify-content:space-between;margin:3px 0}.separator{border-bottom:1px dashed #000;margin:10px 0}.double-separator{border-bottom:2px solid #000;margin:10px 0}.items-header{display:grid;grid-template-columns:2fr 0.8fr 1fr 1fr;gap:2px;font-weight:bold;font-size:8px;text-align:center;margin-bottom:3px;padding:3px 0;background:#f0f0f0}.item-row{display:grid;grid-template-columns:2fr 0.8fr 1fr 1fr;gap:2px;font-size:8px;margin:2px 0;padding:1px 0}.item-name{font-weight:bold;text-align:left}.item-qty,.item-rate,.item-amount{text-align:center}.totals{margin-top:15px}.total-row{display:flex;justify-content:space-between;margin:2px 0;font-size:9px}.subtotal-row{padding:3px 0}.tax-row{padding:3px 0;font-style:italic}.discount-row{padding:3px 0;color:#d00}.final-total{font-weight:bold;font-size:11px;padding:4px 0;border-top:1px solid #000;border-bottom:1px solid #000;margin:4px 0}.payment-info{margin:6px 0;text-align:center;font-size:9px}.footer{text-align:center;margin-top:10px;font-size:8px;line-height:1.3}.thank-you{font-weight:bold;font-size:10px;margin-bottom:4px}.terms{font-size:7px;margin:8px 0;text-align:justify;line-height:1.2;padding:4px;background:#f9f9f9;border:1px solid #ddd}.powered-by{font-size:10px;color:#666;margin-top:15px;font-style:italic}.currency{font-family:Arial,sans-serif}</style></head><body><div class="receipt-header"><div class="store-name">${store}</div><div class="store-info"><div>${addr}</div><div>Phone: ${ph}</div><div>GST No: ${gst}</div><div>Email: ${em}</div></div></div><div class="bill-info"><div class="bill-info-row"><span><strong>Receipt No:</strong></span><span><strong>${sample.billNo}</strong></span></div><div class="bill-info-row"><span>Date:</span><span>${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'2-digit',year:'numeric'})}</span></div><div class="bill-info-row"><span>Time:</span><span>${new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}</span></div><div class="bill-info-row"><span>Cashier:</span><span>Admin</span></div>${sample.customerName?`<div class="bill-info-row"><span>Customer:</span><span>${sample.customerName}</span></div>`:''}${sample.customerPhone?`<div class="bill-info-row"><span>Phone:</span><span>${sample.customerPhone}</span></div>`:''}</div><div class="double-separator"></div><div class="items-header"><div>ITEM</div><div>QTY</div><div>RATE</div><div>AMOUNT</div></div>${sample.items.map(it=>`<div class="item-row"><div class="item-name">${it.name}</div><div class="item-qty">${it.quantity}</div><div class="item-rate">${it.price}</div><div class="item-amount"><span class="currency">₹</span>${it.total}</div></div>`).join('')}<div class="separator"></div><div class="totals"><div class="total-row subtotal-row"><span>Subtotal:</span><span><span class="currency">₹</span>${sample.subtotal.toFixed(2)}</span></div>${sample.discountAmount>0?`<div class="total-row discount-row"><span>Discount:</span><span>- <span class="currency">₹</span>${sample.discountAmount.toFixed(2)}</span></div>`:''}${sample.tax>0?`<div class="total-row tax-row"><span>Tax:</span><span><span class="currency">₹</span>${sample.tax.toFixed(2)}</span></div>`:''}<div class="total-row final-total"><span>TOTAL AMOUNT:</span><span><span class="currency">₹</span>${sample.total.toFixed(2)}</span></div></div><div class="payment-info"><strong>Payment Method: Cash</strong></div><div class="double-separator"></div><div class="footer"><div class="thank-you">🙏 THANK YOU FOR YOUR PURCHASE! 🙏</div><div>Please visit us again</div><div>For any queries: ${ph}</div><div style="margin-top:10px;font-size:11px"><strong>Exchange Policy:</strong> Items can be exchanged within 7 days with receipt</div><div class="powered-by">Powered by Fashion ERP System</div></div></body></html>`
    } else if (d === 'modern') {
      return `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:sans-serif;padding:40px;background:#f5f5f5}.invoice{max-width:800px;margin:0 auto;background:#fff;box-shadow:0 0 20px rgba(0,0,0,.1)}.header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:40px;text-align:center}.company-name{font-size:32px;font-weight:300;letter-spacing:2px;margin-bottom:10px}.content{padding:40px}.meta{display:flex;justify-content:space-between;margin-bottom:30px;padding:20px;background:#f8f9fa;border-radius:8px}.items{width:100%;border-collapse:collapse;margin:20px 0}.items th{background:#f8f9fa;padding:15px;text-align:left;color:#667eea}.items td{padding:15px;border-bottom:1px solid #eee}.totals{text-align:right;margin-top:20px}.total-row{padding:10px 0}.grand{background:#667eea;color:#fff;padding:15px;margin-top:10px;border-radius:8px;font-size:18px;font-weight:600}</style></head><body><div class="invoice"><div class="header">${logo?`<img src="${logo}" style="max-width:100px;margin-bottom:15px"/>`:''}}<div class="company-name">${store}</div><div>${addr} • ${ph}</div></div><div class="content"><div class="meta"><div><h3 style="font-size:12px;color:#667eea;margin-bottom:10px">INVOICE</h3><p><strong>${sample.billNo}</strong></p><p>${new Date().toLocaleDateString('en-IN')}</p></div><div style="text-align:right"><h3 style="font-size:12px;color:#667eea;margin-bottom:10px">BILL TO</h3><p><strong>${sample.customerName}</strong></p><p>${sample.customerPhone}</p></div></div><table class="items"><thead><tr><th>#</th><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr></thead><tbody>${sample.items.map((it,i)=>`<tr><td>${i+1}</td><td>${it.name}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">₹${it.price}</td><td style="text-align:right">₹${it.total}</td></tr>`).join('')}</tbody></table><div class="totals"><div class="total-row">Subtotal: ₹${sample.subtotal}</div><div class="total-row">Discount: -₹${sample.discountAmount}</div><div class="total-row">Tax: ₹${sample.tax}</div><div class="total-row grand">Total: ₹${sample.total}</div></div></div></div></body></html>`
    } else if (d === 'elegant') {
      return `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;padding:40px;background:#fafafa}.invoice{max-width:800px;margin:0 auto;background:#fff;border:1px solid #d4af37}.header{background:#1a1a1a;color:#d4af37;padding:40px;text-align:center;border-bottom:3px solid #d4af37}.company-name{font-size:36px;letter-spacing:3px;margin-bottom:10px}.content{padding:40px}.items{width:100%;border-collapse:collapse;margin:20px 0}.items th{background:#1a1a1a;color:#d4af37;padding:15px;text-align:left}.items td{padding:15px;border-bottom:1px solid #eee}.totals{text-align:right;margin-top:30px;border-top:2px solid #d4af37;padding-top:20px}.total-row{padding:10px 0}.grand{background:#1a1a1a;color:#d4af37;padding:20px;margin-top:15px;font-size:20px;font-weight:700}</style></head><body><div class="invoice"><div class="header">${logo?`<img src="${logo}" style="max-width:120px;margin-bottom:15px"/>`:''}}<div class="company-name">${store}</div><div>${addr}<br/>${ph} • ${em}</div></div><div class="content"><div style="display:flex;justify-content:space-between;margin-bottom:30px;padding-bottom:20px;border-bottom:2px solid #d4af37"><div><div style="font-size:28px;letter-spacing:2px">INVOICE</div><div style="margin-top:15px"><strong>Bill To:</strong><br/>${sample.customerName}<br/>${sample.customerPhone}</div></div><div style="text-align:right"><div>Invoice No: <strong>${sample.billNo}</strong></div><div>Date: ${new Date().toLocaleDateString('en-IN')}</div></div></div><table class="items"><thead><tr><th>No.</th><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr></thead><tbody>${sample.items.map((it,i)=>`<tr><td>${i+1}</td><td>${it.name}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">₹${it.price}</td><td style="text-align:right">₹${it.total}</td></tr>`).join('')}</tbody></table><div class="totals"><div class="total-row">Subtotal: ₹${sample.subtotal}</div><div class="total-row">Discount: -₹${sample.discountAmount}</div><div class="total-row">Tax: ₹${sample.tax}</div><div class="total-row grand">GRAND TOTAL: ₹${sample.total}</div></div></div></div></body></html>`
    } else if (d === 'compact') {
      return `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;padding:20px;background:#fff}.receipt{max-width:350px;margin:0 auto;border:2px dashed #333;padding:20px}.header{text-align:center;border-bottom:2px dashed #333;padding-bottom:15px;margin-bottom:15px}.store-name{font-size:20px;font-weight:700;margin-bottom:5px}.info-row{display:flex;justify-content:space-between;font-size:11px;margin:5px 0}.items{margin:15px 0}.item{margin:10px 0;padding:8px 0;border-bottom:1px dashed #999}.item-name{font-weight:700;font-size:12px}.item-details{display:flex;justify-content:space-between;font-size:11px}.totals{margin-top:15px;border-top:2px dashed #333;padding-top:10px}.total-row{display:flex;justify-content:space-between;font-size:12px;margin:5px 0}.grand{font-size:16px;font-weight:700;margin-top:10px;padding-top:10px;border-top:2px solid #333}.footer{text-align:center;margin-top:20px;padding-top:15px;border-top:2px dashed #333;font-size:11px}</style></head><body><div class="receipt"><div class="header">${logo?`<img src="${logo}" style="max-width:80px;margin-bottom:10px"/>`:''}}<div class="store-name">${store}</div><div style="font-size:11px">${addr}<br/>Ph: ${ph}</div></div><div style="text-align:center;font-size:16px;font-weight:700;margin:15px 0">*** RECEIPT ***</div><div class="info-row"><span>Bill No:</span><span><strong>${sample.billNo}</strong></span></div><div class="info-row"><span>Date:</span><span>${new Date().toLocaleDateString('en-IN')}</span></div><div class="info-row"><span>Customer:</span><span>${sample.customerName}</span></div><div class="items">${sample.items.map((it,i)=>`<div class="item"><div class="item-name">${i+1}. ${it.name}</div><div class="item-details"><span>${it.quantity} x ₹${it.price}</span><span>₹${it.total}</span></div></div>`).join('')}</div><div class="totals"><div class="total-row"><span>Subtotal:</span><span>₹${sample.subtotal}</span></div><div class="total-row"><span>Discount:</span><span>-₹${sample.discountAmount}</span></div><div class="total-row"><span>Tax:</span><span>₹${sample.tax}</span></div><div class="total-row grand"><span>TOTAL:</span><span>₹${sample.total}</span></div></div><div class="footer"><div style="font-weight:700">THANK YOU!</div><div>Visit Again</div></div></div></body></html>`
    } else {
      return `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:40px;background:#fff}.invoice{max-width:800px;margin:0 auto;border:2px solid #333;padding:30px}.header{text-align:center;border-bottom:3px solid #333;padding-bottom:20px;margin-bottom:20px}.company-name{font-size:28px;font-weight:700;color:#333;margin-bottom:5px}.info{display:flex;justify-content:space-between;margin-bottom:30px}.items{width:100%;border-collapse:collapse;margin:20px 0}.items th{background:#333;color:#fff;padding:12px;text-align:left}.items td{padding:10px;border-bottom:1px solid #ddd}.totals{text-align:right;margin-top:20px}.total-row{padding:8px 0}.grand{font-size:20px;font-weight:700;border-top:2px solid #333;padding-top:10px;margin-top:10px}.footer{margin-top:40px;padding-top:20px;border-top:2px solid #333;text-align:center}</style></head><body><div class="invoice"><div class="header">${logo?`<img src="${logo}" style="max-width:120px;margin-bottom:10px"/>`:''}}<div class="company-name">${store}</div><div style="font-size:12px;color:#666">${addr}<br/>Phone: ${ph} | Email: ${em}<br/>GST: ${gst}</div></div><div class="info"><div><div style="font-size:24px;font-weight:700;margin-bottom:10px">INVOICE</div><div><strong>Invoice No:</strong> ${sample.billNo}</div><div><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</div></div><div style="text-align:right"><div style="font-weight:700;margin-bottom:5px">BILL TO:</div><div>${sample.customerName}</div><div>${sample.customerPhone}</div></div></div><table class="items"><thead><tr><th>Sr.</th><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr></thead><tbody>${sample.items.map((it,i)=>`<tr><td>${i+1}</td><td>${it.name}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">₹${it.price}</td><td style="text-align:right">₹${it.total}</td></tr>`).join('')}</tbody></table><div class="totals"><div class="total-row">Subtotal: ₹${sample.subtotal}</div><div class="total-row">Discount: -₹${sample.discountAmount}</div><div class="total-row">Tax: ₹${sample.tax}</div><div class="total-row grand">TOTAL: ₹${sample.total}</div></div><div class="footer"><div style="font-weight:700;font-size:16px">Thank You For Your Business!</div></div></div></body></html>`
    }
  }
}