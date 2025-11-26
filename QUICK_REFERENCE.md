# ⚡ Quick Reference Card

## 🔑 Generate API Key

```
1. Login: https://erp.fashionpos.space/login
2. Navigate: /super-admin/api-keys
3. Click: "Generate New Key"
4. Copy: erp_abc123...xyz789
```

---

## 🌐 API Endpoint

```
GET https://erp.fashionpos.space/api/public/plans
Header: x-api-key: YOUR_KEY
```

---

## 💻 Quick Test

```bash
curl -X GET "https://erp.fashionpos.space/api/public/plans" \
  -H "x-api-key: YOUR_KEY"
```

---

## 📝 Environment Variable

```env
ERP_API_KEY=your_key_here
```

---

## 🚀 JavaScript Example

```javascript
fetch('https://erp.fashionpos.space/api/public/plans', {
  headers: { 'x-api-key': process.env.ERP_API_KEY }
})
  .then(res => res.json())
  .then(data => console.log(data.data))
```

---

## 📊 Response Format

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Basic",
      "price": 999,
      "maxProducts": 1000,
      "features": [...]
    }
  ]
}
```

---

## 📚 Documentation

| Need | File |
|------|------|
| Quick Start | API_QUICK_START.md |
| Full Docs | API_DOCUMENTATION.md |
| Code Examples | INTEGRATION_GUIDE.md |
| Key Generation | API_KEY_GENERATION_GUIDE.md |
| All Docs | API_INDEX.md |

---

## 🔧 Troubleshooting

| Error | Solution |
|-------|----------|
| 401 Unauthorized | Check API key is correct |
| API key required | Add x-api-key header |
| Invalid key | Generate new key in dashboard |

---

## 📞 Support

- 📧 support@fashionpos.com
- 📱 +91 9427300816

---

**Quick Links:**
- Dashboard: `/super-admin/api-keys`
- Demo: `https://erp.fashionpos.space/api-demo.html`
- Docs: [API_INDEX.md](./API_INDEX.md)
