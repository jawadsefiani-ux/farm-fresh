# Farm Fresh

Phase 1 farm-management foundation built with Next.js, TypeScript, Tailwind, and a Supabase/Postgres migration.

## Connect Supabase

1. Create a Supabase project.
2. Run `supabase/migrations/20260901000000_phase_1_farm_fresh.sql` in its SQL editor (or apply it through the Supabase CLI).
3. Copy `.env.example` to `.env.local` and set the project URL and anon key.

The migration creates and seeds the permanent planting zones and initial seed inventory.
