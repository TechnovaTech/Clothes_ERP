// Template Engine for Multi-Tenant Template System
export interface TemplateData {
  tenant?: {
    companyName?: string
    address?: string
    phone?: string
    email?: string
    gst?: string
    logo?: string
  }
  user?: {
    name?: string
    email?: string
    role?: string
  }
  invoice?: {
    billNo?: string
    series?: string
    number?: string
    total?: number
    subtotal?: number
    tax?: number
    discount?: number
    date?: string
    items?: any[]
    taxBreakup?: {
      cgst?: number
      sgst?: number
      igst?: number
      cess?: number
      gstRate?: number
      taxAmount?: number
    }
  }
  customer?: {
    name?: string
    phone?: string
    address?: string
    email?: string
  }
  [key: string]: any
}

export interface TemplateElement {
  id: string
  type: 'text' | 'image' | 'table' | 'placeholder' | 'divider' | 'spacer'
  content?: string
  placeholder?: string
  style?: {
    fontSize?: number
    fontWeight?: 'normal' | 'bold'
    textAlign?: 'left' | 'center' | 'right'
    color?: string
    backgroundColor?: string
    borderColor?: string
    padding?: number
    margin?: number
    width?: string
    height?: string
    fontFamily?: string
    lineHeight?: number
    letterSpacing?: number
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
    borderWidth?: number
    borderStyle?: 'solid' | 'dashed' | 'dotted'
    borderRadius?: number
    opacity?: number
    zIndex?: number
    objectFit?: 'contain' | 'cover'
  }
  position?: {
    x: number
    y: number
  }
  size?: {
    width: number
    height: number
  }
  tableConfig?: {
    rows: number
    columns: number
    headers: string[]
    headerBg: string
    headerColor: string
    borderWidth: number
    showHeader?: boolean
    columnKeys?: string[]
    columnWidths?: number[]
    align?: ("left" | "center" | "right")[]
    cellPadding?: number
  }
  dividerType?: 'horizontal' | 'vertical'
  locked?: boolean
  hidden?: boolean
}

