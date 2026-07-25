# Workflow: Data & Schema Governance

Guides agents through modifying database schemas, running migrations, and updating API validation contracts.

## Steps:
1. Edit `prisma/schema.prisma` with required model changes.
2. Synchronize database: `npx prisma db push` and `npx prisma generate`.
3. Update `prisma/seed.ts` and test seed execution: `npx tsx prisma/seed.ts`.
4. Update API Client signatures in `src/services/api.ts` to match schema updates.
