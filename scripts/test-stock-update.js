const { MongoClient, ObjectId } = require('mongodb')

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017'
const dbName = 'erp_system'

async function testStockUpdate() {
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')
    
    // List all tenant databases
    const admin = client.db().admin()
    const dbs = await admin.listDatabases()
    const tenantDbs = dbs.databases.filter(db => db.name.includes('tenant'))
    
    console.log('\n📦 Tenant Databases:')
    tenantDbs.forEach(db => console.log(`  - ${db.name}`))
    
    if (tenantDbs.length === 0) {
      console.log('❌ No tenant databases found')
      return
    }
    
    // Check first tenant's inventory
    const firstTenantDb = client.db(tenantDbs[0].name)
    const inventory = firstTenantDb.collection('inventory')
    
    const sampleProduct = await inventory.findOne({})
    
    if (!sampleProduct) {
      console.log('\n❌ No products in inventory')
      return
    }
    
    console.log('\n📋 Sample Product:')
    console.log('  ID:', sampleProduct._id)
    console.log('  Name:', sampleProduct.name)
    console.log('  Stock field:', sampleProduct.stock)
    console.log('  Stock (capital):', sampleProduct.Stock)
    console.log('  All fields:', Object.keys(sampleProduct))
    
    // Test stock update
    console.log('\n🧪 Testing stock update...')
    const originalStock = sampleProduct.stock || sampleProduct.Stock || 0
    console.log('  Original stock:', originalStock)
    
    const updateResult = await inventory.updateOne(
      { _id: sampleProduct._id },
      { 
        $inc: { stock: -1, Stock: -1 },
        $set: { updatedAt: new Date() }
      }
    )
    
    console.log('  Update result:', {
      matched: updateResult.matchedCount,
      modified: updateResult.modifiedCount
    })
    
    // Verify update
    const updatedProduct = await inventory.findOne({ _id: sampleProduct._id })
    console.log('  New stock:', updatedProduct.stock || updatedProduct.Stock)
    
    // Restore original stock
    await inventory.updateOne(
      { _id: sampleProduct._id },
      { 
        $inc: { stock: 1, Stock: 1 }
      }
    )
    console.log('  ✅ Stock restored')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
  }
}

testStockUpdate()
