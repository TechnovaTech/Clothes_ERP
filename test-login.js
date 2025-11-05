const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')

const uri = 'mongodb://localhost:27017'
const dbName = 'erp_system'

async function testLogin() {
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db(dbName)
    const tenantsCollection = db.collection('tenants')
    
    // Check existing tenants
    const tenants = await tenantsCollection.find({}).toArray()
    console.log('Existing tenants:', tenants.length)
    
    for (const tenant of tenants) {
      console.log(`Tenant: ${tenant.name} (${tenant.email}) - Status: ${tenant.status}`)
      
      // Test password verification
      if (tenant.email === 'demo@store.com') {
        const isValid = await bcrypt.compare('password', tenant.password)
        console.log('Password test for demo@store.com:', isValid)
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

testLogin()