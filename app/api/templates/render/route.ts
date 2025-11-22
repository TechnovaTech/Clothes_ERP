import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/database'
import { TemplateEngine, TemplateData } from '@/lib/template-engine'

// POST - Render template with data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { templateType, data } = body

    if (!templateType || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = await connectDB()
    
    // Load template
    const template = await db.collection('templates').findOne({
      tenantId: session.user.tenantId,
      templateType
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Render template to HTML
    const html = TemplateEngine.renderToHTML(template, data as TemplateData)

    return NextResponse.json({ html })
  } catch (error) {
    console.error('Template render error:', error)
    return NextResponse.json({ error: 'Failed to render template' }, { status: 500 })
  }
}