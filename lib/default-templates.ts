export function getDefaultTemplate(type: string): any[] {
  switch (type) {
    case 'taxinvoice':
      return []
    case 'receipt':
      return []
    case 'invoice':
    default:
      return []
  }
}

