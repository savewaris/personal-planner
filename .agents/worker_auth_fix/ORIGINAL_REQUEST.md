## 2026-07-23T03:21:53Z

You are worker_auth_fix.
Working Directory: d:/save/Antigravity/Planner/.agents/worker_auth_fix
Identity: teamwork_preview_worker

Your mission:
Fix the critical security and requirement flaws in NextAuth configuration (`src/lib/auth.ts`) and refactor auth unit tests.

### Required Changes:

1. **Fix Password Verification in `src/lib/auth.ts`**:
   - File: `d:/save/Antigravity/Planner/src/lib/auth.ts`
   - Import `bcrypt` (or `bcryptjs`).
   - In `CredentialsProvider.authorize(credentials)`:
     Fetch user by `email`. If user exists and `user.password` exists, compare `credentials.password` with `user.password` using `await bcrypt.compare(credentials.password, user.password)`.
     If `isValid` is true, return `{ id: user.id, email: user.email, name: user.name }`.
     If user does not exist or password comparison fails, return `null`.

2. **Add Missing OAuth & Magic Link Providers in `src/lib/auth.ts`**:
   - Import `GoogleProvider` from `next-auth/providers/google` (or `next-auth/providers/...`), `GithubProvider` from `next-auth/providers/github`, and `EmailProvider` from `next-auth/providers/email`.
   - Add `GoogleProvider`, `GithubProvider`, and `EmailProvider` to `authOptions.providers` array along with `CredentialsProvider`:
     ```ts
     providers: [
       CredentialsProvider({ ... }),
       GoogleProvider({
         clientId: process.env.GOOGLE_CLIENT_ID || 'mock_google_client_id',
         clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_google_client_secret',
       }),
       GithubProvider({
         clientId: process.env.GITHUB_CLIENT_ID || 'mock_github_client_id',
         clientSecret: process.env.GITHUB_CLIENT_SECRET || 'mock_github_client_secret',
       }),
       EmailProvider({
         server: process.env.EMAIL_SERVER || 'smtp://localhost:1025',
         from: process.env.EMAIL_FROM || 'noreply@planner.app',
       }),
     ]
     ```

3. **Refactor Auth Unit Tests (`tests/jest/tier1/auth.test.ts`)**:
   - Update `tests/jest/tier1/auth.test.ts` to test actual bcrypt password verification (valid password passes, invalid password fails) and assert that `authOptions.providers` has Credentials, Google, GitHub, and Email providers registered.

4. **Run Verification Commands**:
   - `npx tsc --noEmit` (must pass with 0 errors)
   - `npm run test:unit` (must pass 100%)
   - `npm run build` (must complete cleanly with 0 compilation errors)
