"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Package } from "lucide-react"
import JsBarcode from "jsbarcode"
import { formatDateToDDMMYYYY, parseDDMMYYYYToDate } from "@/lib/date-utils"

interface Field {
  name: string
  type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'barcode' | 'email' | 'phone' | 'url'
  required: boolean
  enabled: boolean
  options?: string[]
}

interface DynamicInventoryFormProps {
  formData: Record<string, any>
  setFormData: (data: Record<string, any>) => void
}

function BarcodeField({ fieldKey, fieldValue, updateFormData, field }: any) {
  const barcodeRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (fieldValue && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, fieldValue, {
          format: "CODE128",
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 14
        })
      } catch (error) {
        console.error('Barcode generation error:', error)
      }
    }
  }, [fieldValue])

  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        <Input
          value={fieldValue}
          onChange={(e) => updateFormData(field.name, e.target.value)}
          placeholder="Barcode Number"
          required={field.required}
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => {
            const newBarcode = `${Date.now()}`
            updateFormData(field.name, newBarcode)
          }}
          className="px-3 py-2 border rounded hover:bg-gray-50 text-sm whitespace-nowrap"
        >
          Generate
        </button>
      </div>
      {fieldValue && (
        <div className="p-3 border rounded bg-white flex justify-center">
          <svg ref={barcodeRef}></svg>
        </div>
      )}
    </div>
  )
}

export function DynamicInventoryForm({ formData, setFormData }: DynamicInventoryFormProps) {
  const [fields, setFields] = useState<Field[]>([])
  const [dropdownData, setDropdownData] = useState<Record<string, string[]>>({})

  const fetchTenantFields = async () => {
    try {
      const [fieldsResponse, dropdownResponse] = await Promise.all([
        fetch('/api/tenant-product-fields'),
        fetch('/api/dropdown-data')
      ])
      
      if (fieldsResponse.ok) {
        const data = await fieldsResponse.json()
        setFields(data?.filter((f: Field) => f.enabled) || [])
      } else {
        console.error('Failed to fetch tenant fields, status:', fieldsResponse.status)
        setFields([])
      }
      
      if (dropdownResponse.ok) {
        const dropdownData = await dropdownResponse.json()
        setDropdownData(dropdownData)
      } else {
        console.error('Failed to fetch dropdown data')
        setDropdownData({})
      }
    } catch (error) {
      console.error('Failed to fetch tenant fields:', error)
      setFields([])
      setDropdownData({})
    }
  }

  const updateFormData = (fieldName: string, value: any) => {
    const fieldKey = fieldName.toLowerCase().replace(/\s+/g, '_')
    
    // Store value directly
    let processedValue = value
    
    const newFormData = { 
      ...formData, 
      [fieldKey]: processedValue,
      [fieldName]: processedValue,
      [fieldName.toLowerCase()]: processedValue
    }
    
    // Handle critical field mappings
    if (fieldName.toLowerCase().includes('cost') && fieldName.toLowerCase().includes('price')) {
      newFormData['costPrice'] = processedValue
      newFormData['cost_price'] = processedValue
      newFormData['Cost Price'] = processedValue
    }
    if (fieldName.toLowerCase() === 'stock') {
      newFormData['stock'] = processedValue
      newFormData['Stock'] = processedValue
    }
    if (fieldName.toLowerCase().includes('min') && fieldName.toLowerCase().includes('stock')) {
      newFormData['minStock'] = processedValue
      newFormData['min_stock'] = processedValue
      newFormData['Min Stock'] = processedValue
    }
    // Handle date fields
    if (fieldName.toLowerCase().includes('date')) {
      newFormData[fieldName.toLowerCase().replace(/\s+/g, '_')] = processedValue
      newFormData[fieldName] = processedValue
    }
    
    setFormData(newFormData)
  }

  const renderField = (field: Field) => {
    const fieldKey = field.name.toLowerCase().replace(/\s+/g, '_')
    const fieldValue = formData[fieldKey] || 
                      formData[field.name] || 
                      formData[field.name.toLowerCase()] || 
                      formData[field.name.replace(/\s+/g, '')] ||
                      ''
    
    switch (field.type) {
      case 'text':
        return (
          <Input
            value={fieldValue}
            onChange={(e) => updateFormData(field.name, e.target.value)}
            placeholder={`Enter ${field.name}`}
            required={field.required}
          />
        )
      
      case 'number':
        const isDecimal = field.name.toLowerCase().includes('price') || field.name.toLowerCase().includes('cost')
        return (
          <Input
            type="number"
            step={isDecimal ? "0.01" : "1"}
            min="0"
            value={fieldValue}
            onChange={(e) => updateFormData(field.name, e.target.value)}
            placeholder={`Enter ${field.name}`}
            required={field.required}
          />
        )
      
      case 'select':
        const options = dropdownData[fieldKey] || dropdownData[field.name.toLowerCase()] || field.options || []
        return (
          <Select 
            value={fieldValue} 
            onValueChange={(value) => updateFormData(field.name, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.name}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      case 'date':
        // Convert dd-mm-yyyy to yyyy-mm-dd for date input
        let dateInputValue = ''
        if (fieldValue && fieldValue.includes('-')) {
          const parts = fieldValue.split('-')
          if (parts.length === 3 && parts[0].length === 2) {
            // dd-mm-yyyy to yyyy-mm-dd
            dateInputValue = `${parts[2]}-${parts[1]}-${parts[0]}`
          } else if (parts.length === 3 && parts[0].length === 4) {
            // Already yyyy-mm-dd
            dateInputValue = fieldValue
          }
        }
        
        return (
          <Input
            type="date"
            value={dateInputValue}
            onChange={(e) => {
              const inputDate = e.target.value
              if (inputDate && inputDate.length === 10) {
                // Ensure full date yyyy-mm-dd, convert to dd-mm-yyyy
                const [year, month, day] = inputDate.split('-')
                if (year && month && day) {
                  const formattedDate = `${day}-${month}-${year}`
                  updateFormData(field.name, formattedDate)
                }
              } else {
                updateFormData(field.name, '')
              }
            }}
            required={field.required}
          />
        )
      
      case 'textarea':
        return (
          <Textarea
            value={fieldValue}
            onChange={(e) => updateFormData(field.name, e.target.value)}
            placeholder={`Enter ${field.name}`}
            required={field.required}
            className="min-h-[80px]"
          />
        )
      
      case 'barcode':
        return <BarcodeField fieldKey={fieldKey} fieldValue={fieldValue} updateFormData={updateFormData} field={field} />
      
      case 'email':
        return (
          <Input
            type="email"
            value={fieldValue}
            onChange={(e) => updateFormData(field.name, e.target.value)}
            placeholder={`Enter ${field.name}`}
            required={field.required}
          />
        )
      
      case 'phone':
        return (
          <Input
            type="tel"
            value={fieldValue}
            onChange={(e) => updateFormData(field.name, e.target.value)}
            placeholder={`Enter ${field.name}`}
            required={field.required}
          />
        )
      
      case 'url':
        return (
          <Input
            type="url"
            value={fieldValue}
            onChange={(e) => updateFormData(field.name, e.target.value)}
            placeholder={`Enter ${field.name}`}
            required={field.required}
          />
        )
      
      default:
        return null
    }
  }

  useEffect(() => {
    fetchTenantFields()
  }, [])

  if (fields.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Fields Available</h3>
        <p className="text-sm text-gray-500 mb-4">
          Contact your administrator to configure product fields.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label className="text-sm font-medium">
            {field.name}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {renderField(field)}
        </div>
      ))}
    </div>
  )
}