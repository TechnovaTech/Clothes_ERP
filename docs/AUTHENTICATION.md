# Authentication & Authorization

## Auth

- Provider: NextAuth Credentials
- Roles: `super-admin`, `tenant-admin`, `factory-manager` (demo)
- Session strategy: JWT
- Session token includes: `role`, `tenantId`, `storeName`, `tenantType`, `factoryId`

## Login Flow

- Super admin: static demo credentials
- Tenant admin: verified via `tenants` collection and bcrypt password
- Inactive tenants blocked post password check

## Authorization

- API routes enforce `getServerSession(authOptions)` and require `session.user.tenantId`
- Feature gating via `withFeatureAccess(feature)` and `lib/access-control.ts`

