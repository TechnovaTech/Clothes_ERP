# Website Integration Guide

## Public Plans API

Your ERP system now has a public API endpoint that your website can use to fetch active subscription plans.

### API Endpoint

```
GET /api/public/plans
```

### Setup

**1. In ERP Project (.env.local):**
```env
ERP_API_KEY=generate-your-own-secure-random-key
```

**2. In Website Project (.env.local):**
```env
NEXT_PUBLIC_ERP_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_ERP_API_KEY=same-key-as-erp
```

### Usage Example

```javascript
const response = await fetch('http://localhost:3000/api/public/plans', {
  headers: {
    'x-api-key': 'your-api-key'
  }
});
const result = await response.json();
const plans = result.data;
```

### Response Format

```json
{
  "success": true,
  "data": [
    {
      "id": "plan_id",
      "name": "Basic",
      "price": 999,
      "description": "Plan description",
      "maxProducts": 1000,
      "durationDays": 365,
      "features": ["Feature 1", "Feature 2"],
      "allowedFeatures": ["dashboard", "inventory"]
    }
  ]
}
```

### Running Locally

- ERP: `npm run dev` (port 3000)
- Website: `npm run dev -- -p 3001` (port 3001)

### Production

Update environment variables with your actual domain:
```env
NEXT_PUBLIC_ERP_API_BASE_URL=https://erp.yourdomain.com
```
