# AquaFill

Security-hardening update (April 2026):

- JWT authentication is now required for all non-auth API routes.
- Role-based authorization is enforced (`admin`, `staff`, `rider`, `customer`).
- Customer endpoints now use secure `/me` routes and ownership checks.
- Public signup no longer allows role escalation.
- Google login now requires Firebase ID token verification.
- Auth and API endpoints are rate-limited.
- Security headers and stricter CORS handling are enabled.

## Backend Security Environment Variables

Set these in `backend/.env`:

- `JWT_SECRET` (required)
- `FIREBASE_PROJECT_ID` (required for Google login)
- `CORS_ORIGIN` or `CORS_ORIGINS` (comma-separated allowlist)
- `FRONTEND_URL` (optional additional allowed origin)
- `TRUST_PROXY=true` (optional when behind a reverse proxy)
