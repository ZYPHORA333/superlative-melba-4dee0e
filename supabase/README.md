# NORTHSTAR Supabase foundation

This is a **schema-only proposal**. It does not connect production authentication or change the existing browser-based dashboard.

## Setup
1. Create a Supabase project under your account.
2. Open **SQL Editor** and review/run `supabase/schema.sql` in a new project.
3. In Authentication settings, configure your real Netlify domain and allowed redirect URLs.
4. Configure email verification, abuse/rate limiting, and recovery settings before accepting public registrations.
5. Use the **Project URL** and **publishable/anon key** in a future frontend integration. Never expose a `service_role` or secret key in browser code or GitHub.
6. Verify each user can only read and modify their own records with two test accounts.

## Tables
- `saved_meal_plans`: per-user plan title, servings and selected days
- `saved_locations`: per-user research coordinates and notes
- `user_preferences`: household size, checklist and wishlist

All three tables enable Row Level Security with owner-only policies. Location data is **unverified research**, not a property, water-access, or buildability certification.

## Next PR
Add Supabase client initialization, sign-up/login/logout, account recovery, cloud saves, and safe migration from existing browser localStorage. Do not enable cloud buttons before configuring and testing your own project.
