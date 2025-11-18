import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ObjectId } from 'mongodb'

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params
    
    if (!ObjectId.isValid(tenantId)) {
      return NextResponse.json({ error: 'Invalid tenant ID' }, { status: 400 })
    }

    const db = await connectDB()
    
    // Get tenant info
    const tenant = await db.collection('tenants').findOne({ _id: new ObjectId(tenantId) })
    
    // Get referral data for this tenant
    const referrals = await db.collection('referrals').find({
      $or: [
        { referrerShop: tenant?.name },
        { referredShop: tenant?.name }
      ]
    }).toArray()
    
    // Get real payment transactions from database
    const paymentTransactions = await db.collection('payments').find({ 
      tenantId: new ObjectId(tenantId) 
    }).sort({ createdAt: -1 }).toArray()
    
    // Get plan information for subscription payments
    const plans = await db.collection('plans').find({}).toArray()
    const planMap = plans.reduce((acc, plan) => {
      acc[plan._id.toString()] = { name: plan.name, price: plan.price }
      return acc
    }, {})
    
    // Create subscription payment if tenant has a plan
    const subscriptionPayments = []
    if (tenant?.plan && planMap[tenant.plan.toString()]) {
      const plan = planMap[tenant.plan.toString()]
      subscriptionPayments.push({
        id: `sub_${tenant._id}`,
        tenantId,
        amount: plan.price,
        date: tenant.createdAt || new Date().toISOString(),
        status: 'completed',
        method: 'Subscription',
        description: `${plan.name} Plan Subscription`,
        transactionId: `SUB${tenant._id.toString().slice(-6).toUpperCase()}`,
        gatewayResponse: null
      })
    }
    
    // Convert database payments to frontend format
    const realPayments = paymentTransactions.map(payment => ({
      id: payment._id.toString(),
      tenantId,
      amount: payment.amount,
      date: payment.createdAt || payment.date,
      status: payment.status,
      method: payment.method,
      description: payment.description,
      transactionId: payment.transactionId,
      gatewayResponse: payment.gatewayResponse
    }))
    
    const allRegularPayments = [...subscriptionPayments, ...realPayments]
    
    // Add referral payments
    const referralPayments = referrals.map((referral, index) => ({
      id: `ref_${index + 1}`,
      tenantId,
      amount: referral.reward || 0,
      date: referral.createdAt || new Date().toISOString(),
      status: referral.status === 'Completed' ? 'completed' : 'pending',
      method: 'Referral Reward',
      description: referral.referrerShop === tenant?.name 
        ? `Referral reward for ${referral.referredShop}` 
        : `Referral from ${referral.referrerShop}`,
      transactionId: `REF${String(index + 1).padStart(3, '0')}`,
      gatewayResponse: null,
      type: 'referral'
    }))

    const allPayments = [...allRegularPayments, ...referralPayments]

    // Calculate referral breakdown
    const referralsAsReferrer = referrals.filter(r => r.referrerShop === tenant?.name)
    const referralsAsReferred = referrals.filter(r => r.referredShop === tenant?.name)
    
    const referralBreakdown = {
      // As referrer (earning rewards)
      totalSet: referralsAsReferrer.reduce((sum, r) => sum + (r.reward || 0), 0),
      totalGiven: referralsAsReferrer.filter(r => r.status === 'Completed').reduce((sum, r) => sum + (r.reward || 0), 0),
      totalPending: referralsAsReferrer.filter(r => r.status === 'Pending').reduce((sum, r) => sum + (r.reward || 0), 0),
      
      // Counts
      totalReferrals: referralsAsReferrer.length,
      completedReferrals: referralsAsReferrer.filter(r => r.status === 'Completed').length,
      pendingReferrals: referralsAsReferrer.filter(r => r.status === 'Pending').length,
      
      // Details
      referralsMade: referralsAsReferrer.map(r => ({
        referredShop: r.referredShop,
        reward: r.reward || 0,
        status: r.status,
        date: r.createdAt
      })),
      referralsReceived: referralsAsReferred.map(r => ({
        referrerShop: r.referrerShop,
        reward: r.reward || 0,
        status: r.status,
        date: r.createdAt
      }))
    }

    return NextResponse.json({ 
      payments: allPayments,
      referralData: referralBreakdown
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}