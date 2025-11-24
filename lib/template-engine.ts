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
    total?: number
    subtotal?: number
    tax?: number
    discount?: number
    date?: string
    items?: any[]
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
    
    let html = `
      <div class="template-container" style="
        width: ${settings.pageSize === 'A4' ? '210mm' : '148mm'};
        min-height: ${settings.pageSize === 'A4' ? '297mm' : '210mm'};
        background: white;
        position: relative;
        font-family: Arial, sans-serif;
      ">
    `

    elements.forEach(element => {
      html += this.renderElement(element, data)
    })

    html += '</div>'
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
    }

    return css
  }

  // Render table element
  private static renderTable(element: TemplateElement, data: TemplateData, baseStyle: string): string {
    const borderColor = element.style?.borderColor || '#e5e7eb'
    const bw = element.tableConfig?.borderWidth ?? 1
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
            const v = item?.[k]
            const val = typeof v === 'number' && (k === 'price' || k === 'total') ? `₹${(v || 0).toFixed(2)}` : (v ?? '')
            return `<td style="border-bottom:${bw}px solid ${borderColor}; padding:${pad}px; text-align:${align[i] || (k === 'quantity' ? 'center' : (k === 'price' || k === 'total' ? 'right' : 'left'))}; ${widths[i] ? `width:${widths[i]}%;` : ''}">${val}</td>`
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
