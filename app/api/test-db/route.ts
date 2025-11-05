import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'

export async function GET() {
  try {
    const db = await connectDB()
    const collections = await db.listCollections().toArray()
    
    return NextResponse.json({ 
      status: 'Connected',
      database: db.databaseName,
      collections: collections.map(c => c.name)
    })
  } catch (error) {
    console.error('Database connection error:', error)
    return NextResponse.json({ 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}