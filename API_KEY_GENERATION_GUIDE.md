# API Key Generation Guide

## 🔑 How to Generate API Keys

### Method 1: Using Super Admin Dashboard (Recommended)

1. **Login as Super Admin**
   - Go to `https://erp.fashionpos.space/login`
   - Login with super-admin credentials

2. **Navigate to API Keys**
   - Go to `/super-admin/api-keys`
   - Or find "API Keys" in the super-admin menu

3. **Generate New Key**
   - Click "Generate New Key" button
   - Enter a descriptive name (e.g., "Marketing Website", "Mobile App")
   - Click "Generate Key"

4. **Copy the API Key**
   - The key will be displayed once
   - Copy it immediately - you won't see it again!
   - Store it securely

5. **Use the API Key**
   - Add to your environment variables
   - Use in API requests with header `x-api-key`

---

## 📊 API Keys Dashboard Features

### View All Keys
- See all generated API keys
- View creation date
- Check last used date
- Monitor status (active/inactive)

### Key Management
- **Generate** - Create new API keys
- **View** - Show/hide key values
- **Copy** - Copy key to clipboard
- **Delete** - Remove unused keys

### Security Features
- Keys are masked by default
- Click eye icon to reveal
- Automatic last-used tracking
- Active/inactive status

---

## 🔒 Security Best Practices

### 1. Key Storage
```env
# Store in .env file
ERP_API_KEY=erp_abc123...xyz789

# Never commit to git
# Add to .gitignore
.env
.env.local
```

### 2. Key Naming
Use descriptive names to identify usage:
- ✅ "Production Marketing Website"
- ✅ "Staging Mobile App"
- ✅ "Partner Portal - Company X"
- ❌ "Key 1"
- ❌ "Test"

### 3. Key Rotation
- Rotate keys every 90 days
- Delete old keys after rotation
- Use different keys for different environments

### 4. Key Permissions
- One key per application/website
- Delete keys when no longer needed
- Monitor "Last Used" to identify unused keys

---

## 🚀 Using Your API Key

### In Environment Variables

**Development (.env.local)**
```env
ERP_API_KEY=erp_your_dev_key_here
```

**Production**
Set in your hosting platform:
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Environment Variables
- AWS/Heroku: Platform-specific configuration

### In API Requests

**cURL**
```bash
curl -X GET "https://erp.fashionpos.space/api/public/plans" \
  -H "x-api-key: erp_your_key_here"
```

**JavaScript**
```javascript
fetch('https://erp.fashionpos.space/api/public/plans', {
  headers: {
    'x-api-key': process.env.ERP_API_KEY
  }
})
```

**Python**
```python
import os
import requests

api_key = os.getenv('ERP_API_KEY')
headers = {'x-api-key': api_key}
response = requests.get('https://erp.fashionpos.space/api/public/plans', headers=headers)
```

---

## 📋 API Key Format

Generated keys follow this format:
```
erp_[64_character_hex_string]
```

Example:
```
erp_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

- **Prefix:** `erp_` (identifies as ERP API key)
- **Length:** 68 characters total
- **Format:** Hexadecimal (0-9, a-f)
- **Entropy:** 256 bits (cryptographically secure)

---

## 🔍 Monitoring API Keys

### Check Key Usage
1. Go to `/super-admin/api-keys`
2. View "Last Used" column
3. Identify unused keys
4. Delete inactive keys

### Key Statistics
- **Total Keys** - All generated keys
- **Active Keys** - Currently usable keys
- **Inactive Keys** - Disabled keys

---

## ⚠️ Troubleshooting

### Issue: "Invalid API key" Error

**Possible Causes:**
1. Key not generated yet
2. Key is inactive
3. Key was deleted
4. Typo in key value

**Solution:**
1. Check key exists in dashboard
2. Verify key status is "active"
3. Copy key again from dashboard
4. Check for extra spaces/characters

### Issue: "API key is required" Error

**Cause:** Missing `x-api-key` header

**Solution:**
```javascript
// ❌ Wrong
fetch('https://erp.fashionpos.space/api/public/plans')

// ✅ Correct
fetch('https://erp.fashionpos.space/api/public/plans', {
  headers: { 'x-api-key': 'your_key' }
})
```

### Issue: Key Not Working After Generation

**Solution:**
1. Wait 1-2 seconds for database sync
2. Refresh the page
3. Try the request again
4. Check browser console for errors

---

## 🗄️ Database Structure

API keys are stored in MongoDB:

```javascript
{
  _id: ObjectId("..."),
  name: "Marketing Website",
  key: "erp_abc123...xyz789",
  status: "active",
  createdAt: ISODate("2024-01-01T00:00:00Z"),
  lastUsed: ISODate("2024-01-15T10:30:00Z")
}
```

---

## 🔄 Key Lifecycle

### 1. Generation
- Super admin creates key
- System generates secure random key
- Key stored in database
- Status set to "active"

### 2. Usage
- Client sends request with key
- System validates key
- Updates "lastUsed" timestamp
- Returns data if valid

### 3. Monitoring
- Admin views usage statistics
- Checks last used date
- Identifies unused keys

### 4. Deletion
- Admin deletes key
- Key removed from database
- All requests with that key fail

---

## 📞 Support

**Need Help?**
- 📧 Email: support@fashionpos.com
- 📱 Phone: +91 9427300816

**Can't Access Super Admin?**
Contact system administrator to:
- Get super-admin credentials
- Generate API key for you
- Reset your password

---

## ✅ Quick Checklist

Before using API:
- [ ] Logged in as super-admin
- [ ] Generated API key
- [ ] Copied key to safe location
- [ ] Added key to environment variables
- [ ] Tested key with cURL
- [ ] Verified key works in application

---

## 🎯 Next Steps

After generating your API key:

1. **Test It**
   ```bash
   curl -X GET "https://erp.fashionpos.space/api/public/plans" \
     -H "x-api-key: YOUR_KEY"
   ```

2. **Add to Project**
   ```env
   ERP_API_KEY=YOUR_KEY
   ```

3. **Integrate**
   - See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
   - Choose your platform
   - Copy code example

4. **Deploy**
   - Set environment variable in production
   - Test in production
   - Monitor usage

---

**Happy Coding! 🚀**

*Last Updated: 2024*
