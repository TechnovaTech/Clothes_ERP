import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('fashion_erp')
    const settings = await db.collection('manufacturer_settings').findOne({})
    
    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('fashion_erp')
    const data = await request.json()
    
    await db.collection('manufacturer_settings').replaceOne(
      {},
      { ...data, updatedAt: new Date() },
      { upsert: true }
    )
    
    return NextResponse.json({ message: 'Settings saved successfully' })
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}