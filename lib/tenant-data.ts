import { connectTenantDB } from './database'

// Get tenant-specific database collection
export async function getTenantCollection(tenantId: string, collectionName: string, tenantName?: string) {
  const db = await connectTenantDB(tenantId, tenantName)
  return db.collection(collectionName)
}

// Initialize tenant data structure
export async function initializeTenantData(tenantId: string, tenantName?: string) {
  const collections = [
    'customers',
    'inventory',
    'purchases', 
    'sales',
    'employees',
    'reports',
    'settings',
    'expenses',
    'fields'
  ]

  for (const collection of collections) {
    const tenantCollection = await getTenantCollection(tenantId, collection, tenantName)
    
    // Create initial settings for tenant
    if (collection === 'settings') {
      await tenantCollection.insertOne({
        tenantId,
        storeName: '',
        currency: 'USD',
        timezone: 'UTC',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }
  }
}

// Clean up tenant data when tenant is deleted
export async function cleanupTenantData(tenantId: string, tenantName?: string) {
  const db = await connectTenantDB(tenantId, tenantName)
  await db.dropDatabase()
}