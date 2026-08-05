Cookie POS — End-to-end Implementation Plan

Goal: Provide a complete, runnable POS solution for inventory entry, online/offline sales recording, reporting, and deployment using Supabase and Next.js.

Phases

1. Local setup
   - Add env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_KEY (local only).
   - Install deps (`npm install`).
   - Verify `supabase/schema.sql` is applied to the project's Supabase instance.

2. Database and schema
   - Review and, if needed, extend `supabase/schema.sql` to include `variants`, `stock_entries`, `sales_logs` (online/offline), and necessary indexes.
   - Add sample seed data for development.

3. Shared libs and clients
   - Ensure `lib/supabase.ts` exposes client functions for `insertStockEntry`, `recordSale`, and `getDashboardData`.
   - Add typed interfaces in `lib/types.ts` if needed.

4. Pages & components
   - `app/barang-masuk/page.tsx`: form to add stock entries, validate input, call `insertStockEntry` and show success/failure.
   - `components/SalesForm.tsx`: reusable form for recording sales (variant selector, qty, customer info optional).
   - `app/penjualan/online/page.tsx` and `app/penjualan/offline/page.tsx`: use `SalesForm` and call `recordSale`.
   - `components/ReportTable.tsx`: ensure it supports dynamic headers/rows (already present).

5. Server logic & API
   - Add server actions or API routes for server-side operations requiring service key (if needed): e.g., batch import, reconciliation.
   - Secure server-only operations with `SUPABASE_SERVICE_KEY` via server runtime environment.

6. Reporting & dashboard
   - Implement `lib/dashboard.ts` to compute daily sales, monthly totals, and remaining stock (uses existing file).
   - Ensure `app/page.tsx` pulls from `getDashboardData` (already implemented).

7. Tests & validation
   - Manual testing: run dev server, add stock, record sales, and verify reports change.
   - Optional: Add unit tests for `lib/*` functions and integration tests for pages.

8. Deployment
   - Deploy to Vercel or similar; set environment variables in the deployment dashboard.
   - Run migrations or apply `supabase/schema.sql` to production DB.

Deliverables

- Small PRs per feature: schema updates, `lib/*` enhancements, `app/*` pages and components, and docs.

Next actions I can take now

- Implement `app/barang-masuk/page.tsx` form and associated `lib` helper to insert stock entries.
- Implement `app/penjualan/online/page.tsx` with `SalesForm` and `recordSale` integration.
- Add SQL migration snippets to `supabase/schema.sql` if required.

If you'd like me to proceed, tell me which feature to implement first or let me implement `barang-masuk` end-to-end now.
