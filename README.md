# Attribution Tracker

First-party multi-touch attribution system. Tracks user journeys from anonymous first visit through UTM-tagged channels to identified conversion, entirely on infrastructure you control.

## Architecture

```
packages/
  snippet/    Vanilla JS tracking snippet (1.7KB gzipped)
  api/        Fastify Collector + Reporting API (Node.js)
  dashboard/  Next.js 15 App Router dashboard
infra/
  supabase/   PostgreSQL migrations + seed data
  railway.toml
```

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 (`npm install -g pnpm`)
- A [Supabase](https://supabase.com) project
- A [Railway](https://railway.app) account (or any Node.js host)

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url> attribution-tracker
cd attribution-tracker
pnpm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. In the **SQL Editor**, run the migrations in order:
   - `packages/api/src/db/migrations/001_initial_schema.sql`
   - `packages/api/src/db/migrations/002_indexes.sql`
3. Copy the **connection string** from Settings → Database → Connection string (use port **6543** for the pooler in production)
4. Optional: run `infra/supabase/seed.sql` for local test data

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in:

```env
DATABASE_URL=postgres://postgres:[PASSWORD]@[HOST]:6543/postgres
ADMIN_KEY=<openssl rand -hex 32>
CORS_ORIGINS=http://localhost:3001
```

### 4. Create a write key

```bash
pnpm --filter api exec tsx src/scripts/create-write-key.ts \
  --domain yourdomain.com \
  --label "Production"
```

Copy the output `window.analyticsWriteKey = '...'` — this is shown once.

### 5. Run locally

```bash
# API (port 3000)
pnpm dev:api

# Dashboard (port 3001)
pnpm dev:dashboard
```

---

## Install the Snippet

Add to the `<head>` of every page you want to track:

```html
<script>
  window.analyticsWriteKey = 'YOUR_KEY_ID.YOUR_SECRET';
  window.analyticsCollectorUrl = 'https://your-api.up.railway.app';
</script>
<script src="https://your-dashboard.up.railway.app/analytics.min.js" async></script>
```

### Identify on form submit

```js
analytics.identify('', {
  email: form.email.value,
  name: form.name.value,
}, {
  type: 'lead',   // 'lead' | 'purchase' | 'demo' | 'download' | custom
  value: 0,       // monetary value if known
});
```

### Custom events

```js
analytics.track('cta_click', { label: 'hero-cta', url: location.href });
```

---

## Deploy to Railway

### API service

1. New project → connect GitHub repo
2. Add service, root directory: `packages/api`
3. Build command: `pnpm --filter api build`
4. Start command: `node packages/api/dist/server.js`
5. Environment variables (same as `.env` above + `NODE_ENV=production`)
6. Health check path: `/v1/healthz`

### Dashboard service

1. Add second service, root directory: `packages/dashboard`
2. Build command: `pnpm --filter dashboard build`
3. Start command: `pnpm --filter dashboard start`
4. Environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.up.railway.app
   API_INTERNAL_URL=https://your-api.up.railway.app
   ADMIN_KEY=<same as API>
   ```
5. Copy `packages/snippet/dist/analytics.min.js` to `packages/dashboard/public/`

---

## API Reference

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/v1/track` | Write Key | Track an event |
| POST | `/v1/identify` | Write Key | Link user + optional conversion |
| GET | `/v1/healthz` | — | Health check |
| GET | `/v1/reports/channels` | Admin Key | Conversions + CPA by channel |
| GET | `/v1/reports/journeys` | Admin Key | Full journey for a user |
| GET | `/v1/reports/summary` | Admin Key | Top-level KPIs |
| DELETE | `/v1/users/:email` | Admin Key | GDPR erasure |
| GET | `/v1/settings/write-keys` | Admin Key | List write keys |
| DELETE | `/v1/settings/write-keys/:id` | Admin Key | Revoke a write key |

**Write key auth:** `X-Write-Key: {keyId}.{HMAC-SHA256(secret, body)}`  
**Admin key auth:** `X-Admin-Key: {ADMIN_KEY}`

---

## UTM Naming Conventions

All values must be **lowercase, hyphen-separated**. Include a time period in campaign names.

| Channel | utm_source | utm_medium | utm_campaign example |
|---------|-----------|-----------|---------------------|
| Paid Search | `google` | `cpc` | `brand-q1-2025` |
| Meta Ads | `meta` | `paid-social` | `awareness-q1-2025` |
| TikTok Ads | `tiktok` | `paid-social` | `product-q1-2025` |
| Email | `email` | `newsletter` | `weekly-2025-03-01` |
| LinkedIn | `linkedin` | `paid-social` | `b2b-q1-2025` |
| Organic Social | `instagram` | `social` | `organic` |

---

## GDPR Compliance

Delete all data for a user:

```bash
curl -X DELETE "https://your-api.up.railway.app/v1/users/user@example.com" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY"
```

This nulls IP addresses and user IDs on events, marks conversions as `DELETED`, and removes the identity map entry.

---

## Known Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|-----------|
| Cross-device | Separate journeys until same email on both devices | Email hashing unifies after identify() |
| Safari ITP | ~<15% of users may lose anonymous ID after 7 days | localStorage survives longer than cookies |
| Cookie deletion | Permanent new anonymous ID | No elegant solution without fingerprinting |
| Bot traffic | Inflated event counts | UA-based bot filter in Collector API |
| UTM gaps | Attribution window can't span > 30 days without re-engagement | Operational: require UTMs on all campaigns |
# multi_touch_attribution
