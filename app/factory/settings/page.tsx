"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Save, Building2, User } from "lucide-react"

export default function FactorySettingsPage() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/factory/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || {})
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (section: string, data: any) => {
    setSaving(true)
    try {
      const updatedSettings = { ...settings, [section]: data }
      const response = await fetch('/api/factory/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      })
      
      if (response.ok) {
        setSettings(updatedSettings)
        alert('Settings saved successfully!')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6"><div className="text-center py-8">Loading settings...</div></div>
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Factory Settings</h1>
        <p className="text-muted-foreground">Configure factory preferences and settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Factory Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="pb-2">Factory Name</Label>
              <Input 
                placeholder="Enter factory name (e.g., Main Production Unit)"
                defaultValue={settings.factory?.name || ''} 
              />
            </div>
            <div>
              <Label className="pb-2">Address</Label>
              <Input 
                placeholder="Enter factory address (e.g., 123 Industrial Area, City)"
                defaultValue={settings.factory?.address || ''} 
              />
            </div>
            <div>
              <Label className="pb-2">Phone</Label>
              <Input 
                placeholder="Enter phone number (e.g., +91 9876543210)"
                defaultValue={settings.factory?.phone || ''} 
              />
            </div>
            <div>
              <Label className="pb-2">Email</Label>
              <Input 
                placeholder="Enter email address (e.g., factory@company.com)"
                defaultValue={settings.factory?.email || ''} 
              />
            </div>
            <Button disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Manager Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="pb-2">Manager Name</Label>
              <Input 
                placeholder="Enter manager name (e.g., John Doe)"
                defaultValue={settings.manager?.name || ''} 
              />
            </div>
            <div>
              <Label className="pb-2">Email</Label>
              <Input 
                placeholder="Enter manager email (e.g., manager@factory.com)"
                defaultValue={settings.manager?.email || ''} 
              />
            </div>
            <div>
              <Label className="pb-2">Phone</Label>
              <Input 
                placeholder="Enter manager phone (e.g., +91 9876543210)"
                defaultValue={settings.manager?.phone || ''} 
              />
            </div>
            <div>
              <Label className="pb-2">Department</Label>
              <Input 
                placeholder="Enter department (e.g., Production Management)"
                defaultValue={settings.manager?.department || ''} 
              />
            </div>
            <Button disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Update Profile'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Operational Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="pb-2">Working Hours</Label>
              <Input 
                placeholder="Enter working hours (e.g., 8:00 AM - 6:00 PM)"
                defaultValue={settings.operations?.workingHours || ''} 
              />
            </div>
            <div>
              <Label className="pb-2">Shifts</Label>
              <Input 
                placeholder="Enter number of shifts (e.g., 3 Shifts)"
                defaultValue={settings.operations?.shifts || ''} 
              />
            </div>
            <div>
              <Label className="pb-2">Production Capacity</Label>
              <Input 
                placeholder="Enter production capacity (e.g., 1000 units/day)"
                defaultValue={settings.operations?.capacity || ''} 
              />
            </div>
            <div>
              <Label className="pb-2">Quality Standard</Label>
              <Input 
                placeholder="Enter quality standard (e.g., ISO 9001)"
                defaultValue={settings.operations?.qualityStandard || ''} 
              />
            </div>
            <Button disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="pb-2">Time Zone</Label>
              <Input 
                placeholder="Enter time zone (e.g., Asia/Kolkata)"
                defaultValue={settings.system?.timeZone || ''} 
              />
            </div>
            <div>
              <Label className="pb-2">Currency</Label>
              <Input 
                placeholder="Enter currency (e.g., INR (₹))"
                defaultValue={settings.system?.currency || ''} 
              />
            </div>
            <div>
              <Label className="pb-2">Language</Label>
              <Input 
                placeholder="Enter language (e.g., English)"
                defaultValue={settings.system?.language || ''} 
              />
            </div>
            <div>
              <Label className="pb-2">Date Format</Label>
              <Input 
                placeholder="Enter date format (e.g., DD/MM/YYYY)"
                defaultValue={settings.system?.dateFormat || ''} 
              />
            </div>
            <Button disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Apply Changes'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}