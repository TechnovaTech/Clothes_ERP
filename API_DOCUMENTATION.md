# Fashion ERP - Public Plans API Documentation

## Overview
This API allows you to fetch subscription plans from the Fashion ERP system to display on external websites or applications.

**Base URL:** `https://erp.fashionpos.space`

---

## Authentication

The API uses API Key authentication via headers.

**Header Required:**
```
x-api-key: YOUR_API_KEY
```

> **Note:** Contact the system administrator to obtain your API key. Set `ERP_API_KEY` in your environment variables.

---

## Endpoint: Get All Plans

### Request

**Method:** `GET`  
**URL:** `https://erp.fashionpos.space/api/public/plans`  
**Headers:**
```
x-api-key: YOUR_API_KEY
Content-Type: application/json
```

### cURL Example

```bash
curl -X GET "https://erp.fashionpos.space/api/public/plans" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

### Response

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Basic",
      "price": 999,
      "description": "Perfect for small retail stores",
      "maxProducts": 1000,
      "durationDays": 365,
      "features": [
        "Inventory Management",
        "POS System",
        "Customer Management"
      ],
      "allowedFeatures": [
        "dashboard",
        "inventory",
        "pos",
        "customers",
        "sales"
      ]
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "Standard",
      "price": 2499,
      "description": "For growing fashion stores",
      "maxProducts": 5000,
      "durationDays": 365,
      "features": [
        "All Basic Features",
        "Employee Management",
        "Purchase Management",
        "Reports & Analytics"
      ],
      "allowedFeatures": [
        "dashboard",
        "inventory",
        "pos",
        "customers",
        "sales",
        "employees",
        "purchases",
        "reports"
      ]
    },
    {
      "id": "507f1f77bcf86cd799439013",
      "name": "Premium",
      "price": 4999,
      "description": "Complete solution for large stores",
      "maxProducts": 999999,
      "durationDays": 365,
      "features": [
        "All Standard Features",
        "WhatsApp Integration",
        "Advanced Analytics",
        "Expense Management",
        "Priority Support"
      ],
      "allowedFeatures": [
        "dashboard",
        "inventory",
        "pos",
        "customers",
        "sales",
        "employees",
        "purchases",
        "reports",
        "expenses",
        "settings",
        "whatsapp"
      ]
    }
  ]
}
```

**Error Response (401 Unauthorized):**

```json
{
  "success": false,
  "error": "Invalid API key"
}
```

**Error Response (500 Internal Server Error):**

```json
{
  "success": false,
  "error": "Failed to fetch plans"
}
```

---

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique plan identifier |
| `name` | string | Plan name (e.g., "Basic", "Standard", "Premium") |
| `price` | number | Plan price in INR (₹) |
| `description` | string | Plan description |
| `maxProducts` | number | Maximum products allowed in inventory |
| `durationDays` | number | Plan validity duration in days (typically 365) |
| `features` | string[] | Human-readable list of features |
| `allowedFeatures` | string[] | System feature keys for access control |

---

## Feature Keys Reference

| Feature Key | Description |
|-------------|-------------|
| `dashboard` | Access to main dashboard |
| `inventory` | Product inventory management |
| `pos` | Point of Sale system |
| `customers` | Customer management |
| `sales` | Sales records and history |
| `employees` | Employee management |
| `purchases` | Purchase order management |
| `reports` | Reports and analytics |
| `expenses` | Expense tracking |
| `settings` | Store settings configuration |
| `whatsapp` | WhatsApp bill sharing |

---

## Integration Examples

### JavaScript (Fetch API)

```javascript
const API_KEY = 'YOUR_API_KEY';
const API_URL = 'https://erp.fashionpos.space/api/public/plans';

async function fetchPlans() {
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Plans:', result.data);
      return result.data;
    } else {
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('Failed to fetch plans:', error);
  }
}

// Usage
fetchPlans().then(plans => {
  plans.forEach(plan => {
    console.log(`${plan.name}: ₹${plan.price}/year`);
  });
});
```

### React Component Example

```jsx
import { useState, useEffect } from 'react';

function PricingPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://erp.fashionpos.space/api/public/plans', {
      headers: {
        'x-api-key': process.env.REACT_APP_ERP_API_KEY,
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPlans(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading plans...</div>;

  return (
    <div className="pricing-grid">
      {plans.map(plan => (
        <div key={plan.id} className="plan-card">
          <h3>{plan.name}</h3>
          <p className="price">₹{plan.price}/year</p>
          <p className="description">{plan.description}</p>
          <ul className="features">
            {plan.features.map((feature, idx) => (
              <li key={idx}>{feature}</li>
            ))}
          </ul>
          <div className="limits">
            <span>Up to {plan.maxProducts.toLocaleString()} products</span>
          </div>
          <button>Choose Plan</button>
        </div>
      ))}
    </div>
  );
}

export default PricingPlans;
```

