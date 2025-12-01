# API Overview

## Conventions

- Location: `app/api/*`
- Auth required: session with `tenantId` for tenant routes
- Tenant data access: `getTenantCollection(session.user.tenantId, '<collection>')`
- Feature middleware: `withFeatureAccess('<feature>')(handler)`

## Key Endpoints

- POS Sales: `POST /api/pos/sales` — create sale with tax details
- Inventory: `GET/POST /api/inventory`, `PUT/DELETE /api/inventory/[id]`
- Customers: `GET/POST /api/customers`, `GET /api/customers/[id]`, `GET /api/customers/[id]/purchase-history`, `DELETE /api/customers/clear`
- Bills: `GET /api/receipt/[id]`, `GET /api/public-receipt/[id]`, `GET /api/bill-pdf/[id]`
- Purchases: `POST /api/purchases`, `PUT /api/purchases/[id]`, `DELETE /api/purchases/[id]`, import/export/clear
- Settings: `GET/PUT /api/settings`
- Templates: `GET/POST /api/templates`, `POST /api/templates/render`
- Analytics: `GET /api/analytics`, `GET /api/dashboard/analytics`
- Alerts: `GET /api/alerts/low-stock`, `GET /api/alerts/logs`
- Plans: `GET /api/plans`, `POST /api/assign-plan`, `GET /api/plan-limits`
- Tenants: `GET/POST /api/tenants`, `DELETE /api/tenants/[id]`
- Auth: `GET/POST /api/auth/[...nextauth]`, `GET /api/auth/check-status`

## Public APIs

- Plans: `GET /api/public/plans` with `x-api-key`
- Public Receipt: `GET /api/public-receipt/[id]`

