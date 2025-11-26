# Fashion ERP - Public API

## 📋 Overview

The Fashion ERP Public API allows you to fetch subscription plans data to display on external websites, landing pages, or third-party applications.

**Live API:** `https://erp.fashionpos.space/api/public/plans`

---

## 🎯 Use Cases

- Display pricing plans on your marketing website
- Build custom pricing calculators
- Create comparison tools
- Integrate with third-party platforms
- Mobile app integration
- Partner portals

---

## 🔐 Authentication

All requests require an API key passed in the header:

```
x-api-key: YOUR_API_KEY
```

**To get your API key:**
1. Contact system administrator
2. Set `ERP_API_KEY` in your environment variables
3. Keep it secure - never expose in client-side code

---

## 🚀 Quick Start

### 1. Test with cURL

```bash
curl -X GET "https://erp.fashionpos.space/api/public/plans" \
  -H "x-api-key: YOUR_API_KEY"
```

### 2. JavaScript Example

```javascript
const response = await fetch('https://erp.fashionpos.space/api/public/plans', {
  headers: { 'x-api-key': 'YOUR_API_KEY' }
});
const data = await response.json();
console.log(data.data); // Array of plans
```

### 3. View Live Demo

Open the demo page in your browser:
```
https://erp.fashionpos.space/api-demo.html?apiKey=YOUR_API_KEY
```

---

## 📊 Response Format

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
        "customers"
      ]
    }
  ]
}
```

---

## 📚 Documentation Files

| File | Description |
|------|-------------|
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | Complete API reference with examples |
| [API_QUICK_START.md](./API_QUICK_START.md) | 2-minute quick start guide |
| [api-demo.html](./public/api-demo.html) | Live interactive demo |

---

## 💡 Integration Examples

### React Component

```jsx
import { useState, useEffect } from 'react';

