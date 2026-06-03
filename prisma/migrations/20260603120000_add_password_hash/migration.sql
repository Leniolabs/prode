-- Migration K: add passwordHash column to ProdeRoom for bcrypt hashing
-- Lazy migration: existing rows keep plaintext password until they re-authenticate.
ALTER TABLE "ProdeRoom" ADD COLUMN "passwordHash" TEXT;
