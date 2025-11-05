const { MongoClient } = require('mongodb')

const uri = 'mongodb://localhost:27017'
const dbName = 'erp_system'

async function createLowStockProducts() {
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
    
    // Create products collection for demo tenant
    const productsCollection = db.collection(`products_${tenantId}`)
    
    // Create some low stock products
    const lowStockProducts = [
      {
        name: 'Red Cotton T-Shirt',
        price: 299,
        stock: 3,
        minStock: 10,
        category: 'T-Shirts',
        size: 'M',
        color: 'Red',
        barcode: 'RCT001',
        sku: 'RCT-M-RED',
        tenantId: tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Blue Denim Jeans',
        price: 899,
        stock: 2,
        minStock: 5,
        category: 'Jeans',
        size: 'L',
        color: 'Blue',
        barcode: 'BDJ001',
        sku: 'BDJ-L-BLUE',
        tenantId: tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Black Formal Shirt',
        price: 599,
        stock: 1,
        minStock: 8,
        category: 'Shirts',
        size: 'XL',
        color: 'Black',
        barcode: 'BFS001',
        sku: 'BFS-XL-BLACK',
        tenantId: tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    // Insert or update products
    for (const product of lowStockProducts) {
      await productsCollection.updateOne(
        { sku: product.sku },
        { $set: product },
        { upsert: true }
      )
    }
    
    console.log('Low stock products created/updated:', lowStockProducts.length)
    
    // Update settings to include phone number for alerts
    const settingsCollection = db.collection(`settings_${tenantId}`)
    await settingsCollection.updateOne(
      {},
      { 
        $set: { 
          phone: '+919427300816',
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )
    
    console.log('Settings updated with phone number for alerts')
    
  } catch (error) {
    console.error('Error creating low stock products:', error)
  } finally {
    await client.close()
  }
}

createLowStockProducts()