export default function PricingPlans() {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetch('https://erp.fashionpos.space/api/public/plans', {
      headers: { 'x-api-key': process.env.REACT_APP_ERP_API_KEY }
    })
      .then(res => res.json())
      .then(data => setPlans(data.data));
  }, []);

  return (
    <div className="grid grid-cols-3 gap-6">
      {plans.map(plan => (
        <div key={plan.id} className="border rounded-lg p-6">
          <h3 className="text-2xl font-bold">{plan.name}</h3>
          <p className="text-4xl font-bold">₹{plan.price}</p>
          <p className="text-gray-600">{plan.description}</p>
          <ul>
            {plan.features.map((f, i) => (
              <li key={i}>✓ {f}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

### Next.js Server Component

```tsx
async function getPlans() {
  const res = await fetch('https://erp.fashionpos.space/api/public/plans', {
    headers: { 'x-api-key': process.env.ERP_API_KEY! },
    next: { revalidate: 3600 } // Cache for 1 hour
  });
  const data = await res.json();
  return data.data;
}

export default async function PricingPage() {
  const plans = await getPlans();
  
  return (
    <div>
      {plans.map(plan => (
        <div key={plan.id}>
          <h2>{plan.name}</h2>
          <p>₹{plan.price}/year</p>
        </div>
      ))}
    </div>
  );
}
```

### WordPress (PHP)

```php
<?php
function fetch_erp_plans() {
    $api_key = get_option('erp_api_key');
    $response = wp_remote_get('https://erp.fashionpos.space/api/public/plans', [
        'headers' => [
            'x-api-key' => $api_key
        ]
    ]);
    
    if (is_wp_error($response)) {
        return [];
    }
    
    $body = json_decode(wp_remote_retrieve_body($response), true);
    return $body['success'] ? $body['data'] : [];
}

// Shortcode: [erp_plans]
function erp_plans_shortcode() {
    $plans = fetch_erp_plans();
    ob_start();
    ?>
    <div class="erp-plans">
        <?php foreach ($plans as $plan): ?>
            <div class="plan-card">
                <h3><?php echo esc_html($plan['name']); ?></h3>
                <p class="price">₹<?php echo number_format($plan['price']); ?>/year</p>
                <p><?php echo esc_html($plan['description']); ?></p>
            </div>
        <?php endforeach; ?>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('erp_plans', 'erp_plans_shortcode');
?>
```

---

## 🎨 Display Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier | "507f1f77bcf86cd799439011" |
| `name` | string | Plan name | "Basic", "Standard", "Premium" |
| `price` | number | Annual price (₹) | 999, 2499, 4999 |
| `description` | string | Plan description | "Perfect for small stores" |
| `maxProducts` | number | Product limit | 1000, 5000, 999999 |
| `durationDays` | number | Validity period | 365 |
| `features` | array | Feature list | ["Inventory", "POS"] |
| `allowedFeatures` | array | System features | ["dashboard", "inventory"] |

---

## ⚙️ Features Reference

### Core Features
- `dashboard` - Main dashboard access
- `inventory` - Product management
- `pos` - Point of Sale system
- `customers` - Customer database
- `sales` - Sales tracking

### Advanced Features
- `employees` - Staff management
- `purchases` - Purchase orders
- `reports` - Analytics & reports
- `expenses` - Expense tracking
- `settings` - Store configuration
- `whatsapp` - WhatsApp integration

---

## 🔒 Security Best Practices

1. **Never expose API key in frontend code**
   ```javascript
   // ❌ Bad
   const apiKey = 'sk_live_abc123';
   
   // ✅ Good
   const apiKey = process.env.REACT_APP_ERP_API_KEY;
   ```

2. **Use environment variables**
   ```env
   ERP_API_KEY=your_secret_key
   ```

3. **Implement server-side proxy** (recommended for production)
   ```javascript
   // Your backend API
   app.get('/api/plans', async (req, res) => {
     const response = await fetch('https://erp.fashionpos.space/api/public/plans', {
       headers: { 'x-api-key': process.env.ERP_API_KEY }
     });
     const data = await response.json();
     res.json(data);
   });
   ```

---

## 🚦 Error Handling

### Success Response
```json
{
  "success": true,
  "data": [...]
}
```

### Error Responses

**401 Unauthorized**
```json
{
  "success": false,
  "error": "Invalid API key"
}
```

**500 Server Error**
```json
{
  "success": false,
  "error": "Failed to fetch plans"
}
```

### Handle Errors Properly

```javascript
try {
  const response = await fetch(API_URL, { headers });
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch');
  }
  
  if (data.success) {
    return data.data;
  } else {
    throw new Error(data.error);
  }
} catch (error) {
  console.error('API Error:', error);
  // Show user-friendly error message
}
```

---

## 📈 Performance Tips

1. **Cache responses** - Plans don't change frequently
   ```javascript
   // Cache for 1 hour
   const CACHE_TIME = 3600000;
   let cachedPlans = null;
   let cacheTimestamp = 0;
   
   async function getPlans() {
     const now = Date.now();
     if (cachedPlans && (now - cacheTimestamp) < CACHE_TIME) {
       return cachedPlans;
     }
     
     const plans = await fetchPlans();
     cachedPlans = plans;
     cacheTimestamp = now;
     return plans;
   }
   ```

2. **Use CDN caching** - Configure your CDN to cache API responses

3. **Implement loading states** - Show skeleton loaders while fetching

---

## 🌐 CORS Support

The API includes CORS headers, allowing direct browser requests:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET
Access-Control-Allow-Headers: Content-Type, x-api-key
```

---

## 📞 Support

**Need help?**
- 📧 Email: support@fashionpos.com
- 📱 Phone: +91 9427300816
- 📖 Docs: Full documentation in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

**Request API Access:**
Contact the administrator to get your API key.

---

## 🔄 Updates & Versioning

**Current Version:** 1.0.0

The API is stable and backward compatible. Any breaking changes will be announced with a new version.

---

## 📝 License

This API is provided for authorized users only. Unauthorized use is prohibited.

---

**Built with ❤️ by Fashion ERP Team**
