const { MongoClient } = require('mongodb')

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017'

async function fixPurchaseTotals() {
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB\n')
    
    const admin = client.db().admin()
    const dbs = await admin.listDatabases()
    const tenantDbs = dbs.databases.filter(db => db.name.includes('tenant'))
    
    for (const dbInfo of tenantDbs) {
      console.log(`\n📦 Processing: ${dbInfo.name}`)
      const db = client.db(dbInfo.name)
      const purchases = db.collection('purchases')
      const settings = db.collection('settings')
      
      const purchaseCount = await purchases.countDocuments({})
      if (purchaseCount === 0) {
        console.log('   No purchases found')
        continue
      }
      
      // Get tax rate
      const storeSettings = await settings.findOne({}) || { taxRate: 0 }
      const taxRate = (storeSettings.taxRate || 0) / 100
      console.log(`   Tax rate: ${storeSettings.taxRate || 0}%`)
      
      const allPurchases = await purchases.find({}).toArray()
      console.log(`   Found ${allPurchases.length} purchases`)
      
      let fixed = 0
      for (const purchase of allPurchases) {
        if (!purchase.items || purchase.items.length === 0) continue
        
        // Recalculate totals
        const subtotal = purchase.items.reduce((sum, item) => {
          const itemTotal = parseFloat(item.total) || 0
          return sum + itemTotal
        }, 0)
        
        const tax = subtotal * taxRate
        const total = subtotal + tax
        
        console.log(`\n   PO: ${purchase.poNumber}`)
        console.log(`      Old total: ₹${purchase.total}`)
        console.log(`      New total: ₹${total}`)
        console.log(`      Items: ${purchase.items.map(i => `${i.name} (${i.quantity} × ₹${i.unitPrice} = ₹${i.total})`).join(', ')}`)
        
        // Update the purchase
        await purchases.updateOne(
          { _id: purchase._id },
          { 
            $set: { 
              subtotal: subtotal,
              tax: tax,
              total: total,
              updatedAt: new Date()
            }
          }
        )
        
        fixed++
      }
      
      console.log(`\n   ✅ Fixed ${fixed} purchases`)
    }
    
    console.log('\n✅ All purchase totals fixed!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
  }
}

fixPurchaseTotals()
