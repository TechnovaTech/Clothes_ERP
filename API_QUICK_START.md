# Quick Start Guide - Plans API

## 🚀 Get Started in 2 Minutes

### Step 1: Get Your API Key
Contact admin to get your `ERP_API_KEY` or set it in your `.env` file:
```env
ERP_API_KEY=your_secret_key_here
```

### Step 2: Make Your First Request

**cURL:**
```bash
curl -X GET "https://erp.fashionpos.space/api/public/plans" \
  -H "x-api-key: YOUR_API_KEY"
```

**JavaScript:**
```javascript
fetch('https://erp.fashionpos.space/api/public/plans', {
  headers: { 'x-api-key': 'YOUR_API_KEY' }
})
  .then(res => res.json())
  .then(data => console.log(data.data));
```

### Step 3: Display Plans

```jsx
// React Component
function Plans() {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetch('https://erp.fashionpos.space/api/public/plans', {
      headers: { 'x-api-key': process.env.REACT_APP_ERP_API_KEY }
    })
      .then(res => res.json())
      .then(data => setPlans(data.data));
  }, []);

  return (
    <div>
      {plans.map(plan => (
        <div key={plan.id}>
          <h3>{plan.name}</h3>
          <p>₹{plan.price}/year</p>
          <p>{plan.maxProducts} products</p>
        </div>
      ))}
    </div>
  );
}
```

## 📊 Response Structure

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Basic",
      "price": 999,
      "description": "...",
      "maxProducts": 1000,
      "durationDays": 365,
      "features": ["..."],
      "allowedFeatures": ["..."]
    }
  ]
}
```

## 🔑 Key Fields

| Field | Description | Example |
|-------|-------------|---------|
| `name` | Plan name | "Basic", "Standard", "Premium" |
| `price` | Annual price in ₹ | 999, 2499, 4999 |
| `maxProducts` | Product limit | 1000, 5000, 999999 |
| `features` | Feature list | ["Inventory", "POS"] |

## ⚡ Quick Tips

1. **Cache responses** - Plans rarely change
2. **Use environment variables** - Keep API key secure
3. **Handle errors** - Check `success` field
4. **CORS enabled** - Works from browser

## 📖 Full Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete details.

## 🆘 Need Help?

- Email: support@fashionpos.com
- Phone: +91 9427300816
