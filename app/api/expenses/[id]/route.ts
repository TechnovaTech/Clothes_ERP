import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withFeatureAccess } from '@/lib/api-middleware'
import { ObjectId } from 'mongodb'

export const PUT = withFeatureAccess('expenses')(async function(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, amount, category, description, date } = body

    const expensesCollection = await getTenantCollection(session.user.tenantId, 'expenses')
    
    const updateData = {
      title: title || 'Untitled Expense',
      amount: parseFloat(amount) || 0,
      category: category || 'General',
      description: description || '',
      date: date ? new Date(date) : new Date(),
      updatedAt: new Date()
    }

    const result = await expensesCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Expense updated successfully' })
  } catch (error) {
    console.error('Update expense error:', error)
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
})

export const DELETE = withFeatureAccess('expenses')(async function(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const expensesCollection = await getTenantCollection(session.user.tenantId, 'expenses')
    
    const result = await expensesCollection.deleteOne({ _id: new ObjectId(params.id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Delete expense error:', error)
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
})
