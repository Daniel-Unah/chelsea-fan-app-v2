# Chelsea Fan

Mobile-first social app for experiencing live matches together. Chelsea FC is the first team. The data model and app structure stay team-agnostic.

This repository is at **Milestone 1: authentication**. Accounts use email and password. Home, Matches, and Community are still placeholders.

## Requirements

- Node.js 22.13 or newer
- npm 10
- Expo Go, or a simulator, for a device preview
- A Supabase project with the profiles migration applied

## Setup

```bash
npm install
cp .env.example .env
npm start
```

On Windows, copy the example env file with `copy .env.example .env`.

Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`, then restart Expo. Use the project URL and the publishable key. Sports provider keys and `SUPABASE_SERVICE_ROLE_KEY` stay on the server and must never be committed.

Apply `supabase/migrations/20260923020000_create_profiles.sql` to that project before creating an account. For an immediate session after signup, turn off email confirmation in the Supabase dashboard under Authentication, Providers, Email.

## Scripts

- `npm start` — Expo dev server
- `npm run web` — same server, opened in a browser
- `npm run android` / `npm run ios` — open a simulator
- `npm run typecheck` — TypeScript
- `npm run lint` — ESLint
- `npm run format` — Prettier
- `npm test` — profile and account field checks

## Milestone 1 manual test

1. Run `npm start` with the Supabase URL and publishable key in `.env`.
2. Open the app. Confirm it asks you to log in before Home, Matches, Community, or Profile.
3. Create an account with an email, a password of at least 6 characters, a username, and a display name.
4. Confirm you land on Home and stay signed in after closing and reopening the app.
5. Open Profile, change the display name or bio, and save. Confirm the new values remain after a reload.
6. Log out. Confirm the app returns to the login screen and the tabs stay unavailable until you log in again.

## Deferred

Favorite team, avatar upload, Google sign-in, sports data, match center, comments, realtime, predictions, and notifications.
