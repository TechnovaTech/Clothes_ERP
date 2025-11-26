# ERP Integration Guide for Plans

## Overview
This guide explains how the ERP system at https://erp.fashionpos.space/ syncs plans with the website at https://fashionpos.space/

## ✅ Setup Complete

### 1. Public API Endpoint
**URL:** `https://erp.fashionpos.space/api/public/plans`
**Method:** GET
**Authentication:** API Key via `x-api-key` header

### 2. API Key Configuration
```env
ERP_API_KEY=fashionpos-erp-api-key-2024
```

### 3. API Response Format
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Basic Plan",
      "price": 5000,
      "description": "Perfect for small businesses",
      "maxProducts": 100,
      "durationDays": 365,
      "features": [
        "Inventory Management",
        "Basic Reporting",
        "Customer Management"
      ],
      "allowedFeatures": [
        "dashboard",
        "inventory",
        "customers"
      ]
    }
  ]
}
```

### 4. Database Schema
```javascript
{
  _id: ObjectId,
  name: "Basic Plan",
  price: 5000,
  description: "Perfect for small businesses",
  maxProducts: 100,        // -1 for unlimited
  maxUsers: 5,
  durationDays: 365,
  features: ["Feature 1", "Feature 2"],
  allowedFeatures: ["dashboard", "inventory"],
  status: "active",        // "active" or "inactive"
  createdAt: Date,
  updatedAt: Date
}
```

### 5. CORS Configuration
The endpoint allows requests from any origin:
```javascript
'Access-Control-Allow-Origin': '*'
'Access-Control-Allow-Methods': 'GET'
'Access-Control-Allow-Headers': 'Content-Type, x-api-key'
```

## Website Integration

### How to Call from Website (https://fashionpos.space/)

```javascript
const response = await fetch('https://erp.fashionpos.space/api/public/plans', {
  headers: {
    'x-api-key': 'fashionpos-erp-api-key-2024'
  }
})

const result = await response.json()
if (result.success) {
  const plans = result.data
  // Display plans on website
}
```

### Example with Error Handling

```javascript
async function fetchPlans() {
  try {
    const response = await fetch('https://erp.fashionpos.space/api/public/plans', {
      headers: {
        'x-api-key': 'fashionpos-erp-api-key-2024'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch plans')
    }
    
    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error fetching plans:', error)
    // Return fallback plans
    return []
  }
}
```

## Managing Plans in ERP

### Adding a New Plan
1. Login to ERP as Super Admin
2. Navigate to **Super Admin → Plans**
3. Click **Add Plan**
4. Fill in:
   - Name
   - Price
   - Description
   - Max Products (-1 for unlimited)
   - Max Users
   - Duration (days)
   - Features (list)
   - Allowed Features (feature codes)
5. Set Status to **Active**
6. Save

### Plan will automatically appear on website within:
- Immediately if website uses real-time fetching
- Within cache duration if website uses caching (typically 5-10 minutes)

## Testing the Integration

### 1. Test ERP Endpoint
```bash
curl -H "x-api-key: fashionpos-erp-api-key-2024" \
  https://erp.fashionpos.space/api/public/plans
```

### 2. Verify Response
- Check `success: true`
- Verify plans array has data
- Confirm all required fields are present

### 3. Test from Website
- Visit https://fashionpos.space/pricing or plans page
- Verify plans display correctly
- Check browser console for any errors

## Security Notes

✅ **Implemented:**
- API Key authentication
- CORS enabled for cross-origin requests
- HTTPS required in production
- Only active plans are exposed

⚠️ **Recommendations:**
- Change API key before production deployment
- Monitor API usage for unusual patterns
- Implement rate limiting if needed
- Keep API key secure (don't commit to public repos)

## Troubleshooting

### Plans not showing on website?
1. Check ERP endpoint is accessible
2. Verify API key matches in both systems
3. Ensure plans have `status: "active"`
4. Check browser console for CORS errors
5. Clear website cache

### API returns 401 Unauthorized?
- Verify `x-api-key` header is sent
- Check API key matches `ERP_API_KEY` in .env.local

### API returns empty data?
- Ensure plans exist in database
- Verify plans have `status: "active"`
- Check database connection

## Production Deployment Checklist

- [ ] Update `ERP_API_KEY` to secure production key
- [ ] Deploy ERP to https://erp.fashionpos.space/
- [ ] Test public API endpoint
- [ ] Update website with production API key
- [ ] Add at least one active plan
- [ ] Test end-to-end integration
- [ ] Monitor API logs for errors
- [ ] Set up alerts for API failures

## Support

For issues or questions:
- Check ERP logs: `/api/public/plans` endpoint
- Verify database connectivity
- Contact: support@fashionpos.space
- Phone: +91 9427300816
