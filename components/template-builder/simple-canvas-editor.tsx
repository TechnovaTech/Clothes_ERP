"use client"

import { useState } from 'react'
import { TemplateElement } from '@/lib/template-engine'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Type, Image, Table, Minus, Save } from 'lucide-react'

interface SimpleCanvasEditorProps {
  elements: TemplateElement[]
  onElementsChange: (elements: TemplateElement[]) => void
  onSave: () => void
  saving: boolean
}

export function SimpleCanvasEditor({ elements, onElementsChange, onSave, saving }: SimpleCanvasEditorProps) {
  const [selectedElement, setSelectedElement] = useState<string | null>(null)

  const addElement = (type: TemplateElement['type']) => {
    const newElement: TemplateElement = {
      id: `element-${Date.now()}`,
      type,
      content: type === 'text' ? 'New Text' : type === 'divider' ? '' : 'Element',
      position: { x: 50, y: 50 + elements.length * 40 },
      size: { width: type === 'divider' ? 300 : 200, height: type === 'divider' ? 2 : 30 },
      style: {
        fontSize: 14,
        fontWeight: 'normal',
        textAlign: 'left',
        color: '#000000'
      }
    }
    onElementsChange([...elements, newElement])
    setSelectedElement(newElement.id)
  }

  const updateElementPosition = (id: string, x: number, y: number) => {
    onElementsChange(elements.map(el => 
      el.id === id ? { ...el, position: { x, y } } : el
    ))
  }

  return (
    <div className="grid grid-cols-4 gap-4 h-full">
      {/* Toolbar */}
      <div className="col-span-1 space-y-2">
        <Button onClick={() => addElement('text')} className="w-full justify-start">
          <Type className="w-4 h-4 mr-2" />
          Add Text
        </Button>
        <Button onClick={() => addElement('image')} className="w-full justify-start" variant="outline">
          <Image className="w-4 h-4 mr-2" />
          Add Image
        </Button>
        <Button onClick={() => addElement('table')} className="w-full justify-start" variant="outline">
          <Table className="w-4 h-4 mr-2" />
          Add Table
        </Button>
        <Button onClick={() => addElement('divider')} className="w-full justify-start" variant="outline">
          <Minus className="w-4 h-4 mr-2" />
          Add Divider
        </Button>
        <Button onClick={onSave} disabled={saving} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Template'}
        </Button>
      </div>

      {/* Canvas */}
      <div className="col-span-3">
        <div 
          className="relative bg-white border-2 border-dashed border-gray-300 min-h-[500px] overflow-hidden"
          style={{ width: '100%', height: '500px' }}
        >
          {elements.map((element) => (
            <div
              key={element.id}
              className={`absolute cursor-move border-2 ${
                selectedElement === element.id ? 'border-blue-500' : 'border-transparent hover:border-gray-400'
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
                  updateElementPosition(element.id, e.clientX - startX, e.clientY - startY)
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
                <span>{element.content || element.placeholder || 'Text Element'}</span>
              )}
              {element.type === 'image' && (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs">
                  Image Placeholder
                </div>
              )}
              {element.type === 'table' && (
                <div className="w-full h-full border border-gray-300 flex items-center justify-center text-xs">
                  Items Table
                </div>
              )}
              {element.type === 'divider' && (
                <div className="w-full h-full bg-gray-400"></div>
              )}
            </div>
          ))}
          
          {elements.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              Click the buttons on the left to add elements to your template
            </div>
          )}
        </div>
      </div>
    </div>
  )
}