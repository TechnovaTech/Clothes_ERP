"use client"

import { useState, useEffect, useRef } from 'react'
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
  const [future, setFuture] = useState<TemplateElement[][]>([])
  const [history, setHistory] = useState<TemplateElement[][]>([])
  const [templateType, setTemplateType] = useState('invoice')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('editor')
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [draggedElement, setDraggedElement] = useState<TemplateElement | null>(null)
  const [resizing, setResizing] = useState<{ id: string; startX: number; startY: number; startWidth: number; startHeight: number; lockRatio: boolean } | null>(null)
  const [elementsFilter, setElementsFilter] = useState('')
  const [zoom, setZoom] = useState(85)
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [snapSize, setSnapSize] = useState(5)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [guideV, setGuideV] = useState<number | null>(null)
  const [guideH, setGuideH] = useState<number | null>(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const alignSelection = (mode: 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY' | 'distributeX') => {
    const ids = selectedIds.length > 0 ? selectedIds : (selectedElement ? [selectedElement] : [])
    if (ids.length === 0) return
    const rect = canvasRef.current?.getBoundingClientRect()
    const pageW = rect?.width || 0
    const pageH = rect?.height || 0
    const els = ids.map(id => elements.find(e => e.id === id)).filter(Boolean) as TemplateElement[]
    if (els.length === 0) return
    const minX = Math.min(...els.map(e => e.position?.x || 0))
    const minY = Math.min(...els.map(e => e.position?.y || 0))
    const maxRight = Math.max(...els.map(e => (e.position?.x || 0) + (e.size?.width || 0)))
    const maxBottom = Math.max(...els.map(e => (e.position?.y || 0) + (e.size?.height || 0)))
    const groupW = maxRight - minX
    const groupH = maxBottom - minY
    if (mode === 'left') {
      ids.forEach(id => {
        const el = elements.find(e => e.id === id)
        if (!el) return
        const dx = (el.position?.x || 0) - minX
        updateElement(id, { position: { x: dx, y: el.position?.y || 0 } })
      })
      return
    }
    if (mode === 'right' && pageW) {
      const targetLeft = Math.max(0, pageW - groupW)
      ids.forEach(id => {
        const el = elements.find(e => e.id === id)
        if (!el) return
        const dx = (el.position?.x || 0) - minX
        updateElement(id, { position: { x: targetLeft + dx, y: el.position?.y || 0 } })
      })
      return
    }
    if (mode === 'top') {
      ids.forEach(id => {
        const el = elements.find(e => e.id === id)
        if (!el) return
        const dy = (el.position?.y || 0) - minY
        updateElement(id, { position: { x: el.position?.x || 0, y: dy } })
      })
      return
    }
    if (mode === 'bottom' && pageH) {
      const targetTop = Math.max(0, pageH - groupH)
      ids.forEach(id => {
        const el = elements.find(e => e.id === id)
        if (!el) return
        const dy = (el.position?.y || 0) - minY
        updateElement(id, { position: { x: el.position?.x || 0, y: targetTop + dy } })
      })
      return
    }
    if (mode === 'centerX' && pageW) {
      const groupCenter = minX + groupW / 2
      const pageCenter = pageW / 2
      const dxAll = Math.max(0, pageCenter - groupCenter)
      ids.forEach(id => {
        const el = elements.find(e => e.id === id)
        if (!el) return
        updateElement(id, { position: { x: Math.max(0, (el.position?.x || 0) + dxAll), y: el.position?.y || 0 } })
      })
      return
    }
    if (mode === 'centerY' && pageH) {
      const groupCenter = minY + groupH / 2
      const pageCenter = pageH / 2
      const dyAll = Math.max(0, pageCenter - groupCenter)
      ids.forEach(id => {
        const el = elements.find(e => e.id === id)
        if (!el) return
        updateElement(id, { position: { x: el.position?.x || 0, y: Math.max(0, (el.position?.y || 0) + dyAll) } })
      })
      return
    }
    if (mode === 'distributeX') {
      const sorted = els.slice().sort((a,b) => (a.position?.x || 0) - (b.position?.x || 0))
      const totalWidth = sorted.reduce((acc,e) => acc + (e.size?.width || 0), 0)
      const gapCount = Math.max(1, sorted.length - 1)
      const available = Math.max(0, groupW - totalWidth)
      const gap = Math.floor(available / gapCount)
      let cursor = minX
      sorted.forEach(e => {
        updateElement(e.id, { position: { x: cursor, y: e.position?.y || 0 } })
        cursor += (e.size?.width || 0) + gap
      })
      return
    }
  }

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
    setFuture([])
    setElements([...elements, newElement])
    setSelectedElement(newElement.id)
  }

  const updateElement = (id: string, updates: Partial<TemplateElement>) => {
    setHistory((h) => [...h, elements])
    setFuture([])
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el))
  }

  const deleteElement = (id: string) => {
    setHistory((h) => [...h, elements])
    setFuture([])
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
      setFuture([])
      setElements([...elements, newElement])
    }
  }

  const undo = () => {
    setHistory((h) => {
      if (h.length === 0) return h
      const prev = h[h.length - 1]
      setFuture((f) => [...f, elements])
      setElements(prev)
      const sel = selectedElement && prev.find((el) => el.id === selectedElement) ? selectedElement : null
      setSelectedElement(sel)
      return h.slice(0, -1)
    })
  }

  const redo = () => {
    setFuture((f) => {
      if (f.length === 0) return f
      const next = f[f.length - 1]
      setHistory((h) => [...h, elements])
      setElements(next)
      const sel = selectedElement && next.find((el) => el.id === selectedElement) ? selectedElement : null
      setSelectedElement(sel)
      return f.slice(0, -1)
    })
  }

  const selectedEl = elements.find(el => el.id === selectedElement)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeIds = selectedIds.length > 0 ? selectedIds : (selectedElement ? [selectedElement] : [])
      if (activeIds.length === 0) return
      const first = elements.find(x => x.id === activeIds[0])
      if (!first) return
      const step = e.shiftKey ? 10 : 1
      const moveStep = snapEnabled ? snapSize : step
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && e.shiftKey) {
        e.preventDefault()
        redo()
        return
      }
      if (e.metaKey || e.ctrlKey) {
        if (['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'].includes(e.key)) {
          e.preventDefault()
          for (const id of activeIds) {
            const el = elements.find(x => x.id === id)
            if (!el) continue
            if (e.key === 'ArrowRight') {
              updateElement(id, { size: { width: (el.size?.width || 200) + step, height: el.size?.height || 30 } })
            } else if (e.key === 'ArrowLeft') {
              updateElement(id, { size: { width: Math.max(50, (el.size?.width || 200) - step), height: el.size?.height || 30 } })
            } else if (e.key === 'ArrowDown') {
              updateElement(id, { size: { width: el.size?.width || 200, height: (el.size?.height || 30) + step } })
            } else if (e.key === 'ArrowUp') {
              updateElement(id, { size: { width: el.size?.width || 200, height: Math.max(20, (el.size?.height || 30) - step) } })
            }
          }
        }
      } else {
        if (['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'].includes(e.key)) {
          e.preventDefault()
          for (const id of activeIds) {
            const el = elements.find(x => x.id === id)
            if (!el) continue
            if (e.key === 'ArrowRight') {
              updateElement(id, { position: { x: (el.position?.x || 0) + moveStep, y: el.position?.y || 0 } })
            } else if (e.key === 'ArrowLeft') {
              updateElement(id, { position: { x: Math.max(0, (el.position?.x || 0) - moveStep), y: el.position?.y || 0 } })
            } else if (e.key === 'ArrowDown') {
              updateElement(id, { position: { x: el.position?.x || 0, y: (el.position?.y || 0) + moveStep } })
            } else if (e.key === 'ArrowUp') {
              updateElement(id, { position: { x: el.position?.x || 0, y: Math.max(0, (el.position?.y || 0) - moveStep) } })
            }
          }
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElement, selectedIds, elements, snapEnabled, snapSize])

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
            <div className="hidden md:flex items-center space-x-2">
              <Input
                placeholder="Search elements"
                value={elementsFilter}
                onChange={(e) => setElementsFilter(e.target.value)}
                className="h-8 w-48"
              />
            </div>
            <div className="hidden lg:flex items-center space-x-1">
              <Button variant="outline" size="sm" onClick={() => alignSelection('left')}>Align Left</Button>
              <Button variant="outline" size="sm" onClick={() => alignSelection('centerX')}>Center X</Button>
              <Button variant="outline" size="sm" onClick={() => alignSelection('right')}>Align Right</Button>
              <Button variant="outline" size="sm" onClick={() => alignSelection('top')}>Align Top</Button>
              <Button variant="outline" size="sm" onClick={() => alignSelection('centerY')}>Center Y</Button>
              <Button variant="outline" size="sm" onClick={() => alignSelection('bottom')}>Align Bottom</Button>
              <Button variant="outline" size="sm" onClick={() => alignSelection('distributeX')}>Distribute X</Button>
            </div>
            <Button variant="outline" size="sm" onClick={redo} disabled={future.length === 0}>
              <RotateCcw className="w-4 h-4 mr-1 rotate-180" />
              Redo
            </Button>
            <Button variant="outline" size="sm" onClick={undo} disabled={history.length === 0}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Undo
            </Button>
          <Button variant="outline" size="sm" onClick={resetToDefault}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
            <div className="hidden md:flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <label className="text-sm">Zoom</label>
                <Input
                  type="number"
                  value={zoom}
                  onChange={(e) => setZoom(Math.max(10, Math.min(200, Number(e.target.value) || 85)))}
                  className="h-8 w-20"
                />
                <input
                  type="range"
                  min={50}
                  max={200}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm">%</span>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm">Snap</label>
                <select
                  value={snapEnabled ? 'on' : 'off'}
                  onChange={(e) => setSnapEnabled(e.target.value === 'on')}
                  className="h-8 text-sm border rounded px-2"
                >
                  <option value="on">On</option>
                  <option value="off">Off</option>
                </select>
                <Input
                  type="number"
                  value={snapSize}
                  onChange={(e) => setSnapSize(Math.max(1, Number(e.target.value) || 5))}
                  className="h-8 w-16"
                />
                <span className="text-sm">px</span>
              </div>
            </div>
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
                                <SelectItem value="{{invoice.series}}">Invoice Series</SelectItem>
                                <SelectItem value="{{invoice.number}}">Invoice Number</SelectItem>
                                <SelectItem value="{{invoice.date}}">Bill Date</SelectItem>
                                <SelectItem value="{{invoice.total}}">Total Amount</SelectItem>
                                <SelectItem value="{{invoice.subtotal}}">Subtotal</SelectItem>
                                <SelectItem value="{{invoice.taxBreakup.cgst}}">CGST</SelectItem>
                                <SelectItem value="{{invoice.taxBreakup.sgst}}">SGST</SelectItem>
                                <SelectItem value="{{invoice.taxBreakup.igst}}">IGST</SelectItem>
                                <SelectItem value="{{invoice.taxBreakup.cess}}">CESS</SelectItem>
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
                                  const deriveCols = () => {
                                    const c = selectedEl.tableConfig?.columns
                                    if (c && c > 0) return c
                                    const lengths = [
                                      selectedEl.tableConfig?.headers?.length || 0,
                                      selectedEl.tableConfig?.columnKeys?.length || 0,
                                      selectedEl.tableConfig?.align?.length || 0,
                                      selectedEl.tableConfig?.columnWidths?.length || 0,
                                    ]
                                    const m = Math.max(...lengths)
                                    return m > 0 ? m : 4
                                  }
                                  const cols = deriveCols()
                                  const equal = Array(cols).fill(Math.round(100 / cols))
                                  updateElement(selectedEl.id, { tableConfig: { ...selectedEl.tableConfig!, columns: cols, columnWidths: equal } })
                                }}
                                className="h-7 px-2 text-xs"
                              >
                                Distribute Widths
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const defaultHeaders = ['Item','Qty','Rate','Amount']
                                  const prevCols = selectedEl.tableConfig?.columns || (selectedEl.tableConfig?.headers?.length || defaultHeaders.length)
                                  if (prevCols <= 1) return
                                  const headers = (selectedEl.tableConfig?.headers && selectedEl.tableConfig.headers.length > 0) ? [...selectedEl.tableConfig.headers] : defaultHeaders.slice()
                                  const keys = (selectedEl.tableConfig?.columnKeys && selectedEl.tableConfig.columnKeys.length > 0) ? [...selectedEl.tableConfig.columnKeys] : Array(headers.length).fill('')
                                  const align = (selectedEl.tableConfig?.align && selectedEl.tableConfig.align.length > 0) ? [...(selectedEl.tableConfig.align as any)] : Array(headers.length).fill('left')
                                  let widths = (selectedEl.tableConfig?.columnWidths && selectedEl.tableConfig.columnWidths.length === prevCols) ? [...selectedEl.tableConfig.columnWidths] : Array(prevCols).fill(Math.round(100 / prevCols))
                                  // Remove last column
                                  headers.pop()
                                  keys.pop()
                                  align.pop()
                                  widths = widths.slice(0, prevCols - 1)
                                  updateElement(selectedEl.id, { tableConfig: { ...selectedEl.tableConfig!, columns: prevCols - 1, headers, columnKeys: keys, align, columnWidths: widths } })
                                }}
                                className="h-7 px-2 text-xs"
                              >
                                Remove Column
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  const defaultHeaders = ['Item','Qty','Rate','Amount']
                                  const headersBase = (selectedEl.tableConfig?.headers && selectedEl.tableConfig.headers.length > 0)
                                    ? [...selectedEl.tableConfig.headers]
                                    : defaultHeaders.slice()
                                  const prevCols = selectedEl.tableConfig?.columns || headersBase.length
                                  const cols = prevCols + 1
                                  const defaultKeys = ['name','quantity','price','total']
                                  const keysBase = Array.from({ length: prevCols }, (_, i) => {
                                    const k = selectedEl.tableConfig?.columnKeys?.[i]
                                    return k !== undefined ? k : (defaultKeys[i] ?? '')
                                  })
                                  const alignBase = (selectedEl.tableConfig?.align && selectedEl.tableConfig.align.length > 0)
                                    ? [...(selectedEl.tableConfig.align as any)]
                                    : Array(headersBase.length).fill('left')
                                  let widthsBase = (selectedEl.tableConfig?.columnWidths && selectedEl.tableConfig.columnWidths.length === prevCols)
                                    ? [...selectedEl.tableConfig.columnWidths]
                                    : Array(prevCols).fill(Math.round(100 / prevCols))
                                  // Append new column without touching existing values
                                  const headers = [...headersBase, `Col ${cols}`]
                                  const keys = [...keysBase, '']
                                  const aligns = [...alignBase, 'left'] as any
                                  // Add a new width using remaining percentage
                                  const used = widthsBase.reduce((a,b)=>a+b,0)
                                  const leftover = Math.max(5, 100 - used)
                                  const widths = [...widthsBase, leftover]
                                  updateElement(selectedEl.id, {
                                    tableConfig: {
                                      ...selectedEl.tableConfig!,
                                      columns: cols,
                                      headers,
                                      columnKeys: keys,
                                      align: aligns,
                                      columnWidths: widths
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
                                    <SelectItem value="unit">unit</SelectItem>
                                    <SelectItem value="itemCode">itemCode</SelectItem>
                                    <SelectItem value="hsn">hsn</SelectItem>
                                    <SelectItem value="gstRate">gstRate</SelectItem>
                                    <SelectItem value="gstAmount">gstAmount</SelectItem>
                                    <SelectItem value="cgst">cgst</SelectItem>
                                    <SelectItem value="sgst">sgst</SelectItem>
                                    <SelectItem value="igst">igst</SelectItem>
                                    <SelectItem value="discountRate">discountRate</SelectItem>
                                    <SelectItem value="discountAmount">discountAmount</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="col-span-3">
                                <Label className="text-xs">Width (%)</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  max={100}
                                  step={1}
                                  value={(selectedEl.tableConfig?.columnWidths || [])[i] ?? Math.round(100 / ((selectedEl.tableConfig?.columns) || 4))}
                                  onChange={(e) => {
                                    const cols = Math.max(1, selectedEl.tableConfig?.columns || (selectedEl.tableConfig?.headers?.length || 4))
                                    let widths = [...(selectedEl.tableConfig?.columnWidths || Array(cols).fill(Math.round(100 / cols)))]
                                    const entered = Math.max(1, Math.min(100, Number(e.target.value) || 0))
                                    widths[i] = entered
                                    const sum = widths.reduce((a,b) => a + b, 0)
                                    if (sum !== 100) {
                                      const diff = 100 - sum
                                      const j = i === 0 ? 1 : 0
                                      widths[j] = Math.max(1, Math.min(100, widths[j] + diff))
                                    }
                                    updateElement(selectedEl.id, { tableConfig: { ...selectedEl.tableConfig!, columnWidths: widths } })
                                  }}
                                  className="h-8 w-24 text-xs"
                                />
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
                                onChange={(e) => {
                                  const defaultHeaders = ['Item','Qty','Rate','Amount']
                                  const prevCols = selectedEl.tableConfig?.columns || (selectedEl.tableConfig?.headers?.length || defaultHeaders.length)
                                  const nextCols = Math.max(1, Math.min(10, Number(e.target.value) || prevCols))
                                  if (nextCols === prevCols) return
                                  const headers = (selectedEl.tableConfig?.headers && selectedEl.tableConfig.headers.length > 0)
                                    ? [...selectedEl.tableConfig.headers]
                                    : defaultHeaders.slice()
                                  const defaultKeys = ['name','quantity','price','total']
                                  const keys = Array.from({ length: prevCols }, (_, i) => {
                                    const k = selectedEl.tableConfig?.columnKeys?.[i]
                                    return k !== undefined ? k : (defaultKeys[i] ?? '')
                                  })
                                  const align = (selectedEl.tableConfig?.align && selectedEl.tableConfig.align.length > 0)
                                    ? [...(selectedEl.tableConfig.align as any)]
                                    : Array(headers.length).fill('left')
                                  let widths = (selectedEl.tableConfig?.columnWidths && selectedEl.tableConfig.columnWidths.length === prevCols)
                                    ? [...selectedEl.tableConfig.columnWidths]
                                    : Array(prevCols).fill(Math.round(100 / prevCols))
                                  if (nextCols > prevCols) {
                                    for (let i = prevCols; i < nextCols; i++) {
                                      headers.push(`Col ${i+1}`)
                                      keys.push('')
                                      align.push('left' as any)
                                    }
                                    const used = widths.reduce((a,b)=>a+b,0)
                                    const leftover = Math.max(5, 100 - used)
                                    widths.push(leftover)
                                  } else {
                                    headers.splice(nextCols)
                                    keys.splice(nextCols)
                                    align.splice(nextCols)
                                    widths = widths.slice(0, nextCols)
                                  }
                                  updateElement(selectedEl.id, { tableConfig: { ...selectedEl.tableConfig!, columns: nextCols, headers, columnKeys: keys, align, columnWidths: widths } })
                                }}
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
                              <Label className="text-sm">Font Family</Label>
                              <select
                                value={selectedEl.style?.fontFamily || 'system-ui'}
                                onChange={(e) => updateElement(selectedEl.id, { style: { ...selectedEl.style!, fontFamily: e.target.value } })}
                                className="h-8 text-sm border rounded px-2 w-full"
                              >
                                <option value="system-ui">System</option>
                                <option value="Arial">Arial</option>
                                <option value="Georgia">Georgia</option>
                                <option value="Times New Roman">Times New Roman</option>
                                <option value="Roboto">Roboto</option>
                              </select>
                            </div>
                            <div>
                              <Label className="text-sm">Line Height</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={selectedEl.style?.lineHeight || 1.2}
                                onChange={(e) => updateElement(selectedEl.id, { style: { ...selectedEl.style!, lineHeight: Number(e.target.value) } })}
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-sm">Letter Spacing</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={selectedEl.style?.letterSpacing || 0}
                                onChange={(e) => updateElement(selectedEl.id, { style: { ...selectedEl.style!, letterSpacing: Number(e.target.value) } })}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Transform</Label>
                              <select
                                value={selectedEl.style?.textTransform || 'none'}
                                onChange={(e) => updateElement(selectedEl.id, { style: { ...selectedEl.style!, textTransform: e.target.value as any } })}
                                className="h-8 text-sm border rounded px-2 w-full"
                              >
                                <option value="none">None</option>
                                <option value="uppercase">Uppercase</option>
                                <option value="lowercase">Lowercase</option>
                                <option value="capitalize">Capitalize</option>
                              </select>
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
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-sm">Background</Label>
                          <Input
                            type="color"
                            value={selectedEl.style?.backgroundColor || '#ffffff'}
                            onChange={(e) => updateElement(selectedEl.id, { style: { ...selectedEl.style!, backgroundColor: e.target.value } })}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Padding</Label>
                          <Input
                            type="number"
                            value={selectedEl.style?.padding ?? 8}
                            onChange={(e) => updateElement(selectedEl.id, { style: { ...selectedEl.style!, padding: Number(e.target.value) } })}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-sm">Border Color</Label>
                          <Input
                            type="color"
                            value={selectedEl.style?.borderColor || '#000000'}
                            onChange={(e) => updateElement(selectedEl.id, { style: { ...selectedEl.style!, borderColor: e.target.value } })}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Border Width</Label>
                          <Input
                            type="number"
                            value={selectedEl.style?.borderWidth ?? 0}
                            onChange={(e) => updateElement(selectedEl.id, { style: { ...selectedEl.style!, borderWidth: Number(e.target.value) } })}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-sm">Border Style</Label>
                          <select
                            value={selectedEl.style?.borderStyle || 'solid'}
                            onChange={(e) => updateElement(selectedEl.id, { style: { ...selectedEl.style!, borderStyle: e.target.value as any } })}
                            className="h-8 text-sm border rounded px-2 w-full"
                          >
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="dotted">Dotted</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-sm">Border Radius</Label>
                          <Input
                            type="number"
                            value={selectedEl.style?.borderRadius ?? 0}
                            onChange={(e) => updateElement(selectedEl.id, { style: { ...selectedEl.style!, borderRadius: Number(e.target.value) } })}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-sm">Opacity</Label>
                          <Input
                            type="number"
                            step="0.05"
                            min="0"
                            max="1"
                            value={selectedEl.style?.opacity ?? 1}
                            onChange={(e) => updateElement(selectedEl.id, { style: { ...selectedEl.style!, opacity: Number(e.target.value) } })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Z Index</Label>
                          <Input
                            type="number"
                            value={selectedEl.style?.zIndex ?? 0}
                            onChange={(e) => updateElement(selectedEl.id, { style: { ...selectedEl.style!, zIndex: Number(e.target.value) } })}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      {selectedEl.type === 'image' && (
                        <div>
                          <Label className="text-sm">Fit</Label>
                          <select
                            value={selectedEl.style?.objectFit || 'contain'}
                            onChange={(e) => updateElement(selectedEl.id, { style: { ...selectedEl.style!, objectFit: e.target.value as any } })}
                            className="h-8 text-sm border rounded px-2 w-full"
                          >
                            <option value="contain">Contain</option>
                            <option value="cover">Cover</option>
                          </select>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => updateElement(selectedEl.id, { locked: !selectedEl.locked })}>Lock</Button>
                        <Button size="sm" variant="outline" onClick={() => updateElement(selectedEl.id, { hidden: !selectedEl.hidden })}>Hide</Button>
                        <Button size="sm" variant="outline" onClick={() => updateElement(selectedEl.id, { style: { ...selectedEl.style!, zIndex: (selectedEl.style?.zIndex ?? 0) + 1 } })}>Bring Forward</Button>
                        <Button size="sm" variant="outline" onClick={() => updateElement(selectedEl.id, { style: { ...selectedEl.style!, zIndex: Math.max(0, (selectedEl.style?.zIndex ?? 0) - 1) } })}>Send Backward</Button>
                      </div>
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
                          transform: `scale(${zoom/100})`,
                          transformOrigin: 'top center',
                          marginTop: '20px'
                        }}
                        onMouseDown={(e) => {
                          if (e.target === e.currentTarget) {
                            setSelectedElement(null)
                            const rect = canvasRef.current?.getBoundingClientRect()
                            const startX = e.clientX - (rect?.left || 0)
                            const startY = e.clientY - (rect?.top || 0)
                            setSelectionRect({ x: startX, y: startY, w: 0, h: 0 })
                            const startIds = e.shiftKey || e.ctrlKey || e.metaKey ? new Set(selectedIds) : new Set<string>()
                            const handleMove = (ev: MouseEvent) => {
                              const curX = ev.clientX - (rect?.left || 0)
                              const curY = ev.clientY - (rect?.top || 0)
                              const x = Math.min(startX, curX)
                              const y = Math.min(startY, curY)
                              const w = Math.abs(curX - startX)
                              const h = Math.abs(curY - startY)
                              setSelectionRect({ x, y, w, h })
                              const nextIds = new Set(startIds)
                              elements.forEach((el) => {
                                const ex = el.position?.x || 0
                                const ey = el.position?.y || 0
                                const ew = el.size?.width || 200
                                const eh = el.size?.height || 30
                                const intersects = !(ex + ew < x || ex > x + w || ey + eh < y || ey > y + h)
                                if (intersects) nextIds.add(el.id)
                              })
                              setSelectedIds(Array.from(nextIds))
                            }
                            const handleUp = () => {
                              setSelectionRect(null)
                              document.removeEventListener('mousemove', handleMove)
                              document.removeEventListener('mouseup', handleUp)
                            }
                            document.addEventListener('mousemove', handleMove)
                            document.addEventListener('mouseup', handleUp)
                          }
                        }}
                      >
                        <div ref={canvasRef} className="absolute inset-0 pointer-events-none">
                          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-red-300 opacity-40" />
                          <div className="absolute top-1/2 left-0 right-0 h-px bg-red-300 opacity-40" />
                          {guideV !== null && (
                            <div className="absolute top-0 bottom-0 w-px bg-blue-500" style={{ left: guideV }} />
                          )}
                          {guideH !== null && (
                            <div className="absolute left-0 right-0 h-px bg-blue-500" style={{ top: guideH }} />
                          )}
                          {selectionRect && (
                            <div
                              className="absolute border-2 border-blue-400 bg-blue-200/20"
                              style={{ left: selectionRect.x, top: selectionRect.y, width: selectionRect.w, height: selectionRect.h }}
                            />
                          )}
                        </div>
                        {elements.map((element) => element.hidden ? null : (
                          <div
                            key={element.id}
                            className={`absolute cursor-pointer border-2 ${
                              (selectedElement === element.id || selectedIds.includes(element.id)) ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-gray-400'
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
                              backgroundColor: element.style?.backgroundColor,
                              borderColor: element.style?.borderColor,
                              borderWidth: element.style?.borderWidth,
                              borderStyle: element.style?.borderStyle || 'solid',
                              borderRadius: element.style?.borderRadius,
                              opacity: element.style?.opacity ?? 1,
                              zIndex: element.style?.zIndex ?? 0,
                              display: 'flex',
                              alignItems: 'center',
                              padding: `${element.style?.padding ?? 4}px`
                            }}
                            onClick={(e) => {
                              if (e.shiftKey || e.metaKey || e.ctrlKey) {
                                setSelectedIds((prev) => prev.includes(element.id) ? prev.filter(id => id !== element.id) : [...prev, element.id])
                              } else {
                                setSelectedElement(element.id)
                                setSelectedIds([element.id])
                              }
                            }}
                            onMouseDown={(e) => {
                              if (element.locked) return
                              const startX = e.clientX - (element.position?.x || 0)
                              const startY = e.clientY - (element.position?.y || 0)
                              const pageRect = canvasRef.current?.getBoundingClientRect()
                              const pageW = pageRect?.width || 0
                              const pageH = pageRect?.height || 0
                              const activeIds = selectedIds.length > 0 ? selectedIds : [element.id]
                              const startPositions = new Map<string, {x:number,y:number}>()
                              activeIds.forEach((id) => {
                                const el = elements.find(x => x.id === id)
                                if (el) startPositions.set(id, { x: el.position?.x || 0, y: el.position?.y || 0 })
                              })
                              const handleMouseMove = (e: MouseEvent) => {
                                const newX = Math.max(0, snapEnabled ? Math.round((e.clientX - startX) / snapSize) * snapSize : (e.clientX - startX))
                                const newY = Math.max(0, snapEnabled ? Math.round((e.clientY - startY) / snapSize) * snapSize : (e.clientY - startY))
                                let snappedX = newX
                                let snappedY = newY
                                setGuideV(null); setGuideH(null)
                                if (pageW && pageH) {
                                  const centerX = pageW / 2
                                  const centerY = pageH / 2
                                  const elCenterX = newX + (element.size?.width || 200) / 2
                                  const elCenterY = newY + (element.size?.height || 30) / 2
                                  if (Math.abs(centerX - elCenterX) <= 5) {
                                    snappedX = Math.max(0, centerX - (element.size?.width || 200) / 2)
                                    setGuideV(centerX)
                                  }
                                  if (Math.abs(centerY - elCenterY) <= 5) {
                                    snappedY = Math.max(0, centerY - (element.size?.height || 30) / 2)
                                    setGuideH(centerY)
                                  }
                                  for (const other of elements) {
                                    if (other.id === element.id) continue
                                    const oLeft = other.position?.x || 0
                                    const oTop = other.position?.y || 0
                                    const oRight = oLeft + (other.size?.width || 200)
                                    const oBottom = oTop + (other.size?.height || 30)
                                    const oCenterX = oLeft + (other.size?.width || 200) / 2
                                    const oCenterY = oTop + (other.size?.height || 30) / 2
                                    const eLeft = newX
                                    const eTop = newY
                                    const eRight = eLeft + (element.size?.width || 200)
                                    const eBottom = eTop + (element.size?.height || 30)
                                    const eCenterX = eLeft + (element.size?.width || 200) / 2
                                    const eCenterY = eTop + (element.size?.height || 30) / 2
                                    if (Math.abs(eLeft - oLeft) <= 5) { snappedX = oLeft; setGuideV(oLeft) }
                                    if (Math.abs(eRight - oRight) <= 5) { snappedX = oRight - (element.size?.width || 200); setGuideV(oRight) }
                                    if (Math.abs(eCenterX - oCenterX) <= 5) { snappedX = oCenterX - (element.size?.width || 200)/2; setGuideV(oCenterX) }
                                    if (Math.abs(eTop - oTop) <= 5) { snappedY = oTop; setGuideH(oTop) }
                                    if (Math.abs(eBottom - oBottom) <= 5) { snappedY = oBottom - (element.size?.height || 30); setGuideH(oBottom) }
                                    if (Math.abs(eCenterY - oCenterY) <= 5) { snappedY = oCenterY - (element.size?.height || 30)/2; setGuideH(oCenterY) }
                                  }
                                }
                                activeIds.forEach((id) => {
                                  const start = startPositions.get(id)
                                  if (!start) return
                                  const dx = snappedX - (element.position?.x || 0)
                                  const dy = snappedY - (element.position?.y || 0)
                                  updateElement(id, { position: { x: Math.max(0, (start.x + dx)), y: Math.max(0, (start.y + dy)) } })
                                })
                              }
                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove)
                                document.removeEventListener('mouseup', handleMouseUp)
                                setGuideV(null); setGuideH(null)
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
                                className={`w-full h-full ${element.style?.objectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
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
                                        const sampleValues: any = { name: rowIndex === 0 ? 'Sample' : 'Item', quantity: 1, price: 100, total: 100, sku: 'SKU123', unit: 'pcs', itemCode: 'ITM-001', hsn: '6201', gstRate: 18, gstAmount: 18, cgst: 9, sgst: 9, igst: 0, discountRate: 0, discountAmount: 0 }
                                        const v = sampleValues[keys[colIndex] as keyof typeof sampleValues]
                                        const numericCurrency = ['price','total','cgst','sgst','igst','gstAmount','discountAmount']
                                        const numericPercent = ['gstRate','discountRate']
                                        const val = typeof v === 'number' ? (numericCurrency.includes(keys[colIndex]) ? `₹${(v || 0).toFixed(0)}` : (numericPercent.includes(keys[colIndex]) ? `${(v || 0).toFixed(0)}%` : String(v))) : String(v ?? '')
                                        return (
                                          <td
                                            key={colIndex}
                                            className="border"
                                            style={{ borderColor: element.style?.borderColor, padding: `${element.tableConfig?.cellPadding ?? 8}px`, textAlign: (element.tableConfig?.align?.[colIndex] || 'left') as any, width: element.tableConfig?.columnWidths?.[colIndex] ? `${element.tableConfig?.columnWidths?.[colIndex]}%` : undefined }}
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
                          {selectedElement === element.id && !element.locked && (
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
                      {elements
                        .filter((el) => {
                          const q = elementsFilter.toLowerCase()
                          if (!q) return true
                          return (
                            el.type.toLowerCase().includes(q) ||
                            (el.content || '').toLowerCase().includes(q) ||
                            (el.placeholder || '').toLowerCase().includes(q)
                          )
                        })
                        .map((element, index) => (
                        <div
                          key={element.id}
                          className={`p-2 border rounded cursor-pointer text-sm ${
                            selectedElement === element.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-400'
                          }`}
                          onClick={(e) => {
                            if (e.shiftKey || e.metaKey || e.ctrlKey) {
                              setSelectedIds((prev) => prev.includes(element.id) ? prev.filter(id => id !== element.id) : [...prev, element.id])
                            } else {
                              setSelectedElement(element.id)
                              setSelectedIds([element.id])
                            }
                          }}
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
                  style={{ width: '210mm', height: '297mm', transform: `scale(${zoom/100})`, transformOrigin: 'top center' }}
                >
                  {elements.filter((el) => !el.hidden).map((element) => {
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
                          backgroundColor: element.style?.backgroundColor,
                          borderColor: element.style?.borderColor,
                          borderWidth: element.style?.borderWidth,
                          borderStyle: element.style?.borderStyle || 'solid',
                          borderRadius: element.style?.borderRadius,
                          opacity: element.style?.opacity ?? 1,
                          zIndex: element.style?.zIndex ?? 0,
                          display: 'flex',
                          alignItems: 'center',
                          padding: `${element.style?.padding ?? 4}px`
                        }}
                      >
                        {element.type === 'text' && <span>{content || 'Sample Text'}</span>}
                        {element.type === 'image' && (
                          element.content ? (
                            <img 
                              src={element.content} 
                              alt="Logo" 
                              className={`w-full h-full ${element.style?.objectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
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
                                        className="border"
                                        style={{ borderColor: element.style?.borderColor, padding: `${element.tableConfig?.cellPadding ?? 8}px`, textAlign: (element.tableConfig?.align?.[i] || 'left') as any, width: element.tableConfig?.columnWidths?.[i] ? `${element.tableConfig?.columnWidths?.[i]}%` : undefined }}
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
                                          className="border"
                                          style={{ borderColor: element.style?.borderColor, padding: `${element.tableConfig?.cellPadding ?? 8}px`, textAlign: (element.tableConfig?.align?.[i] || (k === 'quantity' ? 'center' : (k === 'price' || k === 'total' ? 'right' : 'left'))) as any, width: element.tableConfig?.columnWidths?.[i] ? `${element.tableConfig?.columnWidths?.[i]}%` : undefined }}
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
