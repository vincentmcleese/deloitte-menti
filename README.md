# Deloitte Menti

Real-time pain point prioritization tool. Participants distribute 100 points across 9 pain points via sliders. The presenter dashboard shows live-updating rankings.

## Setup

### 1. Supabase Database

Run the SQL in `supabase-migration.sql` in your [Supabase SQL Editor](https://supabase.com/dashboard) to create the required tables.

### 2. Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Run Locally

```bash
npm install
npm run dev
```

### 4. Deploy to Vercel

Push to GitHub and import into Vercel. Add the environment variables in the Vercel dashboard.

## Routes

- `/presenter` — Presenter dashboard (live results, session management, CSV export, history)
- `/join/[code]` — Participant voting page (mobile-optimized)
