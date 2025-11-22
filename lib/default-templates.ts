// Default template configurations for different business types
import { TemplateElement } from './template-engine'

export const DEFAULT_TEMPLATES = {
  invoice: {
    retail: {
      elements: [
        {
          id: 'logo',
          type: 'image' as const,
          placeholder: '{{tenant.logo}}',
          style: {},
          position: { x: 20, y: 20 },
          size: { width: 100, height: 80 }
        },
        {
          id: 'company-name',
          type: 'text' as const,
          placeholder: '{{tenant.companyName}}',
          style: { fontSize: 24, fontWeight: 'bold' as const, textAlign: 'center' as const },
          position: { x: 150, y: 30 }
        },
        {
          id: 'company-address',
          type: 'text' as const,
          placeholder: '{{tenant.address}}',
          style: { fontSize: 12, textAlign: 'center' as const },
          position: { x: 150, y: 60 }
        },
        {
          id: 'company-contact',
          type: 'text' as const,
          placeholder: 'Phone: {{tenant.phone}} | Email: {{tenant.email}}',
          style: { fontSize: 10, textAlign: 'center' as const },
          position: { x: 150, y: 80 }
        },
        {
          id: 'gst-info',
          type: 'text' as const,
          placeholder: 'GST: {{tenant.gst}}',
          style: { fontSize: 10, textAlign: 'center' as const },
          position: { x: 150, y: 95 }
        },
        {
          id: 'divider-1',
          type: 'divider' as const,
          position: { x: 20, y: 120 },
          size: { width: 550, height: 2 }
        },
        {
          id: 'invoice-title',
          type: 'text' as const,
          content: 'INVOICE',
          style: { fontSize: 20, fontWeight: 'bold' as const, textAlign: 'center' as const },
          position: { x: 250, y: 140 }
        },
        {
          id: 'bill-info',
          type: 'text' as const,
          placeholder: 'Bill No: {{invoice.billNo}}',
          style: { fontSize: 14, fontWeight: 'bold' as const },
          position: { x: 20, y: 180 }
        },
        {
          id: 'date-info',
          type: 'text' as const,
          placeholder: 'Date: {{invoice.date}}',
          style: { fontSize: 14 },
          position: { x: 400, y: 180 }
        },
        {
          id: 'customer-info',
          type: 'text' as const,
          placeholder: 'Customer: {{customer.name}}',
          style: { fontSize: 14 },
          position: { x: 20, y: 210 }
        },
        {
          id: 'customer-phone',
          type: 'text' as const,
          placeholder: 'Phone: {{customer.phone}}',
          style: { fontSize: 12 },
          position: { x: 20, y: 230 }
        },
        {
          id: 'items-table',
          type: 'table' as const,
          placeholder: '{{items.table}}',
          style: {},
          position: { x: 20, y: 270 },
          size: { width: 550, height: 150 }
        },
        {
          id: 'subtotal',
          type: 'text' as const,
          placeholder: 'Subtotal: ₹{{invoice.subtotal}}',
          style: { fontSize: 14, textAlign: 'right' as const },
          position: { x: 350, y: 450 }
        },
        {
          id: 'discount',
          type: 'text' as const,
          placeholder: 'Discount: -₹{{invoice.discount}}',
          style: { fontSize: 14, textAlign: 'right' as const, color: '#16a34a' },
          position: { x: 350, y: 470 }
        },
        {
          id: 'tax',
          type: 'text' as const,
          placeholder: 'Tax: ₹{{invoice.tax}}',
          style: { fontSize: 14, textAlign: 'right' as const },
          position: { x: 350, y: 490 }
        },
        {
          id: 'divider-3',
          type: 'divider' as const,
          position: { x: 350, y: 510 },
          size: { width: 220, height: 2 }
        },
        {
          id: 'total',
          type: 'text' as const,
          placeholder: 'TOTAL: ₹{{invoice.total}}',
          style: { fontSize: 18, fontWeight: 'bold' as const, textAlign: 'right' as const },
          position: { x: 350, y: 530 }
        },
        {
          id: 'thank-you',
          type: 'text' as const,
          content: 'Thank you for your business!',
          style: { fontSize: 14, textAlign: 'center' as const, fontWeight: 'bold' as const },
          position: { x: 200, y: 600 }
        },
        {
          id: 'visit-again',
          type: 'text' as const,
          content: 'Visit us again!',
          style: { fontSize: 12, textAlign: 'center' as const },
          position: { x: 200, y: 620 }
        }
      ] as TemplateElement[]
    },
    
    restaurant: {
      elements: [
        {
          id: 'restaurant-name',
          type: 'text' as const,
          placeholder: '{{tenant.companyName}}',
          style: { fontSize: 28, fontWeight: 'bold' as const, textAlign: 'center' as const },
          position: { x: 200, y: 30 }
        },
        {
          id: 'restaurant-tagline',
          type: 'text' as const,
          content: 'Delicious Food & Great Service',
          style: { fontSize: 14, textAlign: 'center' as const, color: '#666666' },
          position: { x: 200, y: 60 }
        },
        {
          id: 'restaurant-address',
          type: 'text' as const,
          placeholder: '{{tenant.address}}',
          style: { fontSize: 12, textAlign: 'center' as const },
          position: { x: 200, y: 80 }
        },
        {
          id: 'restaurant-contact',
          type: 'text' as const,
          placeholder: 'Phone: {{tenant.phone}}',
          style: { fontSize: 12, textAlign: 'center' as const },
          position: { x: 200, y: 100 }
        },
        {
          id: 'bill-header',
          type: 'text' as const,
          content: '--- ORDER RECEIPT ---',
          style: { fontSize: 16, fontWeight: 'bold' as const, textAlign: 'center' as const },
          position: { x: 200, y: 140 }
        },
        {
          id: 'order-details',
          type: 'text' as const,
          placeholder: 'Order #{{invoice.billNo}} | {{invoice.date}}',
          style: { fontSize: 12, textAlign: 'center' as const },
          position: { x: 200, y: 170 }
        },
        {
          id: 'customer-name',
          type: 'text' as const,
          placeholder: 'Customer: {{customer.name}}',
          style: { fontSize: 14 },
          position: { x: 20, y: 210 }
        },
        {
          id: 'items-table',
          type: 'table' as const,
          placeholder: '{{items.table}}',
          style: {},
          position: { x: 20, y: 250 },
          size: { width: 550, height: 150 }
        },
        {
          id: 'total-amount',
          type: 'text' as const,
          placeholder: 'TOTAL AMOUNT: ₹{{invoice.total}}',
          style: { fontSize: 20, fontWeight: 'bold' as const, textAlign: 'center' as const },
          position: { x: 200, y: 450 }
        },
        {
          id: 'footer-message',
          type: 'text' as const,
          content: 'Thank you for dining with us!',
          style: { fontSize: 14, textAlign: 'center' as const },
          position: { x: 200, y: 500 }
        }
      ] as TemplateElement[]
    }
  },

  report: {
    default: {
      elements: [
        {
          id: 'report-header',
          type: 'text' as const,
          placeholder: '{{tenant.companyName}} - Business Report',
          style: { fontSize: 24, fontWeight: 'bold' as const, textAlign: 'center' as const },
          position: { x: 200, y: 30 }
        },
        {
          id: 'report-date',
          type: 'text' as const,
          placeholder: 'Generated on: {{invoice.date}}',
          style: { fontSize: 12, textAlign: 'right' as const },
          position: { x: 400, y: 80 }
        },
        {
          id: 'company-info',
          type: 'text' as const,
          placeholder: '{{tenant.address}} | {{tenant.phone}}',
          style: { fontSize: 12, textAlign: 'center' as const },
          position: { x: 200, y: 60 }
        }
      ] as TemplateElement[]
    }
  }
}

export function getDefaultTemplate(templateType: string, businessType?: string): TemplateElement[] {
  if (templateType === 'invoice') {
    if (businessType === 'restaurant') {
      return DEFAULT_TEMPLATES.invoice.restaurant.elements
    }
    return DEFAULT_TEMPLATES.invoice.retail.elements
  }
  
  if (templateType === 'report') {
    return DEFAULT_TEMPLATES.report.default.elements
  }

  // Fallback to basic invoice template
  return DEFAULT_TEMPLATES.invoice.retail.elements
}