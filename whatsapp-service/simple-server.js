const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 1112;
const API_KEY = process.env.API_KEY || 'default-key';

app.use(cors());
app.use(express.json());

let isReady = false;
let qrString = '';

// Logging helper
const log = (message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

// API Key middleware
const authenticateAPI = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

// Routes
app.get('/qr', async (req, res) => {
  log('📥 QR code requested');
  res.status(400).json({ 
    error: 'QR code not available',
    message: 'WhatsApp service temporarily unavailable. Please use manual WhatsApp sharing.'
  });
});

app.get('/status', (req, res) => {
  const status = { 
    ready: false, 
    queueLength: 0,
    hasQR: false,
    message: 'Service temporarily disabled due to server compatibility issues'
  };
  log('📊 Status check:', status);
  res.json(status);
});

app.post('/send-message', authenticateAPI, (req, res) => {
  const { phone, message } = req.body;
  
  log('📨 Send message request received', { phone, messageLength: message?.length });
  
  if (!phone || !message) {
    log('⚠️ Missing phone or message');
    return res.status(400).json({ error: 'Phone and message are required' });
  }
  
  // Return success but suggest manual sharing
  res.json({ 
    success: false,
    error: 'WhatsApp service temporarily unavailable',
    suggestion: 'Please share the bill manually via WhatsApp',
    phone: phone,
    message: 'Service will be restored soon'
  });
});

app.post('/logout', authenticateAPI, async (req, res) => {
  log('🚪 Logout request received');
  res.json({ success: true, message: 'No active session to logout' });
});

// Serve simple status page
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>WhatsApp Service Status</title></head>
      <body style="font-family: Arial; padding: 20px;">
        <h2>WhatsApp Service Status</h2>
        <p><strong>Status:</strong> Temporarily Unavailable</p>
        <p><strong>Reason:</strong> Server compatibility issues with Chrome/Puppeteer</p>
        <p><strong>Alternative:</strong> Use manual WhatsApp sharing for now</p>
        <p><strong>ETA:</strong> Service restoration in progress</p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  log('='.repeat(60));
  log('🚀 Simple WhatsApp Service Started');
  log(`📡 Server running on port ${PORT}`);
  log(`🌐 Visit http://localhost:${PORT} for status`);
  log(`⚠️ WhatsApp integration temporarily disabled`);
  log(`💡 Users can share bills manually via WhatsApp`);
  log('='.repeat(60));
});