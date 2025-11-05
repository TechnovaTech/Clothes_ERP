import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const factoryId = searchParams.get('factory')
    const period = searchParams.get('period')

    const client = await clientPromise
    const db = client.db('fashion_erp')
    
    // Fetch revenue data (from sales/orders)
    const revenueCollection = db.collection(`tenant_${session.user.tenantId}_revenue`)
    const expensesCollection = db.collection(`tenant_${session.user.tenantId}_expenses`)
    
    let revenueQuery = {}
    let expensesQuery = {}
    
    if (factoryId && factoryId !== 'all') {
      revenueQuery = { factoryId }
      expensesQuery = { factoryId }
    }

    // Add date filtering based on period
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case 'daily':
        startDate.setDate(now.getDate() - 1)
        break
      case 'weekly':
        startDate.setDate(now.getDate() - 7)
        break
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'quarterly':
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setMonth(now.getMonth() - 1)
    }

    revenueQuery.createdAt = { $gte: startDate }
    expensesQuery.createdAt = { $gte: startDate }

    const [revenueData, expensesData] = await Promise.all([
      revenueCollection.find(revenueQuery).toArray(),
      expensesCollection.find(expensesQuery).toArray()
    ])

    // Group by factory
    const factoryReports = {}
    
    // Process revenue data
    revenueData.forEach(item => {
      const factoryKey = item.factoryId || 'unknown'
      if (!factoryReports[factoryKey]) {
        factoryReports[factoryKey] = {
          factoryId: item.factoryId,
          factoryName: item.factoryName,
          revenue: 0,
          expenses: 0
        }
      }
      factoryReports[factoryKey].revenue += item.amount || 0
    })

    // Process expenses data
    expensesData.forEach(item => {
      const factoryKey = item.factoryId || 'unknown'
      if (!factoryReports[factoryKey]) {
        factoryReports[factoryKey] = {
          factoryId: item.factoryId,
          factoryName: item.factoryName,
          revenue: 0,
          expenses: 0
        }
      }
      factoryReports[factoryKey].expenses += item.amount || 0
    })

    const reports = Object.values(factoryReports)
    
    return NextResponse.json(reports)
  } catch (error) {
    console.error('GET reports error:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}