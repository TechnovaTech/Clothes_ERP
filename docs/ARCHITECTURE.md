# Architecture Overview

- Framework: Next.js App Router (14.x) with React 18 and TypeScript
- UI: Radix UI primitives, Tailwind CSS and custom components
- Auth: NextAuth Credentials provider, JWT sessions
- Data: MongoDB with per-tenant databases via `connectTenantDB`
- Multi-Tenant: Isolation at database level; shared main DB for tenants and plans
- APIs: Route handlers under `app/api/*`, server-side checks with session and feature access
- Features: POS, Inventory, Customers, Bills, Purchases, HR, Leaves, Referrals, Settings, Super Admin

## Frontend Structure

- Layouts: `components/layout/main-layout`
- Feature gating: `components/feature-guard` using `lib/access-control.ts`
- State helpers: `lib/language-context`, `lib/store-context`
- Common UI: `components/ui/*` (Radix + custom)

## Backend Structure

- Database: `lib/database.ts` (shared and tenant DB connectors)
- Tenant utilities: `lib/tenant-data.ts` (`getTenantCollection`, init/cleanup)
- Access control: `lib/access-control.ts`, `lib/api-middleware.ts`, `lib/plan-limits.ts`
- Auth setup: `lib/auth.ts`
- API routes: under `app/api/*` per feature

## Multi-Tier Data Flow

- Browser → App Router pages → client actions (fetch) → API route → tenant DB
- Session carries `tenantId` and `role`; checked at API entry
- Feature access verified per tenant plan before executing handlers

---

# Module Map

- POS: `app/tenant/pos/page.tsx` (cart, tax, GST per item, sales submission)
- Inventory: `app/tenant/inventory/page.tsx` (CRUD, filters, dropdowns)
- Customers: `app/tenant/customers/page.tsx` (list, import/export, bills view)
- Bills: `app/tenant/bills/page.tsx` (history, view, edit, PDF)
- Purchases: `app/tenant/purchases/page.tsx` (PO list, complete/delete)
- HR: `app/tenant/hr/page.tsx` (employees management)
- Leaves: `app/tenant/leaves/page.tsx` (leave tracking)
- Referrals: `app/tenant/referrals/page.tsx` (programs, reports)
- Settings: `app/tenant/settings/page.tsx` (store and tax settings)
- Dropdown Settings: `app/tenant/dropdown-settings/page.tsx` (dynamic options)
- Super Admin: `app/super-admin/*` (tenants, plans, fields, dashboards)

