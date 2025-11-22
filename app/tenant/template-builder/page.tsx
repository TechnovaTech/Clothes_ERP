"use client"

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CanvasEditor } from '@/components/template-builder/canvas-editor'
import { TemplatePreview } from '@/components/template-builder/template-preview'
import { TemplateElement } from '@/lib/template-engine'
import { showToast } from '@/lib/toast'
import { Palette, Eye, Save, RotateCcw } from 'lucide-react'

export default function TemplateBuilderPage() {
  const [elements, setElements] = useState<TemplateElement[]>([])
  const [templateType, setTemplateType] = useState('invoice')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('editor')

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
        // Delete current template to trigger default creation
        await fetch(`/api/templates?type=${templateType}`, { method: 'DELETE' })
        await loadTemplate()
        showToast.success('Template reset to default')
      } catch (error) {
        showToast.error('Failed to reset template')
      }
    }
  }

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
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>Template Customization</span>
              </CardTitle>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Template Type:</label>
                  <select
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value)}
                    className="px-3 py-1 border rounded-md"
                  >
                    <option value="invoice">Invoice/Bill</option>
                    <option value="report">Report</option>
                    <option value="certificate">Certificate</option>
                    <option value="email">Email Template</option>
                  </select>
                </div>
                <Button variant="outline" onClick={resetToDefault}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset to Default
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor" className="flex items-center space-x-2">
              <Palette className="w-4 h-4" />
              <span>Design Editor</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Live Preview</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-0">
            <Card className="p-0">
              <CanvasEditor
                elements={elements}
                onElementsChange={setElements}
                onSave={saveTemplate}
                saving={saving}
              />
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <TemplatePreview
              elements={elements}
              templateType={templateType}
            />
            <div className="flex justify-center">
              <Button onClick={saveTemplate} disabled={saving} size="lg">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Template'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Placeholders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Tenant Info</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>{'{{tenant.companyName}}'}</li>
                  <li>{'{{tenant.address}}'}</li>
                  <li>{'{{tenant.phone}}'}</li>
                  <li>{'{{tenant.email}}'}</li>
                  <li>{'{{tenant.gst}}'}</li>
                  <li>{'{{tenant.logo}}'}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Invoice Data</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>{'{{invoice.billNo}}'}</li>
                  <li>{'{{invoice.total}}'}</li>
                  <li>{'{{invoice.subtotal}}'}</li>
                  <li>{'{{invoice.tax}}'}</li>
                  <li>{'{{invoice.discount}}'}</li>
                  <li>{'{{invoice.date}}'}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Customer Info</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>{'{{customer.name}}'}</li>
                  <li>{'{{customer.phone}}'}</li>
                  <li>{'{{customer.address}}'}</li>
                  <li>{'{{customer.email}}'}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">User Info</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>{'{{user.name}}'}</li>
                  <li>{'{{user.email}}'}</li>
                  <li>{'{{user.role}}'}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}