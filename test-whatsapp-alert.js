const { exec } = require('child_process')

// Test WhatsApp alert by calling the API
async function testWhatsAppAlert() {
  try {
    console.log('🧪 Testing WhatsApp Alert System...')
    
    // Call the daily alerts API
    const response = await fetch('http://localhost:3000/api/cron/daily-alerts')
    const result = await response.json()
    
    console.log('📊 Alert Results:', result)
    
    if (result.sentAlerts && result.sentAlerts.length > 0) {
      for (const alert of result.sentAlerts) {
        console.log(`\n📱 WhatsApp Alert for ${alert.tenantName}:`)
        console.log(`📞 Phone: ${alert.phone}`)
        console.log(`📦 Products: ${alert.productsCount}`)
        console.log(`🔗 WhatsApp URL: ${alert.whatsappUrl}`)
        
        // Auto-open WhatsApp in browser
        if (alert.whatsappUrl) {
          console.log('🚀 Opening WhatsApp...')
          exec(`start ${alert.whatsappUrl}`, (error) => {
            if (error) {
              console.log('⚠️ Could not auto-open WhatsApp. Copy the URL above.')
            } else {
              console.log('✅ WhatsApp opened successfully!')
            }
          })
        }
      }
    } else {
      console.log('ℹ️ No low stock alerts to send')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testWhatsAppAlert()