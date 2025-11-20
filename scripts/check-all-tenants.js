const { MongoClient } = require('mongodb')

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017'

async function checkAllTenants() {
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB\n')
    
    const admin = client.db().admin()
    const dbs = await admin.listDatabases()
    const tenantDbs = dbs.databases.filter(db => db.name.includes('tenant'))
    
    for (const dbInfo of tenantDbs) {
      console.log(`\n📦 Database: ${dbInfo.name}`)
      const db = client.db(dbInfo.name)
      const inventory = db.collection('inventory')
      
      const count = await inventory.countDocuments({})
      console.log(`   Products: ${count}`)
      
      if (count > 0) {
        const sample = await inventory.findOne({})
        console.log(`   Sample Product:`)
        console.log(`     - ID: ${sample._id}`)
        console.log(`     - Name: ${sample.name || 'N/A'}`)
        console.log(`     - stock: ${sample.stock}`)
        console.log(`     - Stock: ${sample.Stock}`)
        console.log(`     - Fields: ${Object.keys(sample).join(', ')}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
  }
}

checkAllTenants()
