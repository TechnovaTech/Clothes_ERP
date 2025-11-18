'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CreditCard, Calendar, DollarSign } from 'lucide-react'

interface PaymentTransaction {
  id: string
  amount: number
  date: string
  status: 'completed' | 'pending' | 'failed'
  method: string
  description: string
  type?: string
}

interface ReferralData {
  totalSet: number
  totalGiven: number
  totalPending: number
  totalReferrals: number
  completedReferrals: number
  pendingReferrals: number
  referralsMade: Array<{
    referredShop: string
    reward: number
    status: string
    date: string
  }>
  referralsReceived: Array<{
    referrerShop: string
    reward: number
    status: string
    date: string
  }>
}

interface Tenant {
  _id: string
  name: string
  email: string
  phone?: string
  plan?: string
  status: string
  createdAt: string
}

export default function TenantPaymentsPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params.tenantId as string
  
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [payments, setPayments] = useState<PaymentTransaction[]>([])
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (tenantId) {
      fetchTenantData()
      fetchPayments()
    }
  }, [tenantId])

  const fetchTenantData = async () => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log('Tenant data:', data)
      setTenant(data)
    } catch (error) {
      console.error('Error fetching tenant:', error)
    }
  }

  const fetchPayments = async () => {
    try {
      const response = await fetch(`/api/payments/${tenantId}`)
      const data = await response.json()
      setPayments(data.payments || [])
      setReferralData(data.referralData || null)
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading payment data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {tenant ? `${tenant.name} - Payment Transactions` : 'Payment Transactions'}
          </h1>
          <p className="text-muted-foreground">
            {tenant ? tenant.email : 'Loading tenant...'}
          </p>
        </div>
      </div>

      {tenant && (
        <Card>
          <CardHeader>
            <CardTitle>Tenant Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-lg">{tenant.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-lg">{tenant.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                  {tenant.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payment transactions found
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{payment.description}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatDate(payment.date)}
                        <span>•</span>
                        <span>{payment.method}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-lg">{formatAmount(payment.amount)}</p>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatAmount(
                    payments
                      .filter(p => p.status === 'completed')
                      .reduce((sum, p) => sum + p.amount, 0)
                  )}
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm font-medium text-yellow-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {formatAmount(
                    payments
                      .filter(p => p.status === 'pending')
                      .reduce((sum, p) => sum + p.amount, 0)
                  )}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-600">Total Transactions</p>
                <p className="text-2xl font-bold text-blue-700">{payments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {referralData && (
          <Card>
            <CardHeader>
              <CardTitle>Referral Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-600">Total Referral Set</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatAmount(referralData.totalSet)}
                  </p>
                  <p className="text-xs text-blue-500">{referralData.totalReferrals} referrals made</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-600">Total Given</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatAmount(referralData.totalGiven)}
                  </p>
                  <p className="text-xs text-green-500">{referralData.completedReferrals} completed</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-600">Total Pending</p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {formatAmount(referralData.totalPending)}
                  </p>
                  <p className="text-xs text-yellow-500">{referralData.pendingReferrals} pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {referralData && (referralData.referralsMade.length > 0 || referralData.referralsReceived.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Referral Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {referralData.referralsMade.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-green-700">Referrals Made (Earning Rewards)</h3>
                  <div className="space-y-2">
                    {referralData.referralsMade.map((referral, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{referral.referredShop}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(referral.date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatAmount(referral.reward)}</p>
                            <Badge className={referral.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {referral.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {referralData.referralsReceived.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-blue-700">Referrals Received (From Others)</h3>
                  <div className="space-y-2">
                    {referralData.referralsReceived.map((referral, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">From: {referral.referrerShop}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(referral.date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatAmount(referral.reward)}</p>
                            <Badge className={referral.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {referral.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}