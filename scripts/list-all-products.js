const { MongoClient } = require('mongodb')

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017'

async function listProducts() {
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
      
      const products = await inventory.find({}).limit(5).toArray()
      console.log(`   Total products: ${await inventory.countDocuments({})}`)
      
      if (products.length > 0) {
        console.log('\n   Recent products:')
        products.forEach((p, i) => {
          console.log(`\n   ${i + 1}. Product:`)
          console.log(`      _id: ${p._id}`)
          console.log(`      name: ${p.name}`)
          console.log(`      productname: ${p.productname}`)
          console.log(`      ProductName: ${p.ProductName}`)
          console.log(`      stock: ${p.stock}`)
          console.log(`      Stock: ${p.Stock}`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
  }
}

listProducts()
