import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ 
      fieldSettingsPassword: 'vivekVOra32*' // Return default for display
    })
  } catch (error) {
    console.error('Super admin settings fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fieldSettingsPassword } = await request.json()
    
    if (!fieldSettingsPassword) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    const db = await connectDB()
    
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(fieldSettingsPassword, 12)
    
    // Update global settings collection
    await db.collection('global_settings').updateOne(
      {},
      { 
        $set: { 
          fieldSettingsPassword: hashedPassword,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )
    
    // Also update all tenant settings collections
    const collections = await db.listCollections({ name: /^settings_/ }).toArray()
    
    for (const collection of collections) {
      await db.collection(collection.name).updateMany(
        {},
        { 
          $set: { 
            fieldSettingsPassword: hashedPassword,
            updatedAt: new Date()
          }
        }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Updated field settings password for ${collections.length} tenants` 
    })
  } catch (error) {
    console.error('Super admin settings update error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}