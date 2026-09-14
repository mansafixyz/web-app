# MansaFi

The web app for MansaFi: private-by-default banking on Robinhood Chain, for people and for the AI agents that spend on their behalf.

This repository holds the marketing site and the authenticated product that sits behind it. Full product documentation lives at [docs.mansafi.xyz](https://docs.mansafi.xyz/), so this README sticks to the app itself, how it is put together and how to run it locally.

## Stack

- Next.js 16 with the App Router and React 19
- TypeScript throughout
- Tailwind CSS v4 for styling, with a small set of shadcn primitives
- Supabase for authentication, Postgres and row level security

## Getting started

You need Node 20 or newer and a Supabase project.

```bash
npm install
npm run dev
```

The app runs on http://localhost:3000.

Before it will do anything useful, create a `.env.local` with these three values:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key, safe to expose to the browser |
| `NEXT_PUBLIC_DEPOSIT_ADDRESS` | Address shown on the wallet top up screen |

Database migrations live outside this folder in `supabase/migrations`. Apply those before signing in, otherwise the app will authenticate fine but every query will come back empty.

## Scripts

- `npm run dev` starts the development server
- `npm run build` produces a production build
- `npm run start` serves that build
- `npm run lint` runs ESLint