export interface Template {
  id: string
  tenantId: string
  templateType: 'invoice' | 'report' | 'certificate' | 'email' | 'layout'
  name: string
  canvasJSON: {
    elements: TemplateElement[]
    settings: {
      pageSize: 'A4' | 'A5' | 'Letter'
      orientation: 'portrait' | 'landscape'
      margins: {
        top: number
        right: number
        bottom: number
        left: number
      }
    }
  }
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export class TemplateEngine {
  // Replace placeholders in template with actual data
  static replacePlaceholders(template: string, data: TemplateData): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(data, path.trim())
      return value !== undefined ? String(value) : match
    })
  }

  // Get nested object value by path (e.g., "tenant.companyName")
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  }

  // Render template elements to HTML
  static renderToHTML(template: Template, data: TemplateData): string {
    const { elements, settings } = template.canvasJSON

    const pageWidth = settings.pageSize === 'A4' ? '210mm' : '148mm'
    const pageHeight = settings.pageSize === 'A4' ? '297mm' : '210mm'

    const tableEl = elements.find(el => el.type === 'table' && el.placeholder === '{{items.table}}')
    const items = Array.isArray(data.invoice?.items) ? (data.invoice!.items as any[]) : []

    // Calculate rows per page based on table height and padding
    let rowsPerPage = items.length
    if (tableEl) {
      const pad = tableEl.tableConfig?.cellPadding ?? 8
      const showHeader = tableEl.tableConfig?.showHeader !== false
      const headerH = showHeader ? (pad * 2 + 18) : 0
      const rowH = (pad * 2 + 18)
      const tableHeight = tableEl.size?.height ?? 150
      const available = Math.max(0, tableHeight - headerH)
      const calcRows = Math.max(1, Math.floor(available / rowH))
      rowsPerPage = Math.max(1, calcRows)
    }

    const pageCount = tableEl ? Math.max(1, Math.ceil(items.length / rowsPerPage)) : 1

    // Identify elements positioned below the items table to render only on the last page
    const belowTableIds = new Set<string>()
    if (tableEl && tableEl.position && tableEl.size) {
      const cutoffY = tableEl.position.y + tableEl.size.height
      elements.forEach(el => {
        if (el.id !== tableEl.id && el.position && typeof el.position.y === 'number') {
          if (el.position.y >= cutoffY) {
            belowTableIds.add(el.id)
          }
        }
      })
    }

    const isSummaryElement = (el: TemplateElement) => {
      if (el.type !== 'text') return false
      const ph = el.placeholder || ''
      return ph.includes('invoice.total') || ph.includes('invoice.subtotal') || ph.includes('invoice.tax') || ph.includes('invoice.discount')
    }

    let html = ''

    for (let p = 0; p < pageCount; p++) {
      const start = p * rowsPerPage
      const end = start + rowsPerPage
      const pageItems = items.slice(start, end)

      html += `
        <div class="template-container" style="
          width: ${pageWidth};
          min-height: ${pageHeight};
          background: white;
          position: relative;
          font-family: Arial, sans-serif;
          page-break-after: ${p < pageCount - 1 ? 'always' : 'auto'};
        ">
      `

      elements.forEach(element => {
        if (element.type === 'table' && element.placeholder === '{{items.table}}') {
          html += this.renderTableWithItems(element, data, pageItems)
        } else if (isSummaryElement(element)) {
          if (p === pageCount - 1) {
            html += this.renderElement(element, data)
          }
        } else if (belowTableIds.has(element.id)) {
          if (p === pageCount - 1) {
            html += this.renderElement(element, data)
          }
        } else {
          html += this.renderElement(element, data)
        }
      })

      html += '</div>'
    }

    return html
  }

  // Render individual element
  private static renderElement(element: TemplateElement, data: TemplateData): string {
    const style = this.buildElementStyle(element)
    const positionStyle = element.position ? `position: absolute; left: ${element.position.x}px; top: ${element.position.y}px;` : ''
    const fullStyle = positionStyle + style
    
    switch (element.type) {
      case 'text':
        const textContent = element.placeholder 
          ? this.replacePlaceholders(element.placeholder, data)
          : element.content || ''
        return `<div style="${fullStyle}">${textContent}</div>`
      
      case 'image':
        let imageSrc = element.content || ''
        if (!imageSrc && element.placeholder) {
          imageSrc = this.replacePlaceholders(element.placeholder, data)
        }
        return imageSrc ? `<img src="${imageSrc}" style="${fullStyle}object-fit: contain;" alt="Template Image" />` : ''
      
      case 'table':
        return this.renderTable(element, data, fullStyle)
      
      case 'divider':
        return `<hr style="${fullStyle}border: 1px solid #ccc;" />`
      
      case 'spacer':
        return `<div style="${fullStyle}"></div>`
      
      default:
        return ''
    }
  }

  // Build CSS style string from element style object
  private static buildElementStyle(element: TemplateElement): string {
    const { style, position, size } = element
    let css = ''

    if (position) {
      css += `position: absolute; left: ${position.x}px; top: ${position.y}px;`
    }

    if (size) {
      css += `width: ${size.width}px; height: ${size.height}px;`
    }

    if (style) {
      if (style.fontSize) css += `font-size: ${style.fontSize}px;`
      if (style.fontWeight) css += `font-weight: ${style.fontWeight};`
      if (style.textAlign) css += `text-align: ${style.textAlign};`
      if (style.color) css += `color: ${style.color};`
      if (style.backgroundColor) css += `background-color: ${style.backgroundColor};`
      if (style.padding) css += `padding: ${style.padding}px;`
      if (style.margin) css += `margin: ${style.margin}px;`
      if (style.width) css += `width: ${style.width};`
      if (style.height) css += `height: ${style.height};`
      if (style.fontFamily) css += `font-family: ${style.fontFamily};`
      if (style.lineHeight) css += `line-height: ${style.lineHeight};`
      if (style.letterSpacing) css += `letter-spacing: ${style.letterSpacing}px;`
      if (style.textTransform && style.textTransform !== 'none') css += `text-transform: ${style.textTransform};`
      if (style.borderColor) css += `border-color: ${style.borderColor};`
      if (style.borderWidth !== undefined) css += `border-width: ${style.borderWidth}px;`
      if (style.borderStyle) css += `border-style: ${style.borderStyle};`
      if (style.borderRadius) css += `border-radius: ${style.borderRadius}px;`
      if (style.opacity !== undefined) css += `opacity: ${style.opacity};`
      if (style.zIndex !== undefined) css += `z-index: ${style.zIndex};`
    }

    return css
  }

  // Render table element
  private static renderTable(element: TemplateElement, data: TemplateData, baseStyle: string): string {
    const borderColor = element.style?.borderColor || '#e5e7eb'
    const bw = element.tableConfig?.borderWidth ?? (element.style?.borderWidth ?? 1)
    const pad = element.tableConfig?.cellPadding ?? 8
    const align = element.tableConfig?.align || []
    const cols = element.tableConfig?.columns || (element.tableConfig?.headers?.length || 4)
    let widths = element.tableConfig?.columnWidths && element.tableConfig.columnWidths.length === cols
      ? element.tableConfig.columnWidths.slice()
      : Array(cols).fill(Math.round(100 / cols))
    const sum = widths.reduce((a,b) => a + b, 0)
    if (sum !== 100) {
      const diff = 100 - sum
      widths[0] = Math.max(5, widths[0] + diff)
    }
    const showHeader = element.tableConfig?.showHeader !== false
    const headers = element.tableConfig?.headers?.length ? element.tableConfig.headers : ['Item', 'Qty', 'Rate', 'Amount']
    const keys = element.tableConfig?.columnKeys?.length ? element.tableConfig.columnKeys : ['name', 'quantity', 'price', 'total']

    if (element.placeholder === '{{items.table}}' && Array.isArray(data.invoice?.items)) {
      const items = data.invoice!.items
      const headerRow = showHeader ? `
        <thead>
          <tr style="background:${element.tableConfig?.headerBg || 'transparent'}; color:${element.tableConfig?.headerColor || 'inherit'}; border-bottom:${bw}px solid ${borderColor};">
            ${headers.map((h, i) => `<th style="padding:${pad}px; text-align:${align[i] || 'left'}; font-weight:600; ${widths[i] ? `width:${widths[i]}%;` : ''}">${h}</th>`).join('')}
          </tr>
        </thead>
      ` : ''

      const rows = items.map((item: any) => `
        <tr>
          ${keys.map((k, i) => {
            const kk = (k === 'gst' ? 'gstRate' : (k === 'gstamt' || k === 'gst_amount' ? 'gstAmount' : k))
            let v = item?.[kk]
            if (kk === 'gstRate') {
              const fallbackRate = (data.invoice as any)?.taxBreakup?.gstRate
              if (v === undefined || (typeof v === 'number' && v === 0) || (typeof v === 'string' && Number(v) === 0)) {
                v = fallbackRate
              }
            } else if (kk === 'gstAmount' && v === undefined) {
              const qty = Number(item?.quantity || 0)
              const price = Number(item?.price || 0)
              const rate = (typeof item?.gstRate === 'number' ? item!.gstRate : (data.invoice as any)?.taxBreakup?.gstRate) || 0
              v = qty * price * rate / 100
            }
            let val = v ?? ''
            if (typeof v === 'number') {
              if (['price','total','cgst','sgst','igst','gstAmount','taxAmount','discountAmount'].includes(kk)) {
                val = `₹${(v || 0).toFixed(2)}`
              } else if (['gstRate','discountRate'].includes(kk)) {
                val = `${(v || 0).toFixed(2)}%`
              }
            }
            const defaultAlign = (kk === 'quantity' ? 'center' : (['price','total','cgst','sgst','igst','gstAmount','taxAmount','discountAmount'].includes(kk) ? 'right' : 'left'))
            return `<td style="border-bottom:${bw}px solid ${borderColor}; padding:${pad}px; text-align:${align[i] || defaultAlign}; ${widths[i] ? `width:${widths[i]}%;` : ''}">${val}</td>`
          }).join('')}
        </tr>
      `).join('')

      return `<table style="${baseStyle}border-collapse: collapse; width: 100%; border:${bw}px solid ${borderColor};">
        ${headerRow}
        <tbody>
          ${rows}
        </tbody>
      </table>`
    }
    return `<table style="${baseStyle}border-collapse: collapse; width: 100%; border:${bw}px solid ${borderColor};">
      ${showHeader ? `<thead><tr>${headers.map((h, i) => `<th style="padding:${pad}px; text-align:${align[i] || 'left'}; ${widths[i] ? `width:${widths[i]}%;` : ''}">${h}</th>`).join('')}</tr></thead>` : ''}
      <tbody>
        <tr>${headers.map((_, i) => `<td style="border-bottom:${bw}px solid ${borderColor}; padding:${pad}px; text-align:${align[i] || 'left'}; ${widths[i] ? `width:${widths[i]}%;` : ''}"></td>`).join('')}</tr>
      </tbody>
    </table>`
  }

  // Render table with explicit items slice (used for pagination)
  private static renderTableWithItems(element: TemplateElement, data: TemplateData, pageItems: any[]): string {
    const borderColor = element.style?.borderColor || '#e5e7eb'
    const bw = element.tableConfig?.borderWidth ?? (element.style?.borderWidth ?? 1)
    const pad = element.tableConfig?.cellPadding ?? 8
    const align = element.tableConfig?.align || []
    const cols = element.tableConfig?.columns || (element.tableConfig?.headers?.length || 4)
    let widths = element.tableConfig?.columnWidths && element.tableConfig.columnWidths.length === cols
      ? element.tableConfig.columnWidths.slice()
      : Array(cols).fill(Math.round(100 / cols))
    const sum = widths.reduce((a,b) => a + b, 0)
    if (sum !== 100) {
      const diff = 100 - sum
      widths[0] = Math.max(5, widths[0] + diff)
    }
    const showHeader = element.tableConfig?.showHeader !== false
    const headers = element.tableConfig?.headers?.length ? element.tableConfig.headers : ['Item', 'Qty', 'Rate', 'Amount']
    const keys = element.tableConfig?.columnKeys?.length ? element.tableConfig.columnKeys : ['name', 'quantity', 'price', 'total']

    const baseStyle = this.buildElementStyle(element)

    const headerRow = showHeader ? `
      <thead>
        <tr style="background:${element.tableConfig?.headerBg || 'transparent'}; color:${element.tableConfig?.headerColor || 'inherit'}; border-bottom:${bw}px solid ${borderColor};">
          ${headers.map((h, i) => `<th style="padding:${pad}px; text-align:${align[i] || 'left'}; font-weight:600; ${widths[i] ? `width:${widths[i]}%;` : ''}">${h}</th>`).join('')}
        </tr>
      </thead>
    ` : ''

    const rows = pageItems.map((item: any) => `
      <tr>
        ${keys.map((k, i) => {
          const kk = (k === 'gst' ? 'gstRate' : (k === 'gstamt' || k === 'gst_amount' ? 'gstAmount' : k))
          let v = item?.[kk]
          if (kk === 'gstRate') {
            const fallbackRate = (data.invoice as any)?.taxBreakup?.gstRate
            if (v === undefined || (typeof v === 'number' && v === 0) || (typeof v === 'string' && Number(v) === 0)) {
              v = fallbackRate
            }
          } else if (kk === 'gstAmount' && v === undefined) {
            const qty = Number(item?.quantity || 0)
            const price = Number(item?.price || 0)
            const rate = (typeof item?.gstRate === 'number' ? item!.gstRate : (data.invoice as any)?.taxBreakup?.gstRate) || 0
            v = qty * price * rate / 100
          }
          let val = v ?? ''
          if (typeof v === 'number') {
            if (['price','total','cgst','sgst','igst','gstAmount','taxAmount','discountAmount'].includes(kk)) {
              val = `₹${(v || 0).toFixed(2)}`
            } else if (['gstRate','discountRate'].includes(kk)) {
              val = `${(v || 0).toFixed(2)}%`
            }
          }
          const defaultAlign = (kk === 'quantity' ? 'center' : (['price','total','cgst','sgst','igst','gstAmount','taxAmount','discountAmount'].includes(kk) ? 'right' : 'left'))
          return `<td style="border-bottom:${bw}px solid ${borderColor}; padding:${pad}px; text-align:${align[i] || defaultAlign}; ${widths[i] ? `width:${widths[i]}%;` : ''}">${val}</td>`
        }).join('')}
      </tr>
    `).join('')

    return `<table style="${baseStyle}border-collapse: collapse; width: 100%; border:${bw}px solid ${borderColor}; page-break-inside: auto;">
      ${headerRow}
      <tbody>
        ${rows}
      </tbody>
    </table>`
  }

  // Generate default template based on type and business
  static getDefaultTemplate(templateType: string, businessType?: string): Template['canvasJSON'] {
    const { getDefaultTemplate } = require('@/lib/default-templates')
    return {
      elements: getDefaultTemplate(templateType, businessType),
      settings: {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 20, right: 20, bottom: 20, left: 20 }
      }
    }
  }
}
