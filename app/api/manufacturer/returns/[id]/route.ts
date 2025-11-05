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
      quantity: parseInt(data.quantity),
      updatedAt: new Date()
    }
    
    await db.collection('returns').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )
    
    return NextResponse.json({ message: 'Return/Defect updated successfully' })
  } catch (error) {
    console.error('Error updating return:', error)
    return NextResponse.json({ error: 'Failed to update return' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db('fashion_erp')
    const { id } = params
    
    await db.collection('returns').deleteOne({ _id: new ObjectId(id) })
    
    return NextResponse.json({ message: 'Return/Defect deleted successfully' })
  } catch (error) {
    console.error('Error deleting return:', error)
    return NextResponse.json({ error: 'Failed to delete return' }, { status: 500 })
  }
}