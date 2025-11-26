# API Architecture & Flow

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    External Applications                     │
│  (Marketing Website, Mobile App, Partner Portal, etc.)      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ HTTPS Request
                            │ Header: x-api-key
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              https://erp.fashionpos.space                    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Next.js API Route                          │    │
│  │    /app/api/public/plans/route.ts                  │    │
│  │                                                     │    │
│  │  1. Validate API Key                               │    │
│  │  2. Connect to MongoDB                             │    │
│  │  3. Query active plans                             │    │
│  │  4. Format response                                │    │
│  │  5. Add CORS headers                               │    │
│  └──────────────────┬─────────────────────────────────┘    │
│                     │                                        │
│                     ▼                                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │              MongoDB Database                       │    │
│  │                                                     │    │
│  │  Collection: plans                                  │    │
│  │  Filter: { status: 'active' }                      │    │
│  │  Sort: { price: 1 }                                │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ JSON Response
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                        │
│                                                              │
│  - Parse JSON response                                       │
│  - Display plans in UI                                       │
│  - Cache for performance                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request/Response Flow

### 1. Client Makes Request

```javascript
fetch('https://erp.fashionpos.space/api/public/plans', {
  method: 'GET',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
```

### 2. API Route Processes Request

```typescript
// /app/api/public/plans/route.ts

export async function GET(request: NextRequest) {
  // Step 1: Validate API Key
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== process.env.ERP_API_KEY) {
    return NextResponse.json(
      { success: false, error: 'Invalid API key' },
      { status: 401 }
    )
  }

  // Step 2: Connect to Database
  const db = await connectDB()
  const plansCollection = db.collection('plans')
  
  // Step 3: Query Active Plans
  const plans = await plansCollection
    .find({ status: 'active' })
    .sort({ price: 1 })
    .toArray()
  
  // Step 4: Format Response
  const publicPlans = plans.map(plan => ({
    id: plan._id.toString(),
    name: plan.name,
    price: plan.price,
    description: plan.description,
    maxProducts: plan.maxProducts,
    durationDays: plan.durationDays || 365,
    features: plan.features || [],
    allowedFeatures: plan.allowedFeatures || []
  }))
  
  // Step 5: Return with CORS Headers
  return NextResponse.json(
    { success: true, data: publicPlans },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key'
      }
    }
  )
}
```

### 3. Client Receives Response

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
      "features": [...],
      "allowedFeatures": [...]
    }
  ]
}
```

---

## 🔐 Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      Security Layers                         │
└─────────────────────────────────────────────────────────────┘

Layer 1: HTTPS Encryption
         │
         ├─ All traffic encrypted with TLS/SSL
         └─ Prevents man-in-the-middle attacks

Layer 2: API Key Authentication
         │
         ├─ Header: x-api-key
         ├─ Validated on every request
         └─ Stored in environment variables

Layer 3: CORS Policy
         │
         ├─ Allows cross-origin requests
         ├─ Restricts methods to GET only
         └─ Specifies allowed headers

Layer 4: Data Filtering
         │
         ├─ Only returns active plans
         ├─ Excludes sensitive internal data
         └─ Formats response for public consumption

Layer 5: Rate Limiting (Recommended)
         │
         ├─ Implement on your end
         ├─ Cache responses (1 hour)
         └─ Avoid excessive API calls
```

---

## 📊 Data Flow Diagram

```
┌──────────────┐
│   Browser    │
│  JavaScript  │
└──────┬───────┘
       │
       │ 1. HTTP GET Request
       │    + API Key Header
       │
       ▼
┌──────────────────────┐
│   API Gateway        │
│  (Next.js Server)    │
└──────┬───────────────┘
       │
       │ 2. Validate API Key
       │
       ▼
┌──────────────────────┐
│  Authentication      │
│  Middleware          │
└──────┬───────────────┘
       │
       │ 3. Query Database
       │
       ▼
┌──────────────────────┐
│   MongoDB            │
│   plans collection   │
└──────┬───────────────┘
       │
       │ 4. Return Documents
       │
       ▼
┌──────────────────────┐
│  Data Transformer    │
│  (Format Response)   │
└──────┬───────────────┘
       │
       │ 5. JSON Response
       │    + CORS Headers
       │
       ▼
┌──────────────────────┐
│   Client App         │
│   (Display Plans)    │
└──────────────────────┘
```

---

## 🗄️ Database Schema

```javascript
// MongoDB Collection: plans

{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  name: "Basic",
  price: 999,
  description: "Perfect for small retail stores",
  maxProducts: 1000,
  maxUsers: 999999,
  durationDays: 365,
  features: [
    "Inventory Management",
    "POS System",
    "Customer Management"
  ],
  allowedFeatures: [
    "dashboard",
    "inventory",
    "pos",
    "customers",
    "sales"
  ],
  status: "active",
  createdAt: ISODate("2024-01-01T00:00:00Z"),
  updatedAt: ISODate("2024-01-01T00:00:00Z")
}
```

