# Admin & API Security Rules

## 1. Authentication & Route Protection

- **Protected Routes**: All administrative and mutating endpoints must verify authentication session or authorization tokens before processing requests.
- **Admin API Handlers**: All mutating endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) affecting database records must verify session/bearer headers.
- **Cookie Security**: Auth cookies must use `HttpOnly; Secure; SameSite=Strict; Path=/`.

---

## 2. Input Sanitization & Data Validation

- **Sanitize Strings**: Trim and strip dangerous HTML/script injections from user-supplied strings before persisting to storage.
- **URL Normalization**: Validate that all external links use HTTPS protocols.
- **External Link Security**: All external links rendered in client components must include `rel="noopener noreferrer"` and `target="_blank"`.

---

## 3. Environment Variable Hygiene

- **Public vs Secret**:
  - Client-exposed variables (`NEXT_PUBLIC_*`, `VITE_*`, `PUBLIC_*`) must NEVER contain API keys, database credentials, or secret signing tokens.
  - Server-only vars: `DATABASE_URL`, `ADMIN_SECRET`, `JWT_SECRET` must remain strictly private.
- Always provide fallback defaults in local development or throw clear descriptive errors if required environment variables are missing.
