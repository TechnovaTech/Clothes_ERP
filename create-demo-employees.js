const { MongoClient } = require('mongodb')

const uri = 'mongodb://localhost:27017'
const dbName = 'erp_system'

async function createDemoEmployees() {
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db(dbName)
    
    // Get demo tenant ID
    const tenantsCollection = db.collection('tenants')
    const demoTenant = await tenantsCollection.findOne({ email: 'demo@store.com' })
    
    if (!demoTenant) {
      console.log('Demo tenant not found')
      return
    }
    
    const tenantId = demoTenant._id.toString()
    console.log('Demo tenant ID:', tenantId)
    
    // Create employees collection for demo tenant
    const employeesCollection = db.collection(`employees_${tenantId}`)
    
    // Check if employees already exist
    const existingEmployees = await employeesCollection.find({}).toArray()
    if (existingEmployees.length > 0) {
      console.log('Demo employees already exist:', existingEmployees.length)
      return
    }
    
    // Create demo employees
    const demoEmployees = [
      {
        name: 'John Smith',
        employeeId: 'EMP001',
        email: 'john@demostore.com',
        phone: '+1234567890',
        department: 'Sales',
        position: 'Sales Associate',
        commissionType: 'percentage',
        commissionRate: 2.5,
        tenantId: tenantId,
        status: 'Active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Sarah Johnson',
        employeeId: 'EMP002',
        email: 'sarah@demostore.com',
        phone: '+1234567891',
        department: 'Sales',
        position: 'Senior Sales Associate',
        commissionType: 'percentage',
        commissionRate: 3.0,
        tenantId: tenantId,
        status: 'Active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    const result = await employeesCollection.insertMany(demoEmployees)
    console.log('Demo employees created:', result.insertedCount)
    
  } catch (error) {
    console.error('Error creating demo employees:', error)
  } finally {
    await client.close()
  }
}

createDemoEmployees()