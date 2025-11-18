import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 2MB' }, { status: 400 })
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

    // Save to database
    const { db } = await connectToDatabase()
    const collection = db.collection('settings')

    const updateField = type === 'logo' ? { logo: base64 } : { signature: base64 }
    
    await collection.updateOne(
      { tenantId: session.user.tenantId },
      { $set: updateField },
      { upsert: true }
    )

    return NextResponse.json({ 
      success: true, 
      url: base64,
      message: `${type} uploaded successfully` 
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}