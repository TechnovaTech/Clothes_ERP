import { NextRequest, NextResponse } from 'next/server'
import { getTenantsCollection } from '@/lib/database'
import { cleanupTenantData } from '@/lib/tenant-data'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'

// GET - Get single tenant
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid tenant ID' }, { status: 400 })
    }

    const tenantsCollection = await getTenantsCollection()
    const tenant = await tenantsCollection.findOne({ _id: new ObjectId(params.id) })
    
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Remove password and convert _id to string
    const { password, _id, ...tenantData } = tenant
    
    return NextResponse.json({
      ...tenantData,
      _id: _id.toString(),
      id: _id.toString()
    })
  } catch (error) {
    console.error('Error fetching tenant:', error)
    return NextResponse.json({ error: 'Failed to fetch tenant' }, { status: 500 })
  }
}

// PUT - Update tenant
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, email, password, phone, address, plan, tenantType, businessType, status } = body

    const tenantsCollection = await getTenantsCollection()
    
    const updateData: any = {
      name,
      email,
      phone: phone || null,
      address: address || null,
      plan: plan || 'basic',
      tenantType: tenantType || 'retail',
      businessType: businessType && businessType !== 'none' ? businessType : null,
      status: status || 'active',
      updatedAt: new Date()
    }

    // Only hash and update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    const result = await tenantsCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Tenant updated successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 })
  }
}

// DELETE - Delete tenant
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantsCollection = await getTenantsCollection()
    let tenant
    try {
      tenant = await tenantsCollection.findOne({ _id: new ObjectId(params.id) })
    } catch {
      tenant = await tenantsCollection.findOne({ _id: params.id })
    }
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    await cleanupTenantData(params.id, (tenant as any).name)

    let result
    try {
      result = await tenantsCollection.deleteOne({ _id: new ObjectId(params.id) })
    } catch {
      result = await tenantsCollection.deleteOne({ _id: params.id })
    }

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Tenant deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete tenant' }, { status: 500 })
  }
}