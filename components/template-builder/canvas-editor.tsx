"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TemplateElement } from '@/lib/template-engine'
import { Type, Image, Table, Minus, Space, Trash2, Copy, Move, GripVertical } from 'lucide-react'

interface CanvasEditorProps {
  elements: TemplateElement[]
  onElementsChange: (elements: TemplateElement[]) => void
  onSave: () => void
  saving: boolean
}

export function CanvasEditor({ elements, onElementsChange, onSave, saving }: CanvasEditorProps) {
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [draggedElement, setDraggedElement] = useState<TemplateElement | null>(null)
  const [resizing, setResizing] = useState<{ id: string; startX: number; startY: number; startWidth: number; startHeight: number } | null>(null)
  const [history, setHistory] = useState<TemplateElement[][]>([elements])
  const [historyIndex, setHistoryIndex] = useState(0)
  const canvasRef = useRef<HTMLDivElement>(null)

  const addElement = (type: TemplateElement['type']) => {
    const newElement: TemplateElement = {
      id: `element-${Date.now()}`,
      type,
      content: type === 'text' ? 'Sample Text' : '',
      placeholder: type === 'text' ? '{{tenant.companyName}}' : type === 'table' ? '{{items.table}}' : '',
      style: {
        fontSize: 14,
        fontWeight: 'normal',
        textAlign: 'left',
        color: '#000000',
        padding: 8
      },
      position: { x: 50, y: 50 + elements.length * 60 },
      size: { width: type === 'table' ? 500 : type === 'image' ? 150 : 200, height: type === 'table' ? 150 : type === 'image' ? 100 : 40 }
    }

    const newElements = [...elements, newElement]
    onElementsChange(newElements)
    addToHistory(newElements)
    setSelectedElement(newElement.id)
  }

  const updateElement = (id: string, updates: Partial<TemplateElement>) => {
    const newElements = elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    )
    onElementsChange(newElements)
    addToHistory(newElements)
  }

  const addToHistory = (newElements: TemplateElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newElements)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      onElementsChange(history[newIndex])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      onElementsChange(history[newIndex])
    }
  }

  const deleteElement = (id: string) => {
    const newElements = elements.filter(el => el.id !== id)
    onElementsChange(newElements)
    addToHistory(newElements)
    setSelectedElement(null)
  }

  const duplicateElement = (id: string) => {
    const element = elements.find(el => el.id === id)
    if (element) {
      const newElement = {
        ...element,
        id: `element-${Date.now()}`,
        position: { x: element.position!.x + 20, y: element.position!.y + 20 }
      }
      onElementsChange([...elements, newElement])
    }
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedElement(null)
    }
  }

  const handleElementMouseDown = (e: React.MouseEvent, element: TemplateElement) => {
    e.stopPropagation()
    setSelectedElement(element.id)
    setDraggedElement(element)
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggedElement && canvasRef.current && !resizing) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left - 100
      const y = e.clientY - rect.top - 20

      updateElement(draggedElement.id, {
        position: { x: Math.max(0, x), y: Math.max(0, y) }
      })
    }

    if (resizing && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const deltaX = e.clientX - resizing.startX
      const deltaY = e.clientY - resizing.startY

      updateElement(resizing.id, {
        size: {
          width: Math.max(50, resizing.startWidth + deltaX),
          height: Math.max(20, resizing.startHeight + deltaY)
        }
      })
    }
  }, [draggedElement, resizing, elements])

  const handleMouseUp = () => {
    setDraggedElement(null)
    setResizing(null)
  }

  const handleResizeMouseDown = (e: React.MouseEvent, element: TemplateElement) => {
    e.stopPropagation()
    setResizing({
      id: element.id,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: element.size?.width || 200,
      startHeight: element.size?.height || 40
    })
    setSelectedElement(element.id)
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Undo/Redo
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      undo()
      return
    }
    if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault()
      redo()
      return
    }

    if (!selectedElement) return
    const element = elements.find(el => el.id === selectedElement)
    if (!element) return

    const step = e.shiftKey ? 10 : 1
    let updates: Partial<TemplateElement> = {}

    // Ctrl + Arrow for resizing
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          updates = { size: { width: element.size?.width || 200, height: Math.max(20, (element.size?.height || 40) - step) } }
          break
        case 'ArrowDown':
          e.preventDefault()
          updates = { size: { width: element.size?.width || 200, height: (element.size?.height || 40) + step } }
          break
        case 'ArrowLeft':
          e.preventDefault()
          updates = { size: { width: Math.max(50, (element.size?.width || 200) - step), height: element.size?.height || 40 } }
          break
        case 'ArrowRight':
          e.preventDefault()
          updates = { size: { width: (element.size?.width || 200) + step, height: element.size?.height || 40 } }
          break
      }
    } else {
      // Arrow keys for positioning
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          updates = { position: { x: element.position!.x, y: Math.max(0, element.position!.y - step) } }
          break
        case 'ArrowDown':
          e.preventDefault()
          updates = { position: { x: element.position!.x, y: element.position!.y + step } }
          break
        case 'ArrowLeft':
          e.preventDefault()
          updates = { position: { x: Math.max(0, element.position!.x - step), y: element.position!.y } }
          break
        case 'ArrowRight':
          e.preventDefault()
          updates = { position: { x: element.position!.x + step, y: element.position!.y } }
          break
        case 'Delete':
        case 'Backspace':
          e.preventDefault()
          deleteElement(selectedElement)
          return
      }
    }

    if (Object.keys(updates).length > 0) {
      updateElement(selectedElement, updates)
    }
  }, [selectedElement, elements, historyIndex, history])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const selectedEl = elements.find(el => el.id === selectedElement)

  const renderElementPreview = (element: TemplateElement) => {
    if (element.type === 'text') {
      let displayText = element.content || ''
      if (element.placeholder) {
        displayText = element.placeholder.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
          const parts = path.split('.')
          if (parts[0] === 'tenant') {
            const labels: any = {
              companyName: 'Your Company Name',
              address: 'Your Address',
              phone: 'Your Phone',
              email: 'Your Email',
              gst: 'Your GST',
              logo: 'Your Logo'
            }
            return labels[parts[1]] || 'Company Info'
          }
          if (parts[0] === 'invoice') {
            const labels: any = {
              billNo: 'BILL-001',
              total: '₹1,250',
              subtotal: '₹1,000',
              tax: '₹180',
              discount: '₹50',
              date: new Date().toLocaleDateString()
            }
            return labels[parts[1]] || 'Invoice Data'
          }
          if (parts[0] === 'customer') {
            const labels: any = {
              name: 'Customer Name',
              phone: '+91 9876543210',
              address: 'Customer Address',
              email: 'customer@email.com'
            }
            return labels[parts[1]] || 'Customer Info'
          }
          if (parts[0] === 'user') {
            return 'Cashier Name'
          }
          return match
        })
      }
      return <div className="w-full h-full flex items-center overflow-hidden">{displayText || 'Text Element'}</div>
    }

    if (element.type === 'image') {
      if (element.content) {
        return <img src={element.content} alt="Custom" className="w-full h-full object-cover" />
      }
      return (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs border border-dashed border-gray-400">
          {element.placeholder === '{{tenant.logo}}' ? 'Company Logo' : 'Image Placeholder'}
        </div>
      )
    }

    if (element.type === 'table') {
      return (
        <div className="w-full h-full bg-white overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-left p-2 font-semibold">Item</th>
                <th className="text-center p-2 font-semibold">Qty</th>
                <th className="text-right p-2 font-semibold">Rate</th>
                <th className="text-right p-2 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="p-2">Product 1</td>
                <td className="text-center p-2">2</td>
                <td className="text-right p-2">₹300</td>
                <td className="text-right p-2">₹600</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-2">Product 2</td>
                <td className="text-center p-2">1</td>
                <td className="text-right p-2">₹400</td>
                <td className="text-right p-2">₹400</td>
              </tr>
            </tbody>
          </table>
        </div>
      )
    }

    if (element.type === 'divider') {
      return <hr className="w-full border-gray-400" />
    }

    if (element.type === 'spacer') {
      return <div className="w-full h-full bg-transparent border border-dashed border-gray-300" />
    }

    return null
  }

  return (
    <div className="flex h-screen">
      {/* Toolbar */}
      <div className="w-64 border-r bg-gray-50 p-4 overflow-y-auto">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Add Elements</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => addElement('text')} className="flex flex-col h-16">
                <Type className="w-4 h-4 mb-1" />
                Text
              </Button>
              <Button variant="outline" size="sm" onClick={() => addElement('image')} className="flex flex-col h-16">
                <Image className="w-4 h-4 mb-1" />
                Image
              </Button>
              <Button variant="outline" size="sm" onClick={() => addElement('table')} className="flex flex-col h-16">
                <Table className="w-4 h-4 mb-1" />
                Table
              </Button>
              <Button variant="outline" size="sm" onClick={() => addElement('divider')} className="flex flex-col h-16">
                <Minus className="w-4 h-4 mb-1" />
                Divider
              </Button>
              <Button variant="outline" size="sm" onClick={() => addElement('spacer')} className="flex flex-col h-16">
                <Space className="w-4 h-4 mb-1" />
                Space
              </Button>
            </div>
          </div>

          {selectedEl && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="style">Style</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="space-y-3">
                    {selectedEl.type === 'text' && (
                      <>
                        <div>
                          <Label className="text-xs">Content</Label>
                          <Input
                            value={selectedEl.content || ''}
                            onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                            className="text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Placeholder</Label>
                          <select
                            value={selectedEl.placeholder || ''}
                            onChange={(e) => updateElement(selectedEl.id, { placeholder: e.target.value })}
                            className="w-full p-2 border rounded text-xs"
                          >
                            <option value="">Select placeholder...</option>
                            <optgroup label="Company Info">
                              <option value="{{tenant.companyName}}">Company Name</option>
                              <option value="{{tenant.address}}">Address</option>
                              <option value="{{tenant.phone}}">Phone</option>
                              <option value="{{tenant.email}}">Email</option>
                              <option value="{{tenant.gst}}">GST Number</option>
                            </optgroup>
                            <optgroup label="Invoice Info">
                              <option value="{{invoice.billNo}}">Bill Number</option>
                              <option value="{{invoice.date}}">Date</option>
                              <option value="{{invoice.subtotal}}">Subtotal</option>
                              <option value="{{invoice.discount}}">Discount</option>
                              <option value="{{invoice.tax}}">Tax</option>
                              <option value="{{invoice.total}}">Total Amount</option>
                            </optgroup>
                            <optgroup label="Customer Info">
                              <option value="{{customer.name}}">Customer Name</option>
                              <option value="{{customer.phone}}">Customer Phone</option>
                              <option value="{{customer.address}}">Customer Address</option>
                              <option value="{{customer.email}}">Customer Email</option>
                            </optgroup>
                            <optgroup label="User Info">
                              <option value="{{user.name}}">Cashier Name</option>
                            </optgroup>
                          </select>
                        </div>
                      </>
                    )}
                    {selectedEl.type === 'image' && (
                      <>
                        <div>
                          <Label className="text-xs">Image Source</Label>
                          <select
                            value={selectedEl.placeholder || ''}
                            onChange={(e) => updateElement(selectedEl.id, { placeholder: e.target.value, content: '' })}
                            className="w-full p-2 border rounded text-xs"
                          >
                            <option value="">Select...</option>
                            <option value="{{tenant.logo}}">Company Logo (from settings)</option>
                            <option value="custom">Upload Custom Image</option>
                          </select>
                        </div>
                        {selectedEl.placeholder === 'custom' && (
                          <div>
                            <Label className="text-xs">Upload Image</Label>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  const reader = new FileReader()
                                  reader.onload = (event) => {
                                    updateElement(selectedEl.id, { content: event.target?.result as string })
                                  }
                                  reader.readAsDataURL(file)
                                }
                              }}
                              className="text-xs"
                            />
                            {selectedEl.content && (
                              <div className="mt-2">
                                <img src={selectedEl.content} alt="Preview" className="max-h-20 border rounded" />
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="style" className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Width (px)</Label>
                        <Input
                          type="number"
                          min="50"
                          value={selectedEl.size?.width || 200}
                          onChange={(e) => updateElement(selectedEl.id, {
                            size: { width: parseInt(e.target.value), height: selectedEl.size?.height || 40 }
                          })}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Height (px)</Label>
                        <Input
                          type="number"
                          min="20"
                          value={selectedEl.size?.height || 40}
                          onChange={(e) => updateElement(selectedEl.id, {
                            size: { width: selectedEl.size?.width || 200, height: parseInt(e.target.value) }
                          })}
                          className="text-xs"
                        />
                      </div>
                    </div>
                    {selectedEl.type === 'text' && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Font Size</Label>
                            <Input
                              type="number"
                              min="8"
                              max="72"
                              value={selectedEl.style?.fontSize || 14}
                              onChange={(e) => updateElement(selectedEl.id, {
                                style: { ...selectedEl.style, fontSize: parseInt(e.target.value) }
                              })}
                              className="text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Weight</Label>
                            <select
                              value={selectedEl.style?.fontWeight || 'normal'}
                              onChange={(e) => updateElement(selectedEl.id, {
                                style: { ...selectedEl.style, fontWeight: e.target.value as 'normal' | 'bold' }
                              })}
                              className="w-full p-1 border rounded text-xs"
                            >
                              <option value="normal">Normal</option>
                              <option value="bold">Bold</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Text Align</Label>
                          <select
                            value={selectedEl.style?.textAlign || 'left'}
                            onChange={(e) => updateElement(selectedEl.id, {
                              style: { ...selectedEl.style, textAlign: e.target.value as 'left' | 'center' | 'right' }
                            })}
                            className="w-full p-1 border rounded text-xs"
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Text Color</Label>
                            <Input
                              type="color"
                              value={selectedEl.style?.color || '#000000'}
                              onChange={(e) => updateElement(selectedEl.id, {
                                style: { ...selectedEl.style, color: e.target.value }
                              })}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Background</Label>
                            <Input
                              type="color"
                              value={selectedEl.style?.backgroundColor || '#ffffff'}
                              onChange={(e) => updateElement(selectedEl.id, {
                                style: { ...selectedEl.style, backgroundColor: e.target.value }
                              })}
                              className="h-8"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>
                </Tabs>

                <div className="flex space-x-1">
                  <Button variant="outline" size="sm" onClick={() => duplicateElement(selectedEl.id)} className="flex-1">
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteElement(selectedEl.id)} className="flex-1">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Button onClick={onSave} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 p-4 overflow-auto bg-gray-100">
        <div
          ref={canvasRef}
          className="relative bg-white shadow-lg mx-auto"
          style={{ width: '210mm', minHeight: '297mm' }}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {elements.map((element) => (
            <div
              key={element.id}
              className={`absolute select-none ${
                selectedElement === element.id ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-gray-400'
              }`}
              style={{
                left: element.position?.x || 0,
                top: element.position?.y || 0,
                width: element.size?.width || 200,
                height: element.size?.height || 40,
                fontSize: element.style?.fontSize || 14,
                fontWeight: element.style?.fontWeight || 'normal',
                textAlign: element.style?.textAlign || 'left',
                color: element.style?.color || '#000000',
                backgroundColor: element.style?.backgroundColor || 'transparent',
                padding: element.style?.padding || 8,
                cursor: 'move'
              }}
              onMouseDown={(e) => handleElementMouseDown(e, element)}
            >
              {renderElementPreview(element)}
              
              {selectedElement === element.id && (
                <div
                  className="absolute -right-2 -bottom-2 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize hover:bg-blue-600"
                  onMouseDown={(e) => handleResizeMouseDown(e, element)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
