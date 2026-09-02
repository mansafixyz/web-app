# MansaFi

The web app for MansaFi: private-by-default banking on Robinhood Chain, for people and for the AI agents that spend on their behalf.

This repository holds the marketing site and the authenticated product that sits behind it. Full product documentation lives at [docs.mansafi.xyz](https://docs.mansafi.xyz/), so this README sticks to the app itself, how it is put together and how to run it locally.

## Stack

- Next.js 16 with the App Router and React 19
- TypeScript throughout
- Tailwind CSS v4 for styling, with a small set of shadcn primitives
- Supabase for authentication, Postgres and row level security
