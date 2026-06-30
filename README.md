# Prode

Prode is a Next.js App Router project for World Cup prediction rooms. It uses Prisma + Postgres, Auth.js OAuth, and a seeded WC 2026 dataset.

## Requirements

- Node.js 20+
- Docker (recommended for local Postgres)
- npm

## Quick Start (From Scratch)

Follow these steps to set up the project from zero:

### 1. Start the databases

```bash
docker compose up -d
```

This starts both the main dev database (port 5434) and test database (port 5433).

### 2. Create your `.env` file

Copy the example and configure it:

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```bash
DATABASE_URL=postgresql://leniolabs:leniolabs@localhost:5434/prode
AUTH_SECRET=<generate-with-command-below>
GOOGLE_ID=<your-google-oauth-client-id>
GOOGLE_SECRET=<your-google-oauth-client-secret>
```

Generate `AUTH_SECRET`:

```bash
openssl rand -hex 32
```

### 3. Install dependencies

```bash
npm install
```

### 4. Apply database migrations

```bash
npx prisma migrate deploy
```

### 5. Seed WC 2026 data

```bash
npx prisma db seed
```

This creates 48 countries, 72 group-stage matches, and 32 knockout matches.

### 6. Start the dev server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**

---

## Alternative Database Setup

If port 5432 is already in use, you can run a standalone container on a different port:

```bash
docker run -d --name prode-db-local \
	-e POSTGRES_DB=prode \
	-e POSTGRES_USER=leniolabs \
	-e POSTGRES_PASSWORD=leniolabs \
	-p 5434:5432 postgres:15.1
```

Then update your `.env`:

```bash
DATABASE_URL=postgresql://leniolabs:leniolabs@localhost:5434/prode
```

## Reset Database (Clean Start)

If you need to wipe and recreate the database:

```bash
npx prisma migrate reset --force --skip-seed
npx prisma db seed
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
