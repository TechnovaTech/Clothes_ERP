"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Key, Plus, Copy, Trash2, Eye, EyeOff } from "lucide-react"

interface ApiKey {
  id: string
  name: string
  key: string
  createdAt: string
  lastUsed?: string
  status: string
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddKeyOpen, setIsAddKeyOpen] = useState(false)
  const [keyName, setKeyName] = useState("")
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/super-admin/api-keys')
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateApiKey = async () => {
    if (!keyName.trim()) {
      alert('Please enter a name for the API key')
      return
    }

    try {
      const response = await fetch('/api/super-admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName })
      })

      if (response.ok) {
        const data = await response.json()
        alert('API key generated successfully. Copy it now - you won\'t see it again!')
        fetchApiKeys()
        setIsAddKeyOpen(false)
        setKeyName("")
        setVisibleKeys(new Set([data.data.id]))
      }
    } catch (error) {
      alert('Failed to generate API key')
    }
  }

  const deleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return

    try {
      const response = await fetch(`/api/super-admin/api-keys/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('API key deleted successfully')
        fetchApiKeys()
      }
    } catch (error) {
      alert('Failed to delete API key')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('API key copied to clipboard')
  }

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const maskKey = (key: string) => {
    if (key.length <= 8) return key
    return `${key.substring(0, 8)}${'*'.repeat(key.length - 12)}${key.substring(key.length - 4)}`
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Total Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiKeys.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Active Keys</CardTitle>
            <Key className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {apiKeys.filter(k => k.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-medium">Inactive Keys</CardTitle>
            <Key className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {apiKeys.filter(k => k.status === 'inactive').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage API keys for public API access</CardDescription>
            </div>
            <Dialog open={isAddKeyOpen} onOpenChange={setIsAddKeyOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate New Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate New API Key</DialogTitle>
                  <DialogDescription>
                    Create a new API key for accessing the public plans API
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyName">Key Name</Label>
                    <Input
                      id="keyName"
                      placeholder="e.g., Marketing Website, Mobile App"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Give this key a descriptive name to identify where it's used
                    </p>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddKeyOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={generateApiKey}>
                    <Key className="w-4 h-4 mr-2" />
                    Generate Key
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-12">
              <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No API Keys</h3>
              <p className="text-muted-foreground mb-4">
                Generate your first API key to start using the public API
              </p>
              <Button onClick={() => setIsAddKeyOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Generate First Key
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell className="font-medium">{apiKey.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                          >
                            {visibleKeys.has(apiKey.id) ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(apiKey.key)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(apiKey.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {apiKey.lastUsed
                          ? new Date(apiKey.lastUsed).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        {apiKey.status === 'active' ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => deleteApiKey(apiKey.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Use API Keys</CardTitle>
          <CardDescription>Instructions for using your API keys</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">1. Add to Environment Variables</h4>
            <code className="block bg-muted p-3 rounded text-sm">
              ERP_API_KEY=your_api_key_here
            </code>
          </div>
          <div>
            <h4 className="font-medium mb-2">2. Use in API Requests</h4>
            <code className="block bg-muted p-3 rounded text-sm whitespace-pre">
{`curl -X GET "https://erp.fashionpos.space/api/public/plans" \\
  -H "x-api-key: your_api_key_here"`}
            </code>
          </div>
          <div>
            <h4 className="font-medium mb-2">3. Security Best Practices</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Never commit API keys to version control</li>
              <li>Store keys in environment variables</li>
              <li>Use different keys for different environments</li>
              <li>Rotate keys regularly</li>
              <li>Delete unused keys immediately</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
