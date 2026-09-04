# Farm Fresh

Phase 1 farm-management foundation built with Next.js, TypeScript, Tailwind, Neon Postgres, and Drizzle ORM.

## Connect Neon

1. Create a Neon Postgres database.
2. Copy `.env.example` to `.env.local` and set its pooled `DATABASE_URL`.
3. Run `npm run db:migrate`.

The migration creates and idempotently seeds the permanent planting zones and initial seed inventory. `DATABASE_URL` is server-only and must never be prefixed with `NEXT_PUBLIC_`.
