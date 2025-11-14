const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const dbName = 'erp_system'

async function initSuperAdmin() {
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    const db = client.db(dbName)
    const tenantsCollection = db.collection('tenants')
    
    // Create sample tenant
    const hashedPassword = await bcrypt.hash('password123', 12)
    
    const sampleTenant = {
      name: 'Demo Store',
      email: 'demo@store.com',
      password: hashedPassword,
      phone: '+1-555-0123',
      address: '123 Main St, City, State',
      plan: 'basic',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const existing = await tenantsCollection.findOne({ email: sampleTenant.email })
    if (!existing) {
      const result = await tenantsCollection.insertOne(sampleTenant)
      console.log('Sample tenant created:', result.insertedId)
      
      // Initialize tenant data in separate database
      const tenantId = result.insertedId.toString()
      const safeName = sampleTenant.name.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'tenant'
      const tenantDb = client.db(`${dbName}_tenant_${safeName}_${tenantId}`)
      const collections = ['customers', 'inventory', 'purchases', 'sales', 'employees', 'reports', 'settings', 'expenses', 'fields']
      
      for (const collection of collections) {
        const tenantCollection = tenantDb.collection(collection)
        
        if (collection === 'settings') {
          await tenantCollection.insertOne({
            tenantId,
            storeName: sampleTenant.name,
            currency: 'USD',
            timezone: 'UTC',
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }
      }
      
      console.log('Tenant data initialized')
    } else {
      console.log('Sample tenant already exists')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

initSuperAdmin()