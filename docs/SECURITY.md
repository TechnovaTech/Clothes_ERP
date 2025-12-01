# Security & Compliance

- Auth enforced at API boundary; unauthenticated returns 401
- Per-tenant DB isolation prevents cross-tenant data access
- Bcrypt password storage for tenants
- Feature and plan checks guard UI and APIs
- Input validation in APIs; sanitized template rendering
- No secrets logged; connection URI masked in logs

