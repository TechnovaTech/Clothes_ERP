const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')

const uri = 'mongodb://localhost:27017'
const dbName = 'erp_system'

async function fixDemoPassword() {
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db(dbName)
    const tenantsCollection = db.collection('tenants')
    
    // Hash the password properly
    const hashedPassword = await bcrypt.hash('password', 10)
    
    // Update demo user password
    const result = await tenantsCollection.updateOne(
      { email: 'demo@store.com' },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      }
    )
    
    console.log('Demo password updated:', result.modifiedCount)
    
    // Test the password
    const demoUser = await tenantsCollection.findOne({ email: 'demo@store.com' })
    const isValid = await bcrypt.compare('password', demoUser.password)
    console.log('Password verification test:', isValid)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

fixDemoPassword()