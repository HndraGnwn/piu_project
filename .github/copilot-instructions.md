---
applyTo: "**/*"
name: cookie-pos-instructions
---

# Cookie POS — Workspace Instructions

Use these instructions for all agent interactions in this repository.

- Project purpose: Single-tenant POS for Dubai Chewy Cookie — inventory, online/offline sales, reporting.
- Data store: Supabase. Schema lives at `supabase/schema.sql` and must be the source of truth for DB changes.
- Environment: Use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the client; server keys must be kept out of the repo.
- Coding style: Follow existing patterns (Next.js app router, React + TypeScript, Tailwind classes). Keep changes minimal and focused.
- When implementing features:
  - Prefer adding or editing files under `app/` and components under `components/`.
  - Update `lib/supabase.ts` if Supabase usage needs to change.
  - Add SQL migrations to `supabase/schema.sql` and mention them in PR descriptions.
- Testing and validation: Run the dev server (`npm run dev`) and verify page render and Supabase interactions locally.
- Security: Never output secrets or commit `.env` files. If a secret is required, instruct the user where to add it.

If the user's request is large, propose an implementation plan and ask for approval before making multiple file changes.
