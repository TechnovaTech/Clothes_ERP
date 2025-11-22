import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/database'

// DELETE - Reset template to default
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templateType = params.id

    const db = await connectDB()

    // Delete existing template to trigger default creation on next load
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