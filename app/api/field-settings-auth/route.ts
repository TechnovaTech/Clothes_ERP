import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { connectDB } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { password } = await request.json()
    
    const db = await connectDB()
    
    // Check global settings first
    const globalSettings = await db.collection('global_settings').findOne({})
    let storedPassword = globalSettings?.fieldSettingsPassword
    
    // If no global password, check tenant settings
    if (!storedPassword) {
      const settingsCollection = await getTenantCollection(session.user.tenantId, 'settings')
      const settings = await settingsCollection.findOne({})
      storedPassword = settings?.fieldSettingsPassword
    }
    
    // If no stored password, use default and check plain text
    if (!storedPassword) {
      if (password === 'vivekVOra32*') {
        return NextResponse.json({ success: true })
      } else {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
      }
    }
    
    // Check if stored password is hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
    const isHashed = storedPassword.startsWith('$2')
    
    let isValid = false
    if (isHashed) {
      isValid = await bcrypt.compare(password, storedPassword)
    } else {
      isValid = password === storedPassword
    }
    
    if (isValid) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }
  } catch (error) {
    console.error('Field settings auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}