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
    
    await db.collection('distributors').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )
    
    return NextResponse.json({ message: 'Distributor updated successfully' })
  } catch (error) {
    console.error('Error updating distributor:', error)
    return NextResponse.json({ error: 'Failed to update distributor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db('fashion_erp')
    const { id } = params
    
    await db.collection('distributors').deleteOne({ _id: new ObjectId(id) })
    
    return NextResponse.json({ message: 'Distributor deleted successfully' })
  } catch (error) {
    console.error('Error deleting distributor:', error)
    return NextResponse.json({ error: 'Failed to delete distributor' }, { status: 500 })
  }
}