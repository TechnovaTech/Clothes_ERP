import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    const expectedApiKey = process.env.ERP_API_KEY
    
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const db = await connectDB()
    const plansCollection = db.collection('plans')
    
    const plans = await plansCollection
      .find({ status: 'active' })
      .sort({ price: 1 })
      .toArray()
    
    const publicPlans = plans.map(plan => ({
      id: plan._id.toString(),
      name: plan.name,
      price: plan.price,
      description: plan.description,
      maxProducts: plan.maxProducts,
      durationDays: plan.durationDays || 365,
      features: plan.features || [],
      allowedFeatures: plan.allowedFeatures || []
    }))
    
    return NextResponse.json({
      success: true,
      data: publicPlans
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plans' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key'
    }
  })
}
