import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db('fashion_erp')
    const data = await request.json()
    const { id } = params
    
    const updateData = {
      ...data,
      amount: parseFloat(data.amount),
      updatedAt: new Date()
    }
    
    await db.collection('accounting').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )
    
    return NextResponse.json({ message: 'Transaction updated successfully' })
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db('fashion_erp')
    const { id } = params
    
    await db.collection('accounting').deleteOne({ _id: new ObjectId(id) })
    
    return NextResponse.json({ message: 'Transaction deleted successfully' })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}