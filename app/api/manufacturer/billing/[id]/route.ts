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
      updatedAt: new Date()
    }
    
    await db.collection('bills').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )
    
    return NextResponse.json({ message: 'Bill updated successfully' })
  } catch (error) {
    console.error('Error updating bill:', error)
    return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db('fashion_erp')
    const { id } = params
    
    await db.collection('bills').deleteOne({ _id: new ObjectId(id) })
    
    return NextResponse.json({ message: 'Bill deleted successfully' })
  } catch (error) {
    console.error('Error deleting bill:', error)
    return NextResponse.json({ error: 'Failed to delete bill' }, { status: 500 })
  }
}