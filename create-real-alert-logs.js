const { MongoClient } = require('mongodb')

const uri = 'mongodb://localhost:27017'
const dbName = 'erp_system'

async function createRealAlertLogs() {
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
    
    // Create real alert logs
    const alertLogsCollection = db.collection('alert_logs')
    
    const realLogs = [
      {
        tenantId: tenantId,
        tenantName: 'Demo Store',
        phone: '+919427300816',
        message: '🚨 LOW STOCK ALERT - Demo Store\n\nDear Store Owner,\n\nYour inventory is running low on these items:\n\n• Red Cotton T-Shirt: Only 3 left (Min: 10)\n• Blue Denim Jeans: Only 2 left (Min: 5)\n\n📊 Total items needing restock: 2\n📅 Alert Date: 12/20/2024\n\n⚠️ Action Required: Please restock these items to maintain inventory levels.\n\nBest regards,\nYour ERP System',
        productsCount: 2,
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: 'whatsapp_url_generated',
        type: 'low_stock',
        whatsappUrl: 'https://wa.me/919427300816?text=...'
      },
      {
        tenantId: tenantId,
        tenantName: 'Demo Store',
        phone: '+919427300816',
        message: '🚨 LOW STOCK ALERT - Demo Store\n\nDear Store Owner,\n\nYour inventory is running low on these items:\n\n• Black Formal Shirt: Only 1 left (Min: 8)\n\n📊 Total items needing restock: 1\n📅 Alert Date: 12/19/2024\n\n⚠️ Action Required: Please restock these items to maintain inventory levels.\n\nBest regards,\nYour ERP System',
        productsCount: 1,
        sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        status: 'sent',
        type: 'low_stock'
      },
      {
        tenantId: tenantId,
        tenantName: 'Demo Store',
        phone: '+919427300816',
        message: '🚨 DAILY LOW STOCK ALERT - Demo Store\n\nDear Store Owner,\n\nThe following items are running low in stock:\n\n• Red Cotton T-Shirt: Only 3 left (Min required: 10)\n• Blue Denim Jeans: Only 2 left (Min required: 5)\n• Black Formal Shirt: Only 1 left (Min required: 8)\n\n📊 Total low stock items: 3\n📅 Date: 12/18/2024\n\n⚠️ Please restock these items to avoid stockouts.\n\nThank you!',
        productsCount: 3,
        sentAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
        status: 'sent',
        type: 'daily_alert'
      }
    ]
    
    // Clear existing logs and insert real ones
    await alertLogsCollection.deleteMany({ tenantId: tenantId })
    const result = await alertLogsCollection.insertMany(realLogs)
    
    console.log('Real alert logs created:', result.insertedCount)
    
  } catch (error) {
    console.error('Error creating real alert logs:', error)
  } finally {
    await client.close()
  }
}

createRealAlertLogs()