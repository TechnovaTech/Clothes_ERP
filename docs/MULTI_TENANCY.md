# Multi-Tenancy Design

- Tenant discovery: main DB `tenants` collection
- DB per tenant: `connectTenantDB(tenantId, tenantName?)`
- Collections accessed via `getTenantCollection(tenantId, collection)`
- Plan limits and features: `lib/plan-limits.ts`, `lib/access-control.ts`
- Tenant deletion: `cleanupTenantData(tenantId)` drops tenant DB and removes main record

## Feature Access

- `AVAILABLE_FEATURES` defines feature keys
- Tenant’s plan determines permitted features
- UI guard: `FeatureGuard` wraps pages/components

