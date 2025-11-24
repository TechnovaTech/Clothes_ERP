"use client"

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { TemplateElement } from '@/lib/template-engine'
import { showToast } from '@/lib/toast'
import { Palette, Eye, Save, RotateCcw, Type, Image, Table, Minus, Plus, Trash2, Move, Copy } from 'lucide-react'
import { QuickGuide } from '@/components/template-builder/quick-guide'
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'

export default function TemplateBuilderPage() {
  const [elements, setElements] = useState<TemplateElement[]>([])
  const [history, setHistory] = useState<TemplateElement[][]>([])
  const [templateType, setTemplateType] = useState('invoice')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('editor')
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [draggedElement, setDraggedElement] = useState<TemplateElement | null>(null)
  const [resizing, setResizing] = useState<{ id: string; startX: number; startY: number; startWidth: number; startHeight: number; lockRatio: boolean } | null>(null)

  // Load template on mount and type change
  useEffect(() => {
    loadTemplate()
  }, [templateType])

  const loadTemplate = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/templates?type=${templateType}`)
      if (response.ok) {
        const template = await response.json()
        setElements(template.canvasJSON?.elements || [])
      } else {
        showToast.error('Failed to load template')
      }
    } catch (error) {
      console.error('Load template error:', error)
      showToast.error('Error loading template')
    } finally {
      setLoading(false)
    }
  }

  const saveTemplate = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType,
          canvasJSON: {
            elements,
            settings: {
              pageSize: 'A4',
              orientation: 'portrait',
              margins: { top: 20, right: 20, bottom: 20, left: 20 }
            }
          },
          name: `${templateType} Template`
        })
      })

      if (response.ok) {
        showToast.success('Template saved successfully!')
      } else {
        showToast.error('Failed to save template')
      }
    } catch (error) {
      console.error('Save template error:', error)
      showToast.error('Error saving template')
    } finally {
      setSaving(false)
    }
  }

  const resetToDefault = async () => {
    if (confirm('Reset to default template? This will lose all your changes.')) {
      try {
        await fetch(`/api/templates?type=${templateType}`, { method: 'DELETE' })
        await loadTemplate()
        showToast.success('Template reset to default')
      } catch (error) {
        showToast.error('Failed to reset template')
      }
    }
  }

  const addElement = (type: TemplateElement['type'], subType?: string) => {
    const newElement: TemplateElement = {
      id: `element-${Date.now()}`,
      type,
      content: type === 'text' ? 'New Text' : type === 'divider' ? '' : type === 'table' ? '' : 'Element',
      position: { x: 50, y: 50 + elements.length * 30 },
      size: { 
        width: type === 'divider' ? (subType === 'vertical' ? 2 : 300) : type === 'table' ? 400 : 200, 
        height: type === 'divider' ? (subType === 'vertical' ? 100 : 2) : type === 'table' ? 120 : 30 
      },
      style: {
        fontSize: 14,
        fontWeight: 'normal',
        textAlign: 'left',
        color: '#000000',
        backgroundColor: type === 'table' ? '#ffffff' : undefined,
        borderColor: type === 'table' ? '#000000' : type === 'divider' ? '#666666' : undefined
      },
      tableConfig: type === 'table' ? {
        rows: 3,
        columns: 4,
        headers: ['Item', 'Qty', 'Rate', 'Amount'],
        headerBg: '#f3f4f6',
        headerColor: '#000000',
        borderWidth: 1
      } : undefined,
      dividerType: type === 'divider' ? (subType || 'horizontal') : undefined
    }
    setHistory((h) => [...h, elements])
    setElements([...elements, newElement])
    setSelectedElement(newElement.id)
  }

  const updateElement = (id: string, updates: Partial<TemplateElement>) => {
    setHistory((h) => [...h, elements])
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el))
  }

  const deleteElement = (id: string) => {
    setHistory((h) => [...h, elements])
    setElements(elements.filter(el => el.id !== id))
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
      setHistory((h) => [...h, elements])
      setElements([...elements, newElement])
    }
  }

  const undo = () => {
    setHistory((h) => {
      if (h.length === 0) return h
      const prev = h[h.length - 1]
      setElements(prev)
      const sel = selectedElement && prev.find((el) => el.id === selectedElement) ? selectedElement : null
      setSelectedElement(sel)
      return h.slice(0, -1)
    })
  }

  const selectedEl = elements.find(el => el.id === selectedElement)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElement) return
      const el = elements.find(x => x.id === selectedElement)
      if (!el) return
      const step = e.shiftKey ? 10 : 1
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undo()
        return
      }
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'ArrowRight') {
          updateElement(el.id, { size: { width: (el.size?.width || 200) + step, height: el.size?.height || 30 } })
        } else if (e.key === 'ArrowLeft') {
          updateElement(el.id, { size: { width: Math.max(50, (el.size?.width || 200) - step), height: el.size?.height || 30 } })
        } else if (e.key === 'ArrowDown') {
          updateElement(el.id, { size: { width: el.size?.width || 200, height: (el.size?.height || 30) + step } })
        } else if (e.key === 'ArrowUp') {
          updateElement(el.id, { size: { width: el.size?.width || 200, height: Math.max(20, (el.size?.height || 30) - step) } })
        }
      } else {
        if (e.key === 'ArrowRight') {
          updateElement(el.id, { position: { x: (el.position?.x || 0) + step, y: el.position?.y || 0 } })
        } else if (e.key === 'ArrowLeft') {
          updateElement(el.id, { position: { x: Math.max(0, (el.position?.x || 0) - step), y: el.position?.y || 0 } })
        } else if (e.key === 'ArrowDown') {
          updateElement(el.id, { position: { x: el.position?.x || 0, y: (el.position?.y || 0) + step } })
        } else if (e.key === 'ArrowUp') {
          updateElement(el.id, { position: { x: el.position?.x || 0, y: Math.max(0, (el.position?.y || 0) - step) } })
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElement, elements])

  if (loading) {
    return (
      <MainLayout title="Template Builder">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading template...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Template Builder">
      <div className="h-[calc(100vh-120px)] flex flex-col">
        {/* Compact Header */}
        <div className="flex items-center justify-between p-4 bg-white border-b">
          <div className="flex items-center space-x-2">
            <Palette className="w-5 h-5" />
            <span className="font-semibold">Template Builder</span>
          </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Type:</label>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value="invoice">Invoice</option>
                <option value="report">Report</option>
                <option value="certificate">Certificate</option>
                <option value="email">Email</option>
              </select>
          </div>
          <Button variant="outline" size="sm" onClick={undo} disabled={history.length === 0}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Undo
          </Button>
          <Button variant="outline" size="sm" onClick={resetToDefault}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
            <Button onClick={saveTemplate} disabled={saving} size="sm">
              <Save className="w-4 h-4 mr-1" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-2">
            <TabsTrigger value="editor" className="flex items-center space-x-2">
              <Palette className="w-4 h-4" />
              <span>Editor</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="flex-1 p-4">
            <PanelGroup direction="horizontal" className="h-full">
              <Panel defaultSize={20} minSize={15} className="space-y-4 pr-2 overflow-y-auto overscroll-contain">
                <Card className="h-fit">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Add Elements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button onClick={() => addElement('text')} className="w-full justify-start h-8 text-sm">
                      <Type className="w-3 h-3 mr-2" />
                      Text
                    </Button>
                    <Button onClick={() => addElement('image')} className="w-full justify-start h-8 text-sm" variant="outline">
                      <Image className="w-3 h-3 mr-2" />
                      Image
                    </Button>
                    <Button onClick={() => addElement('table')} className="w-full justify-start h-8 text-sm" variant="outline">
                      <Table className="w-3 h-3 mr-2" />
                      Table
                    </Button>
                    <div className="space-y-1">
                      <Button onClick={() => addElement('divider', 'horizontal')} className="w-full justify-start h-8 text-sm" variant="outline">
                        <Minus className="w-3 h-3 mr-2" />
                        H-Divider
                      </Button>
                      <Button onClick={() => addElement('divider', 'vertical')} className="w-full justify-start h-8 text-sm" variant="outline">
                        <span className="w-3 h-3 mr-2 inline-block transform rotate-90">|</span>
                        V-Divider
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Element Properties */}
                {selectedEl && (
                  <Card className="h-fit">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        Properties
                        <div className="flex space-x-1">
                          <Button size="sm" variant="ghost" onClick={() => duplicateElement(selectedEl.id)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteElement(selectedEl.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedEl.type === 'text' && (
                        <>
                          <div>
                            <Label className="text-sm">Text Content</Label>
                            <Input
                              value={selectedEl.content || ''}
                              onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                              placeholder="Enter text"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Dynamic Data</Label>
                            <Select
                              value={selectedEl.placeholder || 'custom'}
                              onValueChange={(value) => {
                                if (value === 'custom') {
                                  updateElement(selectedEl.id, { placeholder: '', content: selectedEl.content || '' })
                                } else {
                                  updateElement(selectedEl.id, { placeholder: value, content: '' })
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Choose data" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="custom">Custom Text</SelectItem>
                                <SelectItem value="{{tenant.companyName}}">Store Name</SelectItem>
                                <SelectItem value="{{tenant.address}}">Store Address</SelectItem>
                                <SelectItem value="{{tenant.phone}}">Store Phone</SelectItem>
                                <SelectItem value="{{tenant.email}}">Store Email</SelectItem>
                                <SelectItem value="{{tenant.gst}}">GST Number</SelectItem>
                                <SelectItem value="{{invoice.billNo}}">Bill Number</SelectItem>
                                <SelectItem value="{{invoice.date}}">Bill Date</SelectItem>
                                <SelectItem value="{{invoice.total}}">Total Amount</SelectItem>
                                <SelectItem value="{{invoice.subtotal}}">Subtotal</SelectItem>
                                <SelectItem value="{{customer.name}}">Customer Name</SelectItem>
                                <SelectItem value="{{customer.phone}}">Customer Phone</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                      
                      {selectedEl.type === 'image' && (
                        <>
                          <div>
                            <Label className="text-sm">Image URL</Label>
                            <Input
                              value={selectedEl.content || ''}
                              onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                              placeholder="Image URL"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Upload</Label>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  const reader = new FileReader()
                                  reader.onload = (e) => {
                                    updateElement(selectedEl.id, { content: e.target?.result as string })
                                  }
                                  reader.readAsDataURL(file)
                                }
                              }}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Dynamic Logo</Label>
                            <Select
                              value={selectedEl.placeholder || 'custom'}
                              onValueChange={(value) => {
                                if (value === 'custom') {
                                  updateElement(selectedEl.id, { placeholder: '', content: selectedEl.content || '' })
                                } else {
                                  updateElement(selectedEl.id, { placeholder: value, content: '' })
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Choose logo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="custom">Custom Image</SelectItem>
                                <SelectItem value="{{tenant.logo}}">Store Logo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                      
                      {selectedEl.type === 'table' && (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium">Column Manager</div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const cols = Math.max(1, selectedEl.tableConfig?.columns || (selectedEl.tableConfig?.headers?.length || 4))
                                  const equal = Array(cols).fill(Math.round(100 / cols))
                                  updateElement(selectedEl.id, { tableConfig: { ...selectedEl.tableConfig!, columnWidths: equal } })
                                }}
                                className="h-7 px-2 text-xs"
                              >
                                Distribute Widths
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  const cols = (selectedEl.tableConfig?.columns || (selectedEl.tableConfig?.headers?.length || 0)) + 1
                                  const headers = [...(selectedEl.tableConfig?.headers || []), `Col ${cols}`]
                                  const keys = [...(selectedEl.tableConfig?.columnKeys || []), '']
                                  const aligns = [...(selectedEl.tableConfig?.align || []), 'left'] as any
                                  const widths = [...(selectedEl.tableConfig?.columnWidths || [])]
                                  const equal = Array(cols).fill(Math.round(100 / cols))
                                  updateElement(selectedEl.id, {
                                    tableConfig: {
                                      ...selectedEl.tableConfig!,
                                      columns: cols,
                                      headers,
                                      columnKeys: keys,
                                      align: aligns,
                                      columnWidths: widths.length === cols ? widths : equal
                                    }
                                  })
                                }}
                                className="h-7 px-2 text-xs"
                              >
                                Add Column
                              </Button>
                            </div>
                          </div>
                          {(selectedEl.tableConfig?.headers || ['Item','Qty','Rate','Amount']).map((h, i) => (
                            <div key={`col-${i}`} className="grid grid-cols-12 gap-2 items-center mb-2">
                              <div className="col-span-3">
                                <Label className="text-xs">Header</Label>
                                <Input
                                  value={h}
                                  onChange={(e) => {
                                    const headers = [...(selectedEl.tableConfig?.headers || [])]
                                    headers[i] = e.target.value
                                    updateElement(selectedEl.id, { tableConfig: { ...selectedEl.tableConfig!, headers } })
                                  }}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="col-span-3">
                                <Label className="text-xs">Key</Label>
                                <Select
                                  value={((selectedEl.tableConfig?.columnKeys || ['name','quantity','price','total'])[i] || 'none') as any}
                                  onValueChange={(value) => {
                                    const keys = [...(selectedEl.tableConfig?.columnKeys || [])]
                                    keys[i] = value === 'none' ? '' : value
                                    updateElement(selectedEl.id, { tableConfig: { ...selectedEl.tableConfig!, columnKeys: keys } })
                                  }}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Select key" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="name">name</SelectItem>
                                    <SelectItem value="quantity">quantity</SelectItem>
                                    <SelectItem value="price">price</SelectItem>
                                    <SelectItem value="total">total</SelectItem>
                                    <SelectItem value="sku">sku</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="col-span-3">
                                <Label className="text-xs">Width (%)</Label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="range"
                                    min={5}
                                    max={80}
                                    value={(selectedEl.tableConfig?.columnWidths || [])[i] ?? Math.round(100 / ((selectedEl.tableConfig?.columns) || 4))}
                                    onChange={(e) => {
                                      const cols = Math.max(1, selectedEl.tableConfig?.columns || (selectedEl.tableConfig?.headers?.length || 4))
                                      let widths = [...(selectedEl.tableConfig?.columnWidths || Array(cols).fill(Math.round(100 / cols)))]
                                      widths[i] = Number(e.target.value)
                                      const sum = widths.reduce((a,b) => a + b, 0)
                                      if (sum !== 100) {
                                        const diff = 100 - sum
                                        const j = i === 0 ? 1 : 0
                                        widths[j] = Math.max(5, widths[j] + diff)
                                      }
                                      updateElement(selectedEl.id, { tableConfig: { ...selectedEl.tableConfig!, columnWidths: widths } })
                                    }}
                                    className="flex-1"
                                  />
                                  <Input
                                    type="number"
                                    value={(selectedEl.tableConfig?.columnWidths || [])[i] ?? Math.round(100 / ((selectedEl.tableConfig?.columns) || 4))}
                                    onChange={(e) => {
                                      const cols = Math.max(1, selectedEl.tableConfig?.columns || (selectedEl.tableConfig?.headers?.length || 4))
                                      let widths = [...(selectedEl.tableConfig?.columnWidths || Array(cols).fill(Math.round(100 / cols)))]
                                      widths[i] = Number(e.target.value) || 0
                                      const sum = widths.reduce((a,b) => a + b, 0)
                                      if (sum !== 100) {
                                        const diff = 100 - sum
                                        const j = i === 0 ? 1 : 0
                                        widths[j] = Math.max(5, widths[j] + diff)
                                      }
                                      updateElement(selectedEl.id, { tableConfig: { ...selectedEl.tableConfig!, columnWidths: widths } })
                                    }}
                                    className="h-8 w-16 text-xs"
                                  />
                                </div>
                              </div>
            <div className="col-span-2">
              <Label className="text-xs">Text Align</Label>
              <Select
                value={(selectedEl.tableConfig?.align || ['left'])[i] || 'left'}
                onValueChange={(value) => {
                  const align = [...(selectedEl.tableConfig?.align || [])]
                  align[i] = value as any
                  updateElement(selectedEl.id, { tableConfig: { ...selectedEl.tableConfig!, align } })
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">left</SelectItem>
                  <SelectItem value="center">center</SelectItem>
                  <SelectItem value="right">right</SelectItem>
                </SelectContent>
              </Select>
            </div>
                              <div className="col-span-1 flex items-end gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2"
                                  onClick={() => {
                                    if (i === 0) return
                                    const headers = [...(selectedEl.tableConfig?.headers || [])]
                                    const keys = [...(selectedEl.tableConfig?.columnKeys || [])]
                                    const align = [...(selectedEl.tableConfig?.align || [])]
                                    const widths = [...(selectedEl.tableConfig?.columnWidths || [])]
                                    ;[headers[i-1], headers[i]] = [headers[i], headers[i-1]]
                                    ;[keys[i-1], keys[i]] = [keys[i], keys[i-1]]
                                    ;[align[i-1], align[i]] = [align[i], align[i-1]]
                                    ;[widths[i-1], widths[i]] = [widths[i], widths[i-1]]
                                    updateElement(selectedEl.id, { tableConfig: { ...selectedEl.tableConfig!, headers, columnKeys: keys, align, columnWidths: widths } })
                                  }}
                                >↑</Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2"
                                  onClick={() => {
                                    const headers = [...(selectedEl.tableConfig?.headers || [])]
                                    const keys = [...(selectedEl.tableConfig?.columnKeys || [])]
                                    const align = [...(selectedEl.tableConfig?.align || [])]
                                    const widths = [...(selectedEl.tableConfig?.columnWidths || [])]
                                    if (i >= headers.length - 1) return
                                    ;[headers[i+1], headers[i]] = [headers[i], headers[i+1]]
                                    ;[keys[i+1], keys[i]] = [keys[i], keys[i+1]]
                                    ;[align[i+1], align[i]] = [align[i], align[i+1]]
                                    ;[widths[i+1], widths[i]] = [widths[i], widths[i+1]]
                                    updateElement(selectedEl.id, { tableConfig: { ...selectedEl.tableConfig!, headers, columnKeys: keys, align, columnWidths: widths } })
                                  }}
                                >↓</Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2"
                                  onClick={() => {
                                    const headers = (selectedEl.tableConfig?.headers || []).filter((_, idx) => idx !== i)
                                    const keys = (selectedEl.tableConfig?.columnKeys || []).filter((_, idx) => idx !== i)
                                    const align = (selectedEl.tableConfig?.align || []).filter((_, idx) => idx !== i)
                                    const widths = (selectedEl.tableConfig?.columnWidths || []).filter((_, idx) => idx !== i)
                                    const cols = Math.max(1, (selectedEl.tableConfig?.columns || headers.length) - 1)
                                    updateElement(selectedEl.id, { tableConfig: { ...selectedEl.tableConfig!, columns: cols, headers, columnKeys: keys, align, columnWidths: widths } })
                                  }}
                                >✕</Button>
                              </div>
                            </div>
                          ))}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-sm">Rows</Label>
                              <Input
                                type="number"
                                min="2"
                                max="20"
                                value={selectedEl.tableConfig?.rows || 3}
                                onChange={(e) => updateElement(selectedEl.id, {
                                  tableConfig: { ...selectedEl.tableConfig!, rows: Number(e.target.value) }
                                })}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Columns</Label>
                              <Input
                                type="number"
                                min="2"
                                max="10"
                                value={selectedEl.tableConfig?.columns || 4}
                                onChange={(e) => updateElement(selectedEl.id, {
                                  tableConfig: { ...selectedEl.tableConfig!, columns: Number(e.target.value) }
                                })}
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm">Header Background</Label>
                            <Input
                              type="color"
                              value={selectedEl.tableConfig?.headerBg || '#f3f4f6'}
                              onChange={(e) => updateElement(selectedEl.id, {
                                tableConfig: { ...selectedEl.tableConfig!, headerBg: e.target.value }
                              })}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Header Text Color</Label>
                            <Input
                              type="color"
                              value={selectedEl.tableConfig?.headerColor || '#000000'}
                              onChange={(e) => updateElement(selectedEl.id, {
                                tableConfig: { ...selectedEl.tableConfig!, headerColor: e.target.value }
                              })}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Show Header</Label>
                            <select
                              value={(selectedEl.tableConfig?.showHeader ?? true) ? 'true' : 'false'}
                              onChange={(e) => updateElement(selectedEl.id, {
                                tableConfig: { ...selectedEl.tableConfig!, showHeader: e.target.value === 'true' }
                              })}
                              className="h-8 text-sm border rounded px-2"
                            >
                              <option value="true">Yes</option>
                              <option value="false">No</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-sm">Border Color</Label>
                            <Input
                              type="color"
                              value={selectedEl.style?.borderColor || '#000000'}
                              onChange={(e) => updateElement(selectedEl.id, {
                                style: { ...selectedEl.style!, borderColor: e.target.value }
                              })}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Border Width</Label>
                            <Input
                              type="number"
                              min="0"
                              max="5"
                              value={selectedEl.tableConfig?.borderWidth || 1}
                              onChange={(e) => updateElement(selectedEl.id, {
                                tableConfig: { ...selectedEl.tableConfig!, borderWidth: Number(e.target.value) }
                              })}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Cell Padding (px)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              value={selectedEl.tableConfig?.cellPadding ?? 8}
                              onChange={(e) => updateElement(selectedEl.id, {
                                tableConfig: { ...selectedEl.tableConfig!, cellPadding: Number(e.target.value) }
                              })}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Column Headers (comma separated)</Label>
                            <Input
                              value={selectedEl.tableConfig?.headers?.join(', ') || 'Item, Qty, Rate, Amount'}
                              onChange={(e) => {
                                const headers = e.target.value.split(',').map(h => h.trim()).filter(h => h)
                                updateElement(selectedEl.id, {
                                  tableConfig: { 
                                    ...selectedEl.tableConfig!, 
                                    headers,
                                    columns: headers.length
                                  }
                                })
                              }}
                              placeholder="Item, Qty, Rate, Amount"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Column Keys (from invoice.items)</Label>
                            <Input
                              value={(selectedEl.tableConfig?.columnKeys || ['name','quantity','price','total']).join(', ')}
                              onChange={(e) => {
                                const columnKeys = e.target.value.split(',').map(h => h.trim()).filter(h => h)
                                updateElement(selectedEl.id, {
                                  tableConfig: { 
                                    ...selectedEl.tableConfig!, 
                                    columnKeys
                                  }
                                })
                              }}
                              placeholder="name, quantity, price, total"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Column Widths (%)</Label>
                            <Input
                              value={(selectedEl.tableConfig?.columnWidths || []).join(', ')}
                              onChange={(e) => {
                                const columnWidths = e.target.value.split(',').map(v => Number(v.trim())).filter(v => !Number.isNaN(v))
                                updateElement(selectedEl.id, {
                                  tableConfig: { 
                                    ...selectedEl.tableConfig!, 
                                    columnWidths
                                  }
                                })
                              }}
                              placeholder="40, 20, 20, 20"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Column Alignments</Label>
                            <Input
                              value={(selectedEl.tableConfig?.align || []).join(', ')}
                              onChange={(e) => {
                                const align = e.target.value.split(',').map(a => a.trim() as 'left' | 'center' | 'right').filter(a => ['left','center','right'].includes(a))
                                updateElement(selectedEl.id, { tableConfig: { ...selectedEl.tableConfig!, align } })
                              }}
                              placeholder="left, center, right, right"
                              className="h-8 text-sm"
                            />
                          </div>
                        </>
                      )}
                      
                      {selectedEl.type === 'divider' && (
                        <>
                          <div>
                            <Label className="text-sm">Divider Color</Label>
                            <Input
                              type="color"
                              value={selectedEl.style?.borderColor || '#666666'}
                              onChange={(e) => updateElement(selectedEl.id, {
                                style: { ...selectedEl.style!, borderColor: e.target.value }
                              })}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Type</Label>
                            <Select
                              value={selectedEl.dividerType || 'horizontal'}
                              onValueChange={(value) => {
                                const newSize = value === 'vertical' 
                                  ? { width: 2, height: selectedEl.size?.height || 100 }
                                  : { width: selectedEl.size?.width || 300, height: 2 }
                                updateElement(selectedEl.id, {
                                  dividerType: value,
                                  size: newSize
                                })
                              }}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="horizontal">Horizontal</SelectItem>
                                <SelectItem value="vertical">Vertical</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-sm">X</Label>
                          <Input
                            type="number"
                            value={selectedEl.position?.x || 0}
                            onChange={(e) => updateElement(selectedEl.id, {
                              position: { ...selectedEl.position!, x: Number(e.target.value) }
                            })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Y</Label>
                          <Input
                            type="number"
                            value={selectedEl.position?.y || 0}
                            onChange={(e) => updateElement(selectedEl.id, {
                              position: { ...selectedEl.position!, y: Number(e.target.value) }
                            })}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-sm">Width</Label>
                          <Input
                            type="number"
                            value={selectedEl.size?.width || 200}
                            onChange={(e) => updateElement(selectedEl.id, {
                              size: { ...selectedEl.size!, width: Number(e.target.value) }
                            })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Height</Label>
                          <Input
                            type="number"
                            value={selectedEl.size?.height || 30}
                            onChange={(e) => updateElement(selectedEl.id, {
                              size: { ...selectedEl.size!, height: Number(e.target.value) }
                            })}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>

                      {selectedEl.type === 'text' && (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-sm">Font Size</Label>
                              <Input
                                type="number"
                                value={selectedEl.style?.fontSize || 14}
                                onChange={(e) => updateElement(selectedEl.id, {
                                  style: { ...selectedEl.style!, fontSize: Number(e.target.value) }
                                })}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Weight</Label>
                              <Select
                                value={selectedEl.style?.fontWeight || 'normal'}
                                onValueChange={(value) => updateElement(selectedEl.id, {
                                  style: { ...selectedEl.style!, fontWeight: value as 'normal' | 'bold' }
                                })}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="normal">Normal</SelectItem>
                                  <SelectItem value="bold">Bold</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-sm">Align</Label>
                              <Select
                                value={selectedEl.style?.textAlign || 'left'}
                                onValueChange={(value) => updateElement(selectedEl.id, {
                                  style: { ...selectedEl.style!, textAlign: value as 'left' | 'center' | 'right' }
                                })}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="left">Left</SelectItem>
                                  <SelectItem value="center">Center</SelectItem>
                                  <SelectItem value="right">Right</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm">Color</Label>
                              <Input
                                type="color"
                                value={selectedEl.style?.color || '#000000'}
                                onChange={(e) => updateElement(selectedEl.id, {
                                  style: { ...selectedEl.style!, color: e.target.value }
                                })}
                                className="h-8"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </Panel>
              <PanelResizeHandle className="mx-2">
                <div className="w-1 bg-gray-200 hover:bg-gray-300 rounded h-full" />
              </PanelResizeHandle>

              <Panel defaultSize={60} minSize={40} className="px-2 overflow-hidden">
                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Canvas</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 p-4 overflow-hidden">
                    <div 
                      className="relative bg-white border-2 border-dashed border-gray-300 w-full h-full overflow-auto rounded-lg"
                      style={{ 
                        backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0'
                      }}
                    >
                      <div 
                        className="relative bg-white mx-auto"
                        style={{
                          width: '210mm',
                          height: '297mm',
                          transform: 'scale(0.85)',
                          transformOrigin: 'top center',
                          marginTop: '20px'
                        }}
                      >
                        {elements.map((element) => (
                          <div
                            key={element.id}
                            className={`absolute cursor-pointer border-2 ${
                              selectedElement === element.id ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-gray-400'
                            }`}
                            style={{
                              left: element.position?.x || 0,
                              top: element.position?.y || 0,
                              width: element.size?.width || 200,
                              height: element.size?.height || 30,
                              fontSize: element.style?.fontSize || 14,
                              fontWeight: element.style?.fontWeight || 'normal',
                              textAlign: element.style?.textAlign || 'left',
                              color: element.style?.color || '#000000',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '4px'
                            }}
                            onClick={() => setSelectedElement(element.id)}
                            onMouseDown={(e) => {
                              const startX = e.clientX - (element.position?.x || 0)
                              const startY = e.clientY - (element.position?.y || 0)
                              const handleMouseMove = (e: MouseEvent) => {
                                updateElement(element.id, {
                                  position: {
                                    x: Math.max(0, e.clientX - startX),
                                    y: Math.max(0, e.clientY - startY)
                                  }
                                })
                              }
                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove)
                                document.removeEventListener('mouseup', handleMouseUp)
                              }
                              document.addEventListener('mousemove', handleMouseMove)
                              document.addEventListener('mouseup', handleMouseUp)
                            }}
                          >
                          {element.type === 'text' && (
                            <span>{element.content || element.placeholder || 'Click to edit text'}</span>
                          )}
                          {element.type === 'image' && (
                            element.content ? (
                              <img 
                                src={element.content} 
                                alt="Template Image" 
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs border-2 border-dashed border-gray-400">
                                📷 Click to add image
                              </div>
                            )
                          )}
                          
                          {element.type === 'divider' && (
                            <div 
                              className="bg-gray-400"
                              style={{
                                width: element.dividerType === 'vertical' ? '100%' : '100%',
                                height: element.dividerType === 'vertical' ? '100%' : '100%',
                                backgroundColor: element.style?.borderColor || '#666666'
                              }}
                            ></div>
                          )}
                          {element.type === 'table' && (
                            <div className="w-full h-full border text-xs overflow-hidden" style={{ borderColor: element.style?.borderColor }}>
                              <table className="w-full h-full border-collapse">
                                {element.tableConfig?.showHeader !== false && (
                                  <thead>
                                    <tr style={{ backgroundColor: element.tableConfig?.headerBg, color: element.tableConfig?.headerColor }}>
                                      {(element.tableConfig?.headers || ['Item','Qty','Rate','Amount']).map((header, i) => (
                                        <th
                                          key={i}
                                          className="border p-1"
                                          style={{ borderColor: element.style?.borderColor, textAlign: (element.tableConfig?.align?.[i] || 'left') as any, width: element.tableConfig?.columnWidths?.[i] ? `${element.tableConfig?.columnWidths?.[i]}%` : undefined }}
                                        >
                                          {header}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                )}
                                <tbody>
                                  {Array.from({ length: (element.tableConfig?.showHeader !== false) ? Math.max(1, (element.tableConfig?.rows || 3) - 1) : (element.tableConfig?.rows || 3) }).map((_, rowIndex) => (
                                    <tr key={rowIndex}>
                                      {Array.from({ length: element.tableConfig?.columns || (element.tableConfig?.headers?.length || 4) }).map((_, colIndex) => {
                                        const keys = element.tableConfig?.columnKeys || ['name','quantity','price','total']
                                        const sampleValues: any = { name: rowIndex === 0 ? 'Sample' : 'Item', quantity: 1, price: 100, total: 100 }
                                        const v = sampleValues[keys[colIndex] as keyof typeof sampleValues]
                                        const val = typeof v === 'number' && (keys[colIndex] === 'price' || keys[colIndex] === 'total') ? `₹${(v || 0).toFixed(0)}` : String(v ?? '')
                                        return (
                                          <td
                                            key={colIndex}
                                            className="border p-1"
                                            style={{ borderColor: element.style?.borderColor, textAlign: (element.tableConfig?.align?.[colIndex] || 'left') as any, width: element.tableConfig?.columnWidths?.[colIndex] ? `${element.tableConfig?.columnWidths?.[colIndex]}%` : undefined }}
                                          >
                                            {val}
                                          </td>
                                        )
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {(() => {
                                const cols = element.tableConfig?.columns || (element.tableConfig?.headers?.length || 4)
                                const widths = element.tableConfig?.columnWidths && element.tableConfig.columnWidths.length === cols
                                  ? element.tableConfig.columnWidths
                                  : Array(cols).fill(Math.round(100/cols))
                                const containerWidth = element.size?.width || 200
                                let acc = 0
                                return Array.from({ length: cols - 1 }).map((_, idx) => {
                                  acc += (widths[idx] / 100) * containerWidth
                                  const leftPos = acc - 3
                                  return (
                                    <div
                                      key={`resizer-${idx}`}
                                      onMouseDown={(e) => {
                                        e.stopPropagation()
                                        const startX = e.clientX
                                        const startWidths = widths.slice()
                                        const handleMove = (ev: MouseEvent) => {
                                          const deltaX = ev.clientX - startX
                                          const deltaPct = (deltaX / containerWidth) * 100
                                          let w1 = Math.max(5, startWidths[idx] + deltaPct)
                                          let w2 = Math.max(5, startWidths[idx+1] - deltaPct)
                                          const rest = widths.map((w, i) => i === idx ? w1 : i === idx+1 ? w2 : w)
                                          const sum = rest.reduce((a,b) => a + b, 0)
                                          const diff = 100 - sum
                                          if (Math.abs(diff) > 0.01) {
                                            const j = idx > 1 ? 0 : (idx+2 < cols ? idx+2 : 0)
                                            rest[j] = Math.max(5, rest[j] + diff)
                                          }
                                          updateElement(element.id, { tableConfig: { ...element.tableConfig!, columnWidths: rest } })
                                        }
                                        const handleUp = () => {
                                          document.removeEventListener('mousemove', handleMove)
                                          document.removeEventListener('mouseup', handleUp)
                                        }
                                        document.addEventListener('mousemove', handleMove)
                                        document.addEventListener('mouseup', handleUp)
                                      }}
                                      style={{ position: 'absolute', top: 0, left: leftPos, height: '100%', width: 6, cursor: 'col-resize', background: 'transparent' }}
                                    >
                                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 2, width: 2, background: '#3b82f6', opacity: selectedElement === element.id ? 0.8 : 0.4 }} />
                                    </div>
                                  )
                                })
                              })()}
                            </div>
                          )}
                          {selectedElement === element.id && (
                            <div
                              onMouseDown={(e) => {
                                e.stopPropagation()
                                const startX = e.clientX
                                const startY = e.clientY
                                const startWidth = element.size?.width || 200
                                const startHeight = element.size?.height || 30
                                const ratio = startWidth / (startHeight || 1)
                                const lockRatio = e.shiftKey && element.type === 'image'
                                setResizing({ id: element.id, startX, startY, startWidth, startHeight, lockRatio })
                                const handleMouseMove = (ev: MouseEvent) => {
                                  const deltaX = ev.clientX - startX
                                  const deltaY = ev.clientY - startY
                                  let newWidth = Math.max(50, startWidth + deltaX)
                                  let newHeight = Math.max(20, startHeight + deltaY)
                                  if (lockRatio) {
                                    newHeight = Math.max(20, newWidth / ratio)
                                  }
                                  updateElement(element.id, { size: { width: newWidth, height: newHeight } })
                                }
                                const handleMouseUp = () => {
                                  setResizing(null)
                                  document.removeEventListener('mousemove', handleMouseMove)
                                  document.removeEventListener('mouseup', handleMouseUp)
                                }
                                document.addEventListener('mousemove', handleMouseMove)
                                document.addEventListener('mouseup', handleMouseUp)
                              }}
                              style={{ position: 'absolute', right: -6, bottom: -6, width: 12, height: 12, background: '#3b82f6', borderRadius: 2, cursor: 'nwse-resize', boxShadow: '0 0 0 2px #ffffff' }}
                            />
                          )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Panel>
              <PanelResizeHandle className="mx-2">
                <div className="w-1 bg-gray-200 hover:bg-gray-300 rounded h-full" />
              </PanelResizeHandle>

              <Panel defaultSize={20} minSize={15} className="pl-2 overflow-y-auto overscroll-contain">
                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Elements ({elements.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto overscroll-contain">
                    <div className="space-y-2">
                      {elements.map((element, index) => (
                        <div
                          key={element.id}
                          className={`p-2 border rounded cursor-pointer text-sm ${
                            selectedElement === element.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-400'
                          }`}
                          onClick={() => setSelectedElement(element.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {element.type === 'text' && <Type className="w-3 h-3" />}
                              {element.type === 'image' && <Image className="w-3 h-3" />}
                              {element.type === 'table' && <Table className="w-3 h-3" />}
                              {element.type === 'divider' && (
                                element.dividerType === 'vertical' ? 
                                <span className="w-3 h-3 inline-block transform rotate-90 text-xs">|</span> : 
                                <Minus className="w-3 h-3" />
                              )}
                              <span className="text-xs font-medium capitalize">
                                {element.type === 'divider' ? `${element.dividerType || 'horizontal'} ${element.type}` : element.type}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteElement(element.id)
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="text-xs text-gray-500 mt-1 truncate">
                            {element.content || element.placeholder || `${element.type} element`}
                          </div>
                        </div>
                      ))}
                      {elements.length === 0 && (
                        <div className="text-center text-gray-500 py-8 text-sm">
                          No elements added yet.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Panel>
            </PanelGroup>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 p-4">
            <div className="h-full flex flex-col">
              <div className="bg-gray-100 p-4 rounded-lg flex-1 overflow-auto">
                <div 
                  className="relative bg-white border mx-auto shadow-lg"
                  style={{ width: '210mm', height: '297mm', transform: 'scale(0.5)', transformOrigin: 'top center' }}
                >
                  {elements.map((element) => {
                    let content = element.content || ''
                    if (element.placeholder) {
                      content = element.placeholder
                        .replace('{{tenant.companyName}}', 'Fashion Store')
                        .replace('{{tenant.address}}', '123 Main Street, City')
                        .replace('{{tenant.phone}}', '+91 9876543210')
                        .replace('{{tenant.email}}', 'store@fashion.com')
                        .replace('{{tenant.gst}}', '24AYZPV0035B1ZD')
                        .replace('{{tenant.logo}}', '/logo-placeholder.png')
                        .replace('{{invoice.billNo}}', 'INV-001')
                        .replace('{{invoice.date}}', '2024-01-15')
                        .replace('{{invoice.total}}', '₹1,250.00')
                        .replace('{{invoice.subtotal}}', '₹1,100.00')
                        .replace('{{invoice.tax}}', '₹150.00')
                        .replace('{{invoice.discount}}', '₹0.00')
                        .replace('{{customer.name}}', 'John Doe')
                        .replace('{{customer.phone}}', '+91 9876543210')
                        .replace('{{customer.address}}', '123 Customer Street, City')
                        .replace('{{customer.email}}', 'john@example.com')
                        .replace('{{user.name}}', 'Store Manager')
                        .replace('{{user.email}}', 'manager@fashion.com')
                        .replace('{{user.role}}', 'Manager')
                    }
                    
                    return (
                      <div
                        key={element.id}
                        style={{
                          position: 'absolute',
                          left: element.position?.x || 0,
                          top: element.position?.y || 0,
                          width: element.size?.width || 200,
                          height: element.size?.height || 30,
                          fontSize: element.style?.fontSize || 14,
                          fontWeight: element.style?.fontWeight || 'normal',
                          textAlign: element.style?.textAlign || 'left',
                          color: element.style?.color || '#000000',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px'
                        }}
                      >
                        {element.type === 'text' && <span>{content || 'Sample Text'}</span>}
                        {element.type === 'image' && (
                          element.content ? (
                            <img 
                              src={element.content} 
                              alt="Logo" 
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 border flex items-center justify-center text-xs">
                              [Store Logo]
                            </div>
                          )
                        )}
                        {element.type === 'table' && (
                          <div className="w-full h-full border text-xs overflow-hidden" style={{ borderColor: element.style?.borderColor }}>
                            <table className="w-full h-full border-collapse">
                              {element.tableConfig?.showHeader !== false && (
                                <thead>
                                  <tr style={{ backgroundColor: element.tableConfig?.headerBg, color: element.tableConfig?.headerColor }}>
                                    {(element.tableConfig?.headers || ['Item','Qty','Rate','Amount']).map((header, i) => (
                                      <th
                                        key={i}
                                        className="border p-1"
                                        style={{ borderColor: element.style?.borderColor, textAlign: (element.tableConfig?.align?.[i] || 'left') as any, width: element.tableConfig?.columnWidths?.[i] ? `${element.tableConfig?.columnWidths?.[i]}%` : undefined }}
                                      >
                                        {header}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                              )}
                              <tbody>
                                {Array.from({ length: (element.tableConfig?.showHeader !== false) ? Math.max(1, (element.tableConfig?.rows || 3) - 1) : (element.tableConfig?.rows || 3) }).map((_, r) => (
                                  <tr key={r}>
                                    {(element.tableConfig?.columnKeys || ['name','quantity','price','total']).map((k, i) => {
                                      const sample: any = { name: r === 0 ? 'Sample' : 'Item', quantity: 1, price: 100, total: 100 }
                                      const v = sample[k as keyof typeof sample]
                                      const val = typeof v === 'number' && (k === 'price' || k === 'total') ? `₹${(v as number).toFixed(0)}` : String(v ?? '')
                                      return (
                                        <td
                                          key={i}
                                          className="border p-1"
                                          style={{ borderColor: element.style?.borderColor, textAlign: (element.tableConfig?.align?.[i] || (k === 'quantity' ? 'center' : (k === 'price' || k === 'total' ? 'right' : 'left'))) as any, width: element.tableConfig?.columnWidths?.[i] ? `${element.tableConfig?.columnWidths?.[i]}%` : undefined }}
                                        >
                                          {val}
                                        </td>
                                      )
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {element.type === 'divider' && (
                          <div 
                            className="bg-gray-400"
                            style={{
                              width: '100%',
                              height: '100%',
                              backgroundColor: element.style?.borderColor || '#666666'
                            }}
                          ></div>
                        )}
                        
                      </div>
                    )
                  })}
                  
                  {elements.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-center p-8">
                      <div>
                        <div className="text-lg font-medium mb-2">No Elements Added</div>
                        <div className="text-sm">Add elements in the Design Editor to see your template preview</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>


      </div>
    </MainLayout>
  )
}
