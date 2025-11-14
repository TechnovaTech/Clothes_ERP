const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY || 'default-key';

app.use(cors());
app.use(express.json());

let client;
let qrString = '';
let isReady = false;
const messageQueue = [];
let isProcessing = false;

// Logging helper
const log = (message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

// Initialize WhatsApp client
const initializeClient = () => {
  log('🚀 Initializing WhatsApp client...');
  
  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  client.on('qr', (qr) => {
    qrString = qr;
    log('📱 QR Code generated successfully');
    log('QR Length:', qr.length);
  });

  client.on('ready', () => {
    isReady = true;
    log('✅ WhatsApp client is ready!');
  });

  client.on('authenticated', () => {
    log('🔐 WhatsApp authenticated');
  });

  client.on('auth_failure', (msg) => {
    log('❌ Authentication failure:', msg);
  });

  client.on('disconnected', (reason) => {
    isReady = false;
    log('⚠️ WhatsApp client disconnected:', reason);
  });

  client.on('loading_screen', (percent, message) => {
    log(`⏳ Loading: ${percent}% - ${message}`);
  });

  log('🔄 Starting client initialization...');
  client.initialize();
};

// API Key middleware
const authenticateAPI = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

// Process message queue
const processQueue = async () => {
  if (isProcessing || messageQueue.length === 0 || !isReady) return;
  
  isProcessing = true;
  const { phone, message, resolve, reject } = messageQueue.shift();
  
  log(`📤 Processing message to: ${phone}`);
  
  try {
    const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;
    await client.sendMessage(chatId, message);
    log(`✅ Message sent successfully to: ${phone}`);
    resolve({ success: true });
  } catch (error) {
    log(`❌ Failed to send message to ${phone}:`, error.message);
    reject({ error: error.message });
  }
  
  setTimeout(() => {
    isProcessing = false;
    processQueue();
  }, 1500); // 1.5s delay between messages
};

// Routes
app.get('/qr', async (req, res) => {
  log('📥 QR code requested');
  
  if (!qrString) {
    log('⚠️ QR code not available yet');
    return res.status(400).json({ error: 'QR code not available' });
  }
  
  try {
    const qrImage = await qrcode.toDataURL(qrString);
    log('✅ QR code sent successfully');
    res.json({ qr: qrImage });
  } catch (error) {
    log('❌ Failed to generate QR code:', error.message);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

app.get('/status', (req, res) => {
  const status = { 
    ready: isReady, 
    queueLength: messageQueue.length,
    hasQR: !!qrString 
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
  
  if (!isReady) {
    log('⚠️ WhatsApp client not ready');
    return res.status(503).json({ error: 'WhatsApp client not ready' });
  }
  
  log(`➕ Adding message to queue. Queue length: ${messageQueue.length + 1}`);
  
  const promise = new Promise((resolve, reject) => {
    messageQueue.push({ phone, message, resolve, reject });
    processQueue();
  });
  
  promise
    .then(result => res.json(result))
    .catch(error => res.status(500).json(error));
});

app.post('/logout', authenticateAPI, async (req, res) => {
  log('🚪 Logout request received');
  
  try {
    if (client) {
      await client.logout();
      isReady = false;
      qrString = '';
      log('✅ Logged out successfully');
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    log('❌ Logout failed:', error.message);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// Serve QR viewer page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/qr-viewer.html');
});

app.listen(PORT, () => {
  log('='.repeat(60));
  log('🚀 WhatsApp Service Started');
  log(`📡 Server running on port ${PORT}`);
  log(`🌐 Visit http://localhost:${PORT} to scan QR code`);
  log(`🔑 API Key: ${API_KEY.substring(0, 10)}...`);
  log(`📂 Environment: ${process.env.NODE_ENV || 'development'}`);
  log('='.repeat(60));
  initializeClient();
});