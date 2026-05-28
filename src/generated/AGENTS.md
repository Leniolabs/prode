# `src/generated/`: DO NOT EDIT BY HAND

This directory is the output target of `prisma generate`. Every file here is machine-generated and will be overwritten on the next `npx prisma generate` run. Do not edit any file in this directory directly: changes go in `prisma/schema.prisma`, not here.

## How to regenerate

```
npx prisma generate
```

This writes the Prisma 7 client to `src/generated/prisma/` as configured by `generator client { output = "../src/generated/prisma" }` in `schema.prisma`. This path is set during Migration C.

## Retention decision (Open Decision #13)

Whether this directory is committed to the repository or gitignored is unresolved. See Open Decision #13 in `PLAN.md`. Until that decision is made, the directory may or may not appear in version control. Do not add hand-written files here regardless of the outcome.