### Fields Exposed via API

| Field | Internal | Public API | Notes |
|-------|----------|------------|-------|
| `_id` | ✅ | ✅ (as `id`) | Converted to string |
| `name` | ✅ | ✅ | Plan name |
| `price` | ✅ | ✅ | Annual price |
| `description` | ✅ | ✅ | Plan description |
| `maxProducts` | ✅ | ✅ | Product limit |
| `maxUsers` | ✅ | ❌ | Internal only |
| `durationDays` | ✅ | ✅ | Validity period |
| `features` | ✅ | ✅ | Feature list |
| `allowedFeatures` | ✅ | ✅ | System features |
| `status` | ✅ | ❌ | Filter only |
| `createdAt` | ✅ | ❌ | Internal only |
| `updatedAt` | ✅ | ❌ | Internal only |

---

## 🚀 Performance Optimization

```
┌─────────────────────────────────────────────────────────────┐
│                  Performance Strategy                        │
└─────────────────────────────────────────────────────────────┘

Client-Side Caching
├─ Cache Duration: 1 hour
├─ Storage: LocalStorage / Memory
└─ Reduces API calls by 95%

Server-Side Caching (Recommended)
├─ Cache Duration: 1 hour
├─ Storage: Redis / Memory
└─ Faster response times

Database Indexing
├─ Index on: status field
├─ Index on: price field
└─ Faster query execution

CDN Caching
├─ Cache API responses
├─ Edge locations
└─ Global distribution

Response Compression
├─ Gzip compression
├─ Smaller payload
└─ Faster transfer
```

---

## 🔄 Integration Patterns

### Pattern 1: Direct Client-Side Call

```
Browser → API → Database → Browser
```

**Pros:** Simple, no backend needed  
**Cons:** API key exposed in network tab  
**Use Case:** Internal tools, demos

### Pattern 2: Server-Side Proxy (Recommended)

```
Browser → Your Backend → API → Database → Your Backend → Browser
```

**Pros:** API key hidden, additional caching  
**Cons:** Extra server required  
**Use Case:** Production websites

### Pattern 3: Static Site Generation

```
Build Time: API → Database → Static JSON
Runtime: Browser → Static JSON
```

**Pros:** Ultra-fast, no runtime API calls  
**Cons:** Requires rebuild for updates  
**Use Case:** Marketing sites (Next.js, Gatsby)

---

## 📈 Scalability Considerations

```
Current Setup:
├─ Single API endpoint
├─ MongoDB database
├─ No rate limiting
└─ CORS enabled for all origins

Recommended for Scale:
├─ Implement rate limiting (100 req/min per IP)
├─ Add Redis caching layer
├─ Use CDN for API responses
├─ Monitor API usage
├─ Implement API versioning (/v1/plans)
└─ Add pagination for large datasets
```

---

## 🛠️ Monitoring & Logging

```javascript
// Recommended logging structure

{
  timestamp: "2024-01-01T12:00:00Z",
  endpoint: "/api/public/plans",
  method: "GET",
  apiKey: "***hidden***",
  responseTime: "45ms",
  status: 200,
  clientIP: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
  cacheHit: false
}
```

---

## 🔧 Environment Configuration

```env
# Production Environment Variables

# Database
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/erp

# API Security
ERP_API_KEY=your_secure_api_key_here

# Next.js
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://erp.fashionpos.space

# Optional: Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# Optional: Caching
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600
```

---

## 📞 Support & Maintenance

**API Endpoint:**
```
https://erp.fashionpos.space/api/public/plans
```

**Status Page:** (Recommended to create)
```
https://erp.fashionpos.space/api/status
```

**Documentation:**
```
https://erp.fashionpos.space/api/docs
```

**Support Contact:**
- 📧 support@fashionpos.com
- 📱 +91 9427300816

---

## 🎯 Future Enhancements

### Planned Features
- [ ] API versioning (/v1, /v2)
- [ ] Pagination support
- [ ] Filtering by price range
- [ ] Sorting options
- [ ] Plan comparison endpoint
- [ ] Webhook notifications
- [ ] GraphQL support
- [ ] Rate limiting
- [ ] API analytics dashboard

### Potential Endpoints
```
GET  /api/public/plans           - List all plans
GET  /api/public/plans/:id       - Get single plan
GET  /api/public/plans/compare   - Compare plans
GET  /api/public/features        - List all features
POST /api/public/subscribe       - Subscribe to plan
```

---

**Architecture Version:** 1.0.0  
**Last Updated:** 2024
