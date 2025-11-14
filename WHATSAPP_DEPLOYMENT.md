# WhatsApp Service Deployment Guide

## 🚀 Live Server Setup (fashionpos.space)

### 1. Server Requirements
- Node.js 16+ installed
- PM2 installed globally: `npm install -g pm2`
- Chrome/Chromium for Puppeteer
- Port 1112 open (or use reverse proxy)

### 2. Install Chrome Dependencies (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y \
  chromium-browser \
  libx11-xcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxi6 \
  libxtst6 \
  libnss3 \
  libcups2 \
  libxss1 \
  libxrandr2 \
  libasound2 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libpangocairo-1.0-0 \
  libgtk-3-0 \
  libgbm1
```

### 3. Deploy WhatsApp Service

**On your server:**
```bash
cd /var/www/clothes-erp/whatsapp-service
npm install
```

### 4. Configure Environment

**Create/Update `.env` on server:**
```bash
PORT=1112
API_KEY=whatsapp-secret-2024
NODE_ENV=production
```

### 5. Start with PM2

**Using ecosystem.config.js:**
```bash
cd /var/www/clothes-erp
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Or start individually:**
```bash
pm2 start whatsapp-service/server.js --name clothes-erp-whatsapp
```

### 6. Scan QR Code

**Option A: SSH Tunnel (Recommended)**
```bash
# On your local machine:
ssh -L 1112:localhost:1112 user@fashionpos.space

# Then open in browser:
http://localhost:1112
```

**Option B: Nginx Reverse Proxy**
```nginx
# Add to your nginx config
location /whatsapp-qr/ {
    proxy_pass http://localhost:1112/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```
Then visit: `https://fashionpos.space/whatsapp-qr/`

### 7. Update ERP Configuration

**On server, update `.env.local`:**
```env
NEXTAUTH_URL=https://fashionpos.space
WHATSAPP_SERVICE_URL=http://localhost:1112
WHATSAPP_API_KEY=whatsapp-secret-2024
```

### 8. Verify Service

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs clothes-erp-whatsapp

# Test API
curl http://localhost:1112/status
```

### 9. Monitor & Maintain

```bash
# View logs
pm2 logs clothes-erp-whatsapp

# Restart service
pm2 restart clothes-erp-whatsapp

# Stop service
pm2 stop clothes-erp-whatsapp
```

## 🔧 Troubleshooting

### Issue: Puppeteer fails to launch
```bash
# Install missing dependencies
sudo apt-get install -y chromium-browser
```

### Issue: QR code not generating
```bash
# Check logs
pm2 logs clothes-erp-whatsapp --lines 100

# Restart service
pm2 restart clothes-erp-whatsapp
```

### Issue: Session lost after restart
- Session is stored in `.wwebjs_auth/session/`
- Ensure this directory persists on server
- Don't delete this folder

## 🔐 Security Notes

1. **Never expose port 1112 publicly** - Use SSH tunnel or internal network only
2. **Keep API_KEY secret** - Don't commit to git
3. **Use HTTPS** for main app
4. **Firewall rules** - Only allow localhost access to 1112

## 📱 Usage After Setup

Once deployed and QR scanned, your ERP will automatically send WhatsApp messages when:
- Bills are generated and "Send via WhatsApp" is clicked
- The service will remain connected (no need to re-scan QR)

## ⚠️ Important Notes

- WhatsApp session persists across restarts
- Only need to scan QR once (unless logged out)
- Service handles message queue automatically
- 1.5 second delay between messages to avoid rate limits
