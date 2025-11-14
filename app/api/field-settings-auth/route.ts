import { NextRequest, NextResponse } from 'next/server'
import { getTenantCollection } from '@/lib/tenant-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { password } = await request.json()
    
    const settingsCollection = await getTenantCollection(session.user.tenantId, 'settings')
    const settings = await settingsCollection.findOne({})
    
    const storedPassword = settings?.fieldSettingsPassword || 'vivekVOra32*'
    
    if (password === storedPassword) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }
  } catch (error) {
    console.error('Field settings auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}