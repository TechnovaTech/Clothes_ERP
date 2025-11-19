"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { Store, Calendar } from "lucide-react"

interface StoreInfo {
  storeName: string
  address: string
  phone: string
  email: string
  logo?: string
  planStartDate: string
  planEndDate: string
  planName: string
}

export function StoreHeader() {
  const { language } = useLanguage()
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    storeName: "",
    address: "",
    phone: "",
    email: "",
    logo: "",
    planStartDate: "",
    planEndDate: "",
    planName: ""
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStoreInfo()
  }, [])

  const fetchStoreInfo = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const settings = await response.json()
        setStoreInfo({
          storeName: settings.storeName || "Fashion Store",
          address: settings.address || "",
          phone: settings.phone || "",
          email: settings.email || "",
          logo: settings.logo || "",
          planStartDate: settings.planStartDate || "",
          planEndDate: settings.planEndDate || "",
          planName: settings.planName || "Basic Plan"
        })
      }
    } catch (error) {
      console.error('Error fetching store info:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  const getCurrentFinancialYear = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // JavaScript months are 0-indexed
    
    if (currentMonth >= 4) {
      return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`
    } else {
      return `${currentYear - 1}-${currentYear.toString().slice(-2)}`
    }
  }

  if (loading) {
    return (
      <Card className="mb-6 animate-pulse">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="h-6 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Store Logo */}
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              {storeInfo.logo ? (
                <img 
                  src={storeInfo.logo} 
                  alt="Store Logo" 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <Store className="w-6 h-6 text-blue-600" />
              )}
            </div>
            
            {/* Store Details */}
            <div>
              <h1 className="text-xl font-bold text-blue-900">
                {storeInfo.storeName}
              </h1>
              <div className="text-sm text-blue-700 space-y-1">
                {storeInfo.address && (
                  <div className="flex items-center space-x-1">
                    <span>📍</span>
                    <span>{storeInfo.address}</span>
                  </div>
                )}
                <div className="flex items-center space-x-4">
                  {storeInfo.phone && (
                    <div className="flex items-center space-x-1">
                      <span>📞</span>
                      <span>{storeInfo.phone}</span>
                    </div>
                  )} 
                  {storeInfo.email && (
                    <div className="flex items-center space-x-1">
                      <span>✉️</span>
                      <span>{storeInfo.email}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {language === 'en' ? 'FY:' : language === 'gu' ? 'નાવર્ષ:' : 'वित्त वर्ष:'} {getCurrentFinancialYear()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Plan Information */}
          {/*<div className="text-right">
            <Badge variant="outline" className="mb-2 bg-white">
              {storeInfo.planName || "Basic Plan"}
            </Badge>
            <div className="text-xs text-blue-600">
              {storeInfo.planStartDate && storeInfo.planEndDate ? (
                <>
                  {formatDate(storeInfo.planStartDate)} - {formatDate(storeInfo.planEndDate)}
                </>
              ) : (
                language === 'en' ? 'Plan Active' : language === 'gu' ? 'પ્લાન સક્રિય' : 'प्लान सक्रिय'
              )}
            </div>
          </div>*/}
        </div>
      </CardContent>
    </Card>
  )
}