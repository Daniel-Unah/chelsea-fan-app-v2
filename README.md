# Chelsea Fan

Mobile-first social app for experiencing live matches together. Chelsea FC is the first team. The data model and app structure stay team-agnostic.

This repository is at **Milestone 0: repository setup**. The four tabs are placeholders. There is no authentication, sports data, or match experience yet.

## Requirements

- Node.js 22.13 or newer
- npm 10
- Expo Go, or a simulator, for a device preview

## Setup

```bash
npm install
cp .env.example .env
npm start
```

On Windows, copy the example env file with `copy .env.example .env`.

Leave the Supabase values empty for now. The placeholder screens do not call Supabase. A real project is required starting in Milestone 1.

`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are the only variables the app may read. Sports provider keys and `SUPABASE_SERVICE_ROLE_KEY` stay on the server and must never be committed.

## Scripts

- `npm start` — Expo dev server
- `npm run web` — same server, opened in a browser
- `npm run android` / `npm run ios` — open a simulator
- `npm run typecheck` — TypeScript
- `npm run lint` — ESLint
- `npm run format` — Prettier

## Milestone 0 manual test

1. Run `npm start`.
2. Open the app in Expo Go, a simulator, or the browser.
3. Confirm four bottom tabs: Home, Matches, Community, Profile.
4. Open each tab and confirm it shows only its empty-state message.
5. Confirm the app opens when `.env` has no Supabase values.

## Deferred

Authentication, the database, sports data, match center, comments, realtime, predictions, and notifications.
