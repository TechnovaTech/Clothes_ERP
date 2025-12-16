# Retailians Mobile App

## Menus

- POS
  - Product list with responsive grid/list
  - Cart with live updates (add/remove/quantity)
  - Checkout step with discount, tax toggle, totals
  - Payment modal with Cash/Online selection and dynamic button
  - Post-sale reset for fast next sale

- Inventory
  - Browse inventory, prices, stock
  - Search and filters

- Customers
  - Customer listing and quick select in POS
  - Auto-fill of phone, address, GST

- Bills
  - Paginated bills list with search
  - Open PDF bill externally
  - WhatsApp sharing sends bill PDF link

- Purchases
  - Manage purchase orders and supplier info

- Analytics
  - Sales and profit summaries
  - Daily and monthly trends

## Branding

- App name set to Retailians (Android/iOS)
- Global logo
  - Sidebar loads store logo from `baseUrl/logo.png` with asset fallback
  - Login screen uses bundled `android/app/src/logo.png`
- Technova footer link in sidebar

## UX Improvements

- Back behavior
  - System back navigates within app instead of closing
  - Drawer back closes drawer; POS back exits checkout to product list
- Cart persistence
  - Cart saved/restored via SharedPreferences
- Debug banner
  - Disabled in release and debug

## Release

- Android APK built as `build/app/outputs/flutter-apk/app-release.apk`
- Launcher icon generated from `android/app/src/logo.png`
- Native splash configured with the same logo

## Technical Notes

- API client uses cookie manager for authenticated requests
- Settings fetched to derive tax and store info
- Resilient logo loading in sidebar with byte fetch and fallback
