# Market Bubble Tracker

Public dashboard for US market froth indicators at `bubble.builtthisweekend.com`.

## Local Development

```bash
npm install
npm run dev
```

Without Supabase env vars, the app uses the bundled static metric catalog so the public dashboard, detail pages, sources, OG route, and education page still render.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/migrations/0001_initial_schema.sql`.
3. Copy `.env.example` to `.env.local` and fill:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_EMAILS`
4. Seed initial metric definitions and fallback history:

```bash
npm run seed:static
```

## Ingestion

Daily ingestion is handled by `.github/workflows/market-bubble-ingest.yml`:

```bash
npm run ingest
```

The script uses free public endpoints:

- FRED CSV downloads for Treasury, VIX, credit spreads, unemployment, Sahm Rule, Wilshire 5000, and GDP.
- CoinGecko free global endpoint for crypto speculation.

It upserts metric values, recomputes the composite, evaluates user alerts, writes in-app notifications, and logs `ingestion_runs`. No email service is used.

## Features by Phase

- Phase 1: public dashboard, US scope, composite score, metric cards/detail pages, source/cadence labels, share controls, OG image, disclaimers.
- Phase 2: Supabase Auth, magic-link sign-in, in-app alerts, notifications, watchlist, privacy/delete-account path.
- Phase 3: public metric submissions, ideas list, signed-in upvotes, admin status review.
- Phase 4: admin manual metric creation and value entry for Tier 3 curated signals.

## Verification

```bash
npm test
npm run lint
npm run build
```

The app is intentionally free-tier only: Vercel, Supabase, GitHub Actions, FRED, CoinGecko, and public/manual sources.
