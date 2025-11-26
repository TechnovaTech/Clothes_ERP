import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { ObjectId } from 'mongodb'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import crypto from 'crypto'

// GET - Fetch all API keys
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (session?.user?.role !== 'super-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    const apiKeysCollection = db.collection('api_keys')
    
    const apiKeys = await apiKeysCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray()
    
    const formattedKeys = apiKeys.map(key => ({
      id: key._id.toString(),
      name: key.name,
      key: key.key,
      createdAt: key.createdAt,
      lastUsed: key.lastUsed,
      status: key.status
    }))
    
    return NextResponse.json({
      success: true,
      data: formattedKeys
    })
  } catch (error) {
    console.error('Failed to fetch API keys:', error)
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
  }
}

// POST - Generate new API key
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (session?.user?.role !== 'super-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Generate a secure random API key
    const apiKey = `erp_${crypto.randomBytes(32).toString('hex')}`

    const db = await connectDB()
    const apiKeysCollection = db.collection('api_keys')
    
    const newKey = {
      name: name.trim(),
      key: apiKey,
      status: 'active',
      createdAt: new Date(),
      lastUsed: null
    }

    const result = await apiKeysCollection.insertOne(newKey)

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        name: newKey.name,
        key: newKey.key,
        createdAt: newKey.createdAt,
        status: newKey.status
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to generate API key:', error)
    return NextResponse.json({ error: 'Failed to generate API key' }, { status: 500 })
  }
}
