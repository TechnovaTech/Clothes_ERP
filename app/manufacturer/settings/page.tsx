'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings } from 'lucide-react'
import { showToast } from '@/lib/toast'

export default function ManufacturerSettings() {
  const [settings, setSettings] = useState({
    taxRate: 18,
    companyName: '',
    address: '',
    phone: '',
    email: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/manufacturer/settings')
      const data = await response.json()
      if (data.settings) {
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      const response = await fetch('/api/manufacturer/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      if (response.ok) {
        showToast.success('✅ Settings saved successfully!')
      } else {
        showToast.error('❌ Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      showToast.error('❌ Failed to save settings')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manufacturer Settings</h1>
        <p className="text-muted-foreground">Configure your manufacturer preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>General Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input 
                placeholder="Enter company name"
                value={settings.companyName}
                onChange={(e) => setSettings({...settings, companyName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email"
                placeholder="Enter email"
                value={settings.email}
                onChange={(e) => setSettings({...settings, email: e.target.value})}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input 
                placeholder="Enter phone number"
                value={settings.phone}
                onChange={(e) => setSettings({...settings, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Default Tax Rate (%)</Label>
              <Input 
                type="number"
                placeholder="Enter tax rate"
                value={settings.taxRate}
                onChange={(e) => setSettings({...settings, taxRate: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Address</Label>
            <Input 
              placeholder="Enter company address"
              value={settings.address}
              onChange={(e) => setSettings({...settings, address: e.target.value})}
            />
          </div>
          
          <Button onClick={saveSettings} className="w-full">
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}