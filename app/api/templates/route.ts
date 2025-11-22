import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/database'
import { TemplateEngine } from '@/lib/template-engine'
import { getDefaultTemplate } from '@/lib/default-templates'

// GET - Load tenant's template
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const templateType = searchParams.get('type') || 'invoice'

    const db = await connectDB()
    
    // Try to find existing template
    let template = await db.collection('templates').findOne({
      tenantId: session.user.tenantId,
      templateType
    })

    // If no template exists, create default
    if (!template) {
      const defaultTemplate = {
        tenantId: session.user.tenantId,
        templateType,
        name: `Default ${templateType} Template`,
        canvasJSON: {
          elements: getDefaultTemplate(templateType),
          settings: {
            pageSize: 'A4',
            orientation: 'portrait',
            margins: { top: 20, right: 20, bottom: 20, left: 20 }
          }
        },
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await db.collection('templates').insertOne(defaultTemplate)
      template = { ...defaultTemplate, _id: result.insertedId }
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Template load error:', error)
    return NextResponse.json({ error: 'Failed to load template' }, { status: 500 })
  }
}

// DELETE - Reset template to default
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const templateType = searchParams.get('type') || 'invoice'

    const db = await connectDB()

    await db.collection('templates').deleteOne({
      tenantId: session.user.tenantId,
      templateType
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Template delete error:', error)
    return NextResponse.json({ error: 'Failed to reset template' }, { status: 500 })
  }
}

// POST - Save template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { templateType, canvasJSON, name } = body

    if (!templateType || !canvasJSON) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = await connectDB()

    const templateData = {
      tenantId: session.user.tenantId,
      templateType,
      name: name || `${templateType} Template`,
      canvasJSON,
      isDefault: false,
      updatedAt: new Date()
    }

    // Update existing or create new
    const result = await db.collection('templates').updateOne(
      { tenantId: session.user.tenantId, templateType },
      { 
        $set: templateData,
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    )

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Template save error:', error)
    return NextResponse.json({ error: 'Failed to save template' }, { status: 500 })
  }
}