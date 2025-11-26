import { generateBillHTML, BillData, StoreSettings } from './bill-designs'

export type TemplateData = {
  bill: BillData
  settings: StoreSettings
}

export class TemplateEngine {
  static renderToHTML(template: any, data: TemplateData): string {
    const design: string =
      template?.canvasJSON?.settings?.design ||
      (template?.templateType === 'taxinvoice'
        ? 'taxinvoice'
        : template?.templateType === 'receipt'
        ? 'thermal'
        : 'classic')

    return generateBillHTML(design, data.bill, data.settings)
  }
}

