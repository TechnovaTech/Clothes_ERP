# 🚀 Live Deployment Steps for fashionpos.space

## Quick Deployment Checklist

### 1. Upload `.env.production` to Server
```bash
# SSH into your server
ssh your-user@erp.fashionpos.space

# Navigate to project
cd /var/www/clothes-erp

# Create .env.local with production values
nano .env.local
```

**Copy this content to `.env.local` on server:**
```env
NEXTAUTH_URL=https://erp.fashionpos.space
NEXTAUTH_SECRET=your-production-secret-change-this
DATABASE_URL=mongodb://vivekvora:Technova%40990@72.60.30.153:27017/admin?authSource=admin
MONGODB_URI=mongodb://vivekvora:Technova%40990@72.60.30.153:27017/admin?authSource=admin
WHATSAPP_SERVICE_URL=http://localhost:1112
WHATSAPP_API_KEY=whatsapp-secret-2024
ERP_API_KEY=your-secret-api-key-here
NODE_ENV=production
```

### 2. Install WhatsApp Service Dependencies
```bash
cd /var/www/clothes-erp/whatsapp-service
npm install
```

### 3. Install Chrome for Puppeteer
```bash
sudo apt-get update
sudo apt-get install -y chromium-browser
```

### 4. Start Services with PM2
```bash
cd /var/www/clothes-erp

# Start both services
pm2 start ecosystem.config.js

# Or restart if already running
pm2 restart all

# Save PM2 configuration
pm2 save

# Enable PM2 on system startup
pm2 startup
```

### 5. Verify Services are Running
```bash
# Check PM2 status
pm2 status

# Should show:
# ┌─────┬──────────────────────────┬─────────┬─────────┐
# │ id  │ name                     │ status  │ restart │
# ├─────┼──────────────────────────┼─────────┼─────────┤
# │ 0   │ clothes-erp              │ online  │ 0       │
# │ 1   │ clothes-erp-whatsapp     │ online  │ 0       │
# └─────┴──────────────────────────┴─────────┴─────────┘

# Check WhatsApp service logs
pm2 logs clothes-erp-whatsapp --lines 20

# Test WhatsApp service
curl http://localhost:1112/status
```

### 6. Scan WhatsApp QR Code

**Method 1: SSH Tunnel (Recommended)**
```bash
# From your LOCAL machine, run:
ssh -L 1112:localhost:1112 your-user@erp.fashionpos.space

# Keep terminal open, then open browser:
http://localhost:1112

# Scan QR code with WhatsApp mobile app
```

**Method 2: Temporary Nginx Access**
```bash
# Add to nginx config temporarily
sudo nano /etc/nginx/sites-available/erp.fashionpos.space

# Add this location block:
location /whatsapp-qr/ {
    proxy_pass http://localhost:1112/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

# Reload nginx
sudo nginx -t
sudo systemctl reload nginx

# Visit: https://erp.fashionpos.space/whatsapp-qr/
# Scan QR code
# Then REMOVE this location block for security
```

### 7. Test WhatsApp Integration

**From PM2 logs:**
```bash
pm2 logs clothes-erp-whatsapp --lines 50
```

**You should see:**
```
WhatsApp service running on port 1112
Visit http://localhost:1112 to scan QR code
QR Code generated
WhatsApp client is ready!
```

### 8. Test from ERP Application

1. Login to https://erp.fashionpos.space
2. Go to POS → Create a bill
3. Click "Send via WhatsApp"
4. Check if message is sent

### 9. Monitor Services

```bash
# View all logs
pm2 logs

# View specific service
pm2 logs clothes-erp-whatsapp

# Restart if needed
pm2 restart clothes-erp-whatsapp

# Stop service
pm2 stop clothes-erp-whatsapp
```

## 🔧 Troubleshooting

### WhatsApp service not starting
```bash
# Check logs
pm2 logs clothes-erp-whatsapp --err

# Common issue: Missing Chrome
sudo apt-get install -y chromium-browser

# Restart
pm2 restart clothes-erp-whatsapp
```

### QR Code not generating
```bash
# Delete old session
cd /var/www/clothes-erp/whatsapp-service
rm -rf .wwebjs_auth .wwebjs_cache

# Restart service
pm2 restart clothes-erp-whatsapp

# Check logs
pm2 logs clothes-erp-whatsapp
```

### Messages not sending
```bash
# Check if service is ready
curl http://localhost:1112/status

# Should return: {"ready":true,"queueLength":0,"hasQR":false}

# If ready:false, scan QR code again
```

### Port 1112 already in use
```bash
# Find process using port
sudo lsof -i :1112

# Kill if needed
sudo kill -9 <PID>

# Restart PM2
pm2 restart clothes-erp-whatsapp
```

## ✅ Success Indicators

- ✅ PM2 shows both services as "online"
- ✅ `curl http://localhost:1112/status` returns `{"ready":true}`
- ✅ WhatsApp messages send successfully from ERP
- ✅ No errors in `pm2 logs`

## 🔐 Security Notes

1. **Never expose port 1112 publicly**
2. **Remove nginx /whatsapp-qr/ location after scanning**
3. **Keep API_KEY secret**
4. **Backup `.wwebjs_auth/` folder** (contains session)

## 📱 Important

- **Scan QR only once** - Session persists across restarts
- **Don't logout** from WhatsApp unless needed
- **Session stored** in `.wwebjs_auth/session/`
- **Keep this folder** - Don't delete it

---

**Your WhatsApp service is now live at https://erp.fashionpos.space! 🎉**
