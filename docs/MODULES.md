# Modules & Workflows

## POS

- Product search and barcode scanning
- Cart items with per-item `gstRate` and optional `hsn`
- Tax calculation respects `includeTax`, `gstRateOverride` and `billGstRate`
- Sale submission to `/api/pos/sales` persists to tenant `sales`

## Inventory

- CRUD of products; dynamic fields merge with business type defaults
- Filters: category and stock status
- Import/export and bulk operations

## Customers

- Manage customer records; import/export; clear
- Purchase history via `/api/customers/[id]/purchase-history`
- Bills view and inline edit modal

## Bills

- History listing, view modal with store info and GST
- PDF and public receipt endpoints for sharing

## Purchases

- Manage purchase orders; update, complete, delete
- Totals exclude tax by design (`tax = 0`)

## HR & Leaves

- Employees management, salary utilities, leave tracking
- Import/export and bulk operations

## Referrals

- Programs configuration; referral records and commission tracking

## Settings & Dropdowns

- Store and tax settings; business type selection
- Dropdown options managed and merged per tenant business type

