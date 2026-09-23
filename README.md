# Chelsea Fan

Mobile-first social app for experiencing live matches together. Chelsea FC is the first team. The data model and app structure stay team-agnostic.

This repository is at **Milestone 6: match discussion**. Accounts use email and password. Home shows Chelsea’s live match, next fixture, recent results, and an empty community section. Matches lists live, upcoming, and finished games with a competition filter. Opening a match shows the score, status, stored timeline, comments, replies, and reactions. New comments and score changes appear on an open match without refreshing. A temporary screen can sync the stored season.

## Requirements

- Node.js 22.13 or newer
- npm 10
- Expo Go, or a simulator, for a device preview
- A Supabase project with the profiles and sports migrations applied

## Setup

```bash
npm install
cp .env.example .env
npm start
```

On Windows, copy the example env file with `copy .env.example .env`.

Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`, then restart Expo. Use the project URL and the publishable key. Sports provider keys and `SUPABASE_SERVICE_ROLE_KEY` stay on the server and must never be committed.

Apply `supabase/migrations/20260923020000_create_profiles.sql`, `supabase/migrations/20260923200000_create_sports_tables.sql`, `supabase/migrations/20260923201537_create_social_tables.sql`, and `supabase/migrations/20260923202320_publish_match_realtime.sql` before creating an account. For an immediate session after signup, turn off email confirmation in the Supabase dashboard under Authentication, Providers, Email.

`sports-sync` saves matches on the server. It loads the public-domain Premier League season file from [openfootball](https://github.com/openfootball/england). Set `SPORTS_API_KEY` as an Edge Function secret, using a token from [football-data.org](https://www.football-data.org/client/register), and redeploy `sports-sync` to sync from that provider instead. Do not put that token in `.env` with an `EXPO_PUBLIC_` prefix.

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

## Milestone 4 manual test

1. Log in and open Home.
2. Confirm the next Chelsea fixture, recent results, and an empty live and community state when nothing is live or posted.
3. Open Matches. Switch between Live, Upcoming, and Results, and filter by competition.
4. Confirm the lists come from the database and the app does not call a sports provider.

## Milestone 5 manual test

1. Log in and open Home or Matches.
2. Open a finished Chelsea match. Confirm the teams, score, and full-time status.
3. Open an upcoming match. Confirm the kickoff is shown and the score is blank.
4. Confirm goals, cards, substitutions, lineups, and statistics stay empty when nothing is stored, and the app does not call a sports provider.

## Milestone 6 manual test

1. Log in and open a match.
2. Post a comment, reply to it, and add a heart, laugh, or shock reaction.
3. Delete your own comment and confirm the reply goes with it.
4. Report or block is available on someone else’s comment. Lineups, statistics, and the timeline stay empty until events are stored.
5. Leave the match open. A new comment or score saved in the database shows up without pulling to refresh.

## Deferred

Favorite team, avatar upload, Google sign-in, realtime updates, predictions, and notifications. Match events, lineups, and statistics stay empty until a football-data.org sync is configured.
