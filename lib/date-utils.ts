// Utility function to format dates to dd-mm-yyyy
export function formatDateToDDMMYYYY(date: string | Date | null | undefined): string {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return ''
    
    const day = dateObj.getDate().toString().padStart(2, '0')
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
    const year = dateObj.getFullYear()
    
    return `${day}-${month}-${year}`
  } catch {
    return ''
  }
}

// Utility function to parse dd-mm-yyyy format to Date
export function parseDDMMYYYYToDate(dateString: string): Date | null {
  if (!dateString) return null
  
  try {
    const parts = dateString.split('-')
    if (parts.length !== 3) return null
    
    const day = parseInt(parts[0])
    const month = parseInt(parts[1]) - 1 // Month is 0-indexed
    const year = parseInt(parts[2])
    
    const date = new Date(year, month, day)
    if (isNaN(date.getTime())) return null
    
    return date
  } catch {
    return null
  }
}