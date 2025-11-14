# WhatsApp Service Port Fix

## Problem
POS page was stuck loading because WhatsApp API routes were calling wrong port (3004 instead of 1112).

## Fixed Files
1. ✅ `app/api/whatsapp/status/route.ts` - Changed port 3004 → 1112
2. ✅ `app/api/whatsapp/logout/route.ts` - Changed port 3004 → 1112  
3. ✅ `app/api/send-bill/route.ts` - Changed port 3004 → 1112
4. ✅ `.env.local` - Added WHATSAPP_SERVICE_URL=http://localhost:1112

## How to Test

### 1. Start WhatsApp Service
```bash
cd whatsapp-service
npm start
```

### 2. Start Next.js App
```bash
npm run dev
```

### 3. Access POS
- Go to http://localhost:3000/login
- Login with tenant credentials
- Navigate to POS page
- Page should load without hanging
- WhatsApp QR should appear in sidebar

### 4. Scan QR Code
- Open WhatsApp on your phone
- Go to Settings → Linked Devices
- Scan the QR code shown in POS page
- Status will change to "✅ Logged In"

### 5. Test Sending Bill
- Create a sale with customer phone number
- Complete payment
- Click "Send WhatsApp" button
- Customer should receive bill via WhatsApp

## Port Configuration

**Local Development:**
- Next.js: http://localhost:3000
- WhatsApp Service: http://localhost:1112

**Production:**
- Next.js: https://erp.fashionpos.space
- WhatsApp Service: http://localhost:1112 (internal)

## Environment Variables

**Local (.env.local):**
```env
WHATSAPP_SERVICE_URL=http://localhost:1112
WHATSAPP_API_KEY=whatsapp-secret-2024
```

**Production (.env.local on server):**
```env
WHATSAPP_SERVICE_URL=http://localhost:1112
WHATSAPP_API_KEY=whatsapp-secret-2024
```

## Troubleshooting

### POS still loading?
```bash
# Restart Next.js dev server
# Press Ctrl+C and run:
npm run dev
```

### WhatsApp service not connecting?
```bash
# Check if service is running
curl http://localhost:1112/status

# Should return: {"ready":false,"queueLength":0,"hasQR":true}
```

### QR not showing?
```bash
# Restart WhatsApp service
cd whatsapp-service
npm start
```

## All Fixed! 🎉
Your POS page should now load properly and WhatsApp integration should work.
