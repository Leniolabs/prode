# Prode

Prode is a Next.js App Router project for World Cup prediction rooms. It uses Prisma + Postgres, Auth.js OAuth, and a seeded WC 2026 dataset.

## Requirements

- Node.js 20+
- Docker (recommended for local Postgres)
- npm

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and fill at least:

```bash
GOOGLE_ID=
GOOGLE_SECRET=
AUTH_SECRET=
DATABASE_URL=postgresql://leniolabs:leniolabs@localhost:5434/prode
```

Generate `AUTH_SECRET` with:

```bash
openssl rand -hex 32
```

3. Start a local Postgres instance.

Option A (recommended when port 5432 is already used):

```bash
docker run -d --name prode-db-local \
	-e POSTGRES_DB=prode \
	-e POSTGRES_USER=leniolabs \
	-e POSTGRES_PASSWORD=leniolabs \
	-p 5434:5432 postgres:15.1
```

Option B (project compose service on 5432):

```bash
docker compose up -d prode-db
```

If you use option B, set `DATABASE_URL` to port `5432`.

4. Apply migrations:

```bash
npx prisma migrate deploy
```

If this is a local dev DB and you need a clean start:

```bash
npx prisma migrate reset --force --skip-seed
```

5. Seed core WC 2026 data (countries + fixture + bracket):

```bash
npx prisma db seed
```

6. Run the app:

```bash
npm run dev
```

## Auth Notes

- `AUTH_SECRET` is required by Auth.js. Missing it causes a server configuration error.
- OAuth providers are conditionally registered from env vars.
- For Google sign-in, `GOOGLE_ID` and `GOOGLE_SECRET` are enough.
- Google callback URI for local development:

```text
http://localhost:3000/api/auth/callback/google
```

If the app runs on another port (for example `3001`), add that callback URI too.

## Database Notes

- Main schema lives in `prisma/schema.prisma`.
- "Teams" are represented by the `Country` model.
- Matches are represented by the `Match` model.
- Migration SQL history is in `prisma/migrations/`.

Useful checks:

```bash
PGPASSWORD=leniolabs psql "postgresql://leniolabs:leniolabs@localhost:5434/prode" -c "\dt"
PGPASSWORD=leniolabs psql "postgresql://leniolabs:leniolabs@localhost:5434/prode" -c "show search_path;"
```

If a DB client (for example DBeaver) shows empty tables but `psql` does not:

- confirm host/port/database/user match your `DATABASE_URL`
- set active schema to `public`
- refresh schemas and clear object filters

## Common Commands

```bash
npm run dev
npm run build
npm test
npm run test:coverage
npm run test:db:up
npm run test:db:reset
npm run harness:check
```

## Seeding Countries and Matches (Best Approach)

Use idempotent seed scripts, not ad-hoc SQL inserts.

- Countries seed: `prisma/seed/countries.ts`
- Group matches seed: `prisma/seed/fixture.ts`
- Entry point: `prisma/seed/index.ts`

Run:

```bash
npx prisma db seed
```

Why this is best:

- repeatable across all dev machines
- safe to run more than once (`upsert` for countries)
- keeps fixture dates/stages consistent with application logic
