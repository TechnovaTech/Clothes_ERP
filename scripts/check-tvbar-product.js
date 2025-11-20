const { MongoClient } = require('mongodb')

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017'

async function checkProduct() {
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB\n')
    
    const admin = client.db().admin()
    const dbs = await admin.listDatabases()
    const tenantDbs = dbs.databases.filter(db => db.name.includes('tenant'))
    
    for (const dbInfo of tenantDbs) {
      const db = client.db(dbInfo.name)
      const inventory = db.collection('inventory')
      
      const tvbar = await inventory.findOne({ 
        $or: [
          { name: /tvbar/i },
          { productname: /tvbar/i },
          { ProductName: /tvbar/i }
        ]
      })
      
      if (tvbar) {
        console.log(`\n📦 Found "tvbar" in: ${dbInfo.name}`)
        console.log('Product Details:')
        console.log('  _id:', tvbar._id)
        console.log('  name:', tvbar.name)
        console.log('  productname:', tvbar.productname)
        console.log('  ProductName:', tvbar.ProductName)
        console.log('  stock:', tvbar.stock)
        console.log('  Stock:', tvbar.Stock)
        console.log('\n  All fields:', Object.keys(tvbar).join(', '))
        console.log('\n  Full document:', JSON.stringify(tvbar, null, 2))
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
  }
}

checkProduct()
