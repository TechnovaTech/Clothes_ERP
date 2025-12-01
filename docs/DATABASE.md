# Database & Collections

## Connection

- URI: `MONGODB_URI` or `DATABASE_URL`
- Main DB: `erp_system`
- Tenant DB: `erp_system_tenant_<safeName>_<tenantId>` created via `connectTenantDB`

## Main Database Collections

- `tenants`: id, name, email, password (bcrypt), status, plan, tenantType
- `plans`: name, `allowedFeatures`, `maxProducts`, `maxUsers`
- `users`: tenant-bound users (counted for limits)
- `alert_logs`: alerts generated per tenant
- `templates`: per-tenant templates (if stored in main DB)

## Tenant Database Collections

- `settings`: storeName, address, phone, email, gst, taxRate, cessRate, billPrefix, billCounter, businessType, logo, signature, billDesign
- `inventory`: name, sku, barcode, category, price, finalPrice, costPrice, stock, minStock, sizes, colors, description, material, brand, dynamic fields
- `customers`: name, phone, email, address, orderCount, totalSpent
- `sales`: items[], subtotal, discount, discountAmount, tax, cess, total, paymentMethod, taxRate, cessRate, storeName, staffMember, includeTax, includeCess, gstRateOverride, billGstRate, createdAt, billNo
- `purchases`: supplierName, supplierContact, supplierContactNo, orderDate, items[], subtotal, tax=0, total, status
- `expenses`: title, amount, category, description, date, createdAt, updatedAt
- `fields`: dynamic field configuration per tenant
- `reports`: generated analytics/exports (optional)

## Multi-Tenant Isolation

- Each tenant’s data lives in a separate DB
- Lookup uses tenant `ObjectId` or string to derive `safeName`
- Cleanup drops tenant DB via `cleanupTenantData`