### Next.js Server Component

```tsx
// app/pricing/page.tsx
async function getPlans() {
  const res = await fetch('https://erp.fashionpos.space/api/public/plans', {
    headers: {
      'x-api-key': process.env.ERP_API_KEY!,
      'Content-Type': 'application/json'
    },
    next: { revalidate: 3600 } // Cache for 1 hour
  });

  const data = await res.json();
  return data.success ? data.data : [];
}

export default async function PricingPage() {
  const plans = await getPlans();

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold text-center mb-12">
        Choose Your Plan
      </h1>
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan: any) => (
          <div key={plan.id} className="border rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">{plan.name}</h2>
            <div className="text-4xl font-bold mb-4">
              ₹{plan.price}
              <span className="text-sm text-gray-600">/year</span>
            </div>
            <p className="text-gray-600 mb-6">{plan.description}</p>
            <ul className="space-y-2 mb-6">
              {plan.features.map((feature: string, idx: number) => (
                <li key={idx} className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="text-sm text-gray-500 mb-4">
              Up to {plan.maxProducts.toLocaleString()} products
            </div>
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
              Get Started
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Python Example

```python
import requests

API_KEY = 'YOUR_API_KEY'
API_URL = 'https://erp.fashionpos.space/api/public/plans'

def fetch_plans():
    headers = {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(API_URL, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('success'):
            return data.get('data', [])
        else:
            print(f"Error: {data.get('error')}")
            return []
            
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return []

# Usage
plans = fetch_plans()
for plan in plans:
    print(f"{plan['name']}: ₹{plan['price']}/year")
    print(f"  Max Products: {plan['maxProducts']}")
    print(f"  Features: {', '.join(plan['features'])}")
    print()
```

### PHP Example

```php
<?php

$apiKey = 'YOUR_API_KEY';
$apiUrl = 'https://erp.fashionpos.space/api/public/plans';

function fetchPlans($apiUrl, $apiKey) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'x-api-key: ' . $apiKey,
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $data = json_decode($response, true);
        return $data['success'] ? $data['data'] : [];
    }
    
    return [];
}

// Usage
$plans = fetchPlans($apiUrl, $apiKey);

foreach ($plans as $plan) {
    echo "{$plan['name']}: ₹{$plan['price']}/year\n";
    echo "Max Products: {$plan['maxProducts']}\n";
    echo "Features: " . implode(', ', $plan['features']) . "\n\n";
}
?>
```

---

## CORS Support

The API includes CORS headers to allow cross-origin requests:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET
Access-Control-Allow-Headers: Content-Type, x-api-key
```

This means you can call the API directly from browser-based applications.

---

## Rate Limiting

Currently, there are no rate limits enforced. However, please be considerate:
- Cache responses when possible
- Avoid excessive polling
- Recommended: Fetch plans once per hour or on-demand

---

## Best Practices

1. **Cache Responses**: Plans don't change frequently. Cache for at least 1 hour.
2. **Error Handling**: Always handle both network errors and API errors.
3. **Secure API Key**: Never expose your API key in client-side code. Use environment variables.
4. **Fallback UI**: Show a fallback message if plans fail to load.

---

## Environment Setup

### For Development

Create a `.env.local` file:

```env
# For Next.js/React
NEXT_PUBLIC_ERP_API_URL=https://erp.fashionpos.space/api/public/plans
ERP_API_KEY=your_api_key_here

# For Node.js
ERP_API_URL=https://erp.fashionpos.space/api/public/plans
ERP_API_KEY=your_api_key_here
```

### For Production

Set environment variables in your hosting platform:
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Environment Variables
- AWS/Heroku: Use their respective environment configuration

---

## Support

For API access, issues, or questions:
- **Email:** support@fashionpos.com
- **Phone:** +91 9427300816
- **Documentation:** https://erp.fashionpos.space/docs

---

## Changelog

### v1.0.0 (Current)
- Initial public API release
- GET endpoint for active plans
- API key authentication
- CORS support

---

**Last Updated:** 2024  
**API Version:** 1.0.0
