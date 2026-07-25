# Data & Schema Governance Guardrail Rule

Whenever modifying database models or API inputs:
1. Update `prisma/schema.prisma` first.
2. Run `npx prisma db push` and `npx prisma generate`.
3. Update `prisma/seed.ts` if model fields change.
4. Ensure Zod schemas or typescript types validate API request payloads before DB operations.
5. Always test database seed execution with `npx tsx prisma/seed.ts`.
