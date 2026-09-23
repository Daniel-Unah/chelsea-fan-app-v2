# Chelsea Sports Social App

## Mobile-First Product & Development Specification

---

# 1. Product Vision

Build a mobile-first social sports application centered initially around Chelsea FC.

The long-term goal is to create a social platform where sports fans can experience live games together.

The application should combine:

* Live match data
* Real-time match events
* Fan reactions
* Comments
* Predictions
* Player ratings
* Leaderboards
* Profiles
* Notifications
* Gamification
* Team communities

Chelsea FC is the first team supported.

The architecture must be designed so that Chelsea is the first market, not the permanent architecture.

Eventually the same platform should support:

* Other Premier League clubs
* European clubs
* Other football leagues
* Potentially other sports

The core product idea is:

> Give fans a place to experience a live match together.

The sports data provider supplies the events.

The application creates the social experience around those events.

---

# 2. Product Philosophy

Do not build a generic football statistics application.

Do not build a clone of a traditional sports scoreboard.

The application should feel like a social network built specifically around live sports.

The primary product loop is:

BEFORE MATCH

Prediction
↓
Lineup discussion
↓
Polls
↓
Matchday conversation

DURING MATCH

Live event
↓
Fan reactions
↓
Comments
↓
Discussion
↓
More live events

AFTER MATCH

Player ratings
↓
Prediction results
↓
Points
↓
Leaderboard
↓
Post-match discussion
↓
Next match

The application should give users a reason to return every matchday.

---

# 3. Platform Strategy

This should be a MOBILE APPLICATION first.

Build for:

* iOS
* Android

Use one shared codebase.

Preferred stack:

* React Native
* Expo
* TypeScript
* Expo Router

The backend should remain independent of the mobile client.

Architecture:

Sports Data Provider
↓
Sports Data Service
↓
Backend
↓
PostgreSQL / Supabase
↓
Realtime Infrastructure
↓
React Native App

The mobile application must NOT directly consume the external sports API.

---

# 4. Technology Stack

## Mobile

* React Native
* Expo
* TypeScript
* Expo Router
* React Query / TanStack Query if appropriate
* NativeWind or another lightweight styling solution if appropriate
* React Native Reanimated where animations provide meaningful UX improvements

Do not add libraries simply because they are popular.

Every dependency should have a clear purpose.

---

# 5. Backend

Preferred initial backend:

* Supabase
* PostgreSQL
* Supabase Auth
* Supabase Realtime
* Edge/server functions where appropriate

If a separate backend service becomes necessary, introduce it deliberately.

Do not introduce microservices.

Do not introduce AWS infrastructure during the initial MVP unless there is a specific technical requirement.

The initial application should prioritize simplicity and maintainability.

---

# 6. Sports Data Provider

Use a commercial football data provider.

Candidates may include:

* Sportmonks
* API-Football
* football-data.org
* another appropriately licensed provider

The provider must support the competitions and live data required by the product.

Before commercial launch, verify licensing terms for:

* Commercial use
* Displaying live scores
* Displaying match events
* Storing data
* Redistributing data to users
* Caching
* Notifications

Never scrape sports websites for live data.

---

# 7. Sports Provider Abstraction

The application must not become dependent on a single sports API.

Create an abstraction such as:

SportsDataProvider

Responsibilities:

### Teams

* getTeam()
* getTeams()

### Competitions

* getCompetition()
* getCompetitions()
* getSeason()

### Players

* getPlayer()
* getTeamSquad()

### Matches

* getUpcomingMatches()
* getRecentMatches()
* getLiveMatches()
* getMatch()

### Match Events

* getMatchEvents()

### Statistics

* getMatchStatistics()
* getPlayerStatistics()

Provider-specific responses must be normalized into application-specific types.

Do not pass raw provider responses throughout the application.

---

# 8. Mobile App Navigation

Use bottom-tab navigation.

Initial tabs:

### Home

Personalized sports feed.

### Matches

Upcoming, live, and completed matches.

### Community

Fan discussions.

### Profile

User profile and statistics.

Potential future tabs:

* Discover
* Notifications
* Following

---

# 9. Home Screen

The Home screen should feel like the user's sports home.

## Live Match

If Chelsea is playing:

LIVE

Chelsea
2 - 1
Arsenal

67'

[Watch Live]

The live card should be visually prominent.

---

## Next Match

If Chelsea is not playing:

NEXT MATCH

Chelsea
vs
Arsenal

Saturday
3:00 PM

[Predict]

---

## Recent Results

Show recent Chelsea matches.

---

## Community Feed

Show activity such as:

"Daniel predicted Chelsea 2-1"

"Marcus rated Palmer 9/10"

"GOAL! Palmer 67'"

"Sarah reacted 😱 to Chelsea's goal"

The Home screen should not feel empty between matches.

---

# 10. Matches Screen

Organize matches into:

### Live

Currently live matches.

### Upcoming

Future matches.

### Results

Completed matches.

Filters:

* All
* Premier League
* Champions League
* FA Cup
* Carabao Cup

The filtering system must use competition IDs rather than hardcoded strings wherever possible.

---

# 11. Match Center

This is the most important screen in the application.

Example:

Chelsea 2
Arsenal 1

67'

LIVE

Premier League

---

## Match Header

Display:

* Home team
* Away team
* Logos
* Score
* Match status
* Current minute
* Competition
* Venue
* Kickoff time

---

## Match Timeline

Example:

67'

⚽ GOAL

Cole Palmer

Chelsea 2-1 Arsenal

❤️ 34
😂 8
😱 17

23 comments

---

62'

🟨 YELLOW CARD

Arsenal player

---

51'

🔄 SUBSTITUTION

Chelsea

---

Events should be interactive.

Tapping an event should reveal its discussion.

---

# 12. Event-Centered Social Experience

This is one of the core differentiators.

Every significant match event should become a social object.

For example:

Palmer scores.

The backend creates:

Match Event
↓
GOAL: Palmer
↓
Fans receive realtime update
↓
Fans react
↓
Fans comment
↓
Fans reply

Users should be able to discuss the exact event rather than only having one generic match chat.

This concept should influence the database, API, and UI architecture.

---

# 13. Match Discussion

Support:

### Match-level comments

Example:

"Need to control the midfield."

### Event-level comments

Example:

"PALMERRRRRR"

### Replies

Users can reply to comments.

### Reactions

Initially:

* ❤️
* 😂
* 😱
* 😡
* 👍

Users should be able to react to comments and/or events.

Prevent duplicate reactions from the same user.

---

# 14. Real-Time Architecture

Live sports are a core feature.

Architecture:

Sports Provider
↓
Live Match Worker
↓
Normalize Data
↓
Detect Changes
↓
Persist Database
↓
Supabase Realtime
↓
Mobile Clients

The mobile app should never be responsible for determining whether a goal occurred.

The backend is the source of truth.

---

# 15. Live Match Polling

Create a backend service responsible for live matches.

Responsibilities:

1. Find active matches
2. Poll the provider
3. Normalize response
4. Compare with stored state
5. Detect new events
6. Update score
7. Persist events
8. Broadcast updates

Do not continuously poll every football match.

Initially monitor only:

* Chelsea matches

Eventually monitor:

* Matches involving followed teams
* Popular matches
* Other supported competitions

Respect provider rate limits.

---

# 16. Event Deduplication

This is critical.

Every provider event should have an external ID.

Store:

external_event_id

Before inserting:

IF event exists
update if necessary
ELSE
insert event

Polling the same match multiple times must never create duplicate goals, cards, or substitutions.

Prediction scoring and other background jobs must also be idempotent.

---

# 17. Push Notifications

Push notifications are an important reason for the mobile application.

Initial notification types:

### Match starting

"Chelsea vs Arsenal starts in 15 minutes."

### Goal

"⚽ Palmer scores! Chelsea 2-1 Arsenal."

### Red card

"🟥 Arsenal receive a red card."

### Match finished

"Chelsea beat Arsenal 2-1."

### Prediction deadline

"Your Chelsea prediction locks in 30 minutes."

### Social

"Marcus replied to your comment."

"Sarah reacted to your comment."

### Prediction

"You earned 5 points."

Use Expo Notifications or an appropriate push infrastructure.

Push notifications should be generated server-side for sports events.

Do not rely on the app being open.

---

# 18. User Authentication

Support:

* Email/password
* Google authentication if straightforward

After signup:

Create a user profile.

Fields:

* Username
* Display name
* Avatar
* Favorite team
* Bio

Eventually:

* Favorite player
* Location
* Following

Do not collect unnecessary personal information.

---

# 19. Database Schema

The database should be team-agnostic.

## users

* id
* username
* display_name
* avatar_url
* bio
* favorite_team_id
* created_at
* updated_at

---

## teams

* id
* external_id
* name
* short_name
* slug
* logo_url
* country
* primary_color
* secondary_color
* created_at
* updated_at

Chelsea is one row.

---

## competitions

* id
* external_id
* name
* slug
* country
* logo_url
* created_at
* updated_at

---

## seasons

* id
* external_id
* competition_id
* name
* start_date
* end_date

---

## players

* id
* external_id
* name
* first_name
* last_name
* position
* nationality
* photo_url
* created_at
* updated_at

---

## team_players

* id
* team_id
* player_id
* season_id
* shirt_number
* position
* active

---

## matches

* id
* external_id
* competition_id
* season_id
* home_team_id
* away_team_id
* kickoff_time
* status
* home_score
* away_score
* venue
* referee
* created_at
* updated_at

---

## match_events

* id
* external_id
* match_id
* event_type
* minute
* extra_minute
* team_id
* player_id
* related_player_id
* description
* metadata
* created_at

Event types:

* goal
* own_goal
* penalty_goal
* missed_penalty
* yellow_card
* red_card
* substitution
* var
* kickoff
* halftime
* fulltime

---

# 20. Social Database

## comments

* id
* user_id
* match_id
* match_event_id
* parent_comment_id
* content
* created_at
* updated_at

match_event_id can be nullable.

This allows comments to belong to either:

* Entire match
* Specific event

---

## reactions

* id
* user_id
* comment_id
* match_event_id
* reaction_type
* created_at

Use database constraints to prevent invalid duplicate reactions.

---

## team_follows

* id
* user_id
* team_id
* created_at

---

## follows

* id
* follower_id
* following_id
* created_at

Implement later if not necessary for MVP.

---

# 21. Predictions

Predictions are a core engagement mechanic.

MVP prediction types:

### Match winner

Chelsea
Draw
Opponent

### Exact score

Chelsea __
Opponent __

### First goalscorer

Player selection.

Future:

* Man of the Match
* Total goals
* Both teams to score
* Cards
* Corners
* Specific player props

Do not implement all prediction types initially.

---

# 22. Prediction Database

## predictions

* id
* user_id
* match_id
* prediction_type
* prediction_value
* points
* locked_at
* created_at
* updated_at

Prediction values should be structured enough to support different prediction types.

Do not create a new database column for every prediction type.

---

# 23. Prediction Rules

Predictions lock at kickoff.

Before kickoff:

User can create or update prediction.

After kickoff:

Prediction becomes immutable.

The backend must enforce this.

Never rely on the mobile application to enforce prediction deadlines.

---

# 24. Prediction Scoring

Create a dedicated scoring service.

Initial scoring:

Correct winner:

3 points

Exact score:

5 points

Correct first goalscorer:

5 points

These values should be configurable.

After the match:

1. Retrieve final score
2. Retrieve relevant events
3. Determine correct answers
4. Calculate points
5. Update predictions
6. Update leaderboard

Running the scoring process twice must not award duplicate points.

---

# 25. Player Ratings

After full time, users can rate players.

Scale:

1-10

Example:

Cole Palmer
9.2

Caicedo
8.1

Enzo
7.8

Database:

## player_ratings

* id
* user_id
* match_id
* player_id
* rating
* created_at
* updated_at

Users can submit one rating per player per match.

Allow users to update their rating if desired.

---

# 26. Leaderboards

Create:

### Season leaderboard

Users ranked by prediction points.

### Global leaderboard

All-time prediction points.

Potential future:

### Team leaderboard

Chelsea supporters only.

Display:

* Rank
* Avatar
* Username
* Points
* Predictions
* Correct predictions
* Accuracy

Do not build complex ranking infrastructure.

PostgreSQL queries are sufficient initially.

---

# 27. User Profile

Profile should show:

* Avatar
* Username
* Favorite team
* Bio
* Prediction points
* Prediction accuracy
* Prediction history
* Player ratings
* Badges
* Streaks
* Recent activity

Example:

Daniel

Chelsea FC

1,284 points

72% prediction accuracy

🔥 6 match streak

🏆 Matchday Expert

---

# 28. Gamification

Implement after predictions and leaderboards work.

Initial badges:

### First Prediction

Made first prediction.

### Matchday Regular

Predicted 10 matches.

### Perfect Score

Correct exact score.

### Hot Streak

Five consecutive correct predictions.

### Top Fan

Reach a leaderboard threshold.

Create flexible:

badges

user_badges

Do not create dozens of badges initially.

---

# 29. Community Screen

Initial sections:

### Trending

Most active discussions.

### Matchday

Current match conversations.

### Chelsea

General Chelsea discussion.

### Transfers

Transfer discussions.

### Players

Player-related discussions.

Eventually:

* Groups
* Private communities
* Supporter clubs

---

# 30. Player Pages

Player page should display:

* Name
* Position
* Team
* Photo
* Statistics
* Fan rating
* Recent performances
* Recent discussions

Example:

Cole Palmer

Chelsea

Forward

Fan rating: 8.7

Recent matches:

Chelsea vs Arsenal
9.2

Chelsea vs Liverpool
8.4

---

# 31. Team Pages

Every team should eventually have:

### Overview

* Next match
* Recent results
* Form
* Latest discussions

### Matches

* Upcoming
* Results

### Squad

* Players

### Community

* Team discussions

Chelsea should use this system rather than having a special Chelsea-only page.

---

# 32. Chelsea Launch Configuration

Initial team:

Chelsea FC

Initial competitions:

* Premier League
* UEFA Champions League
* FA Cup
* Carabao Cup

Do not hardcode these throughout the application.

Use database IDs and relationships.

The app can default to Chelsea for launch.

The backend remains generic.

---

# 33. Mobile UX Principles

The app should be designed specifically for phones.

Important:

* Large tap targets
* Bottom navigation
* Gesture-friendly interactions
* Fast transitions
* Skeleton loading
* Pull-to-refresh where appropriate
* Native-feeling animations
* Clear hierarchy
* Minimal typing during live matches

The match center should be usable with one hand.

Users should be able to react to an event quickly.

---

# 34. Matchday UX

Prioritize the experience when a match is actually happening.

Before kickoff:

Show:

* Match countdown
* Predictions
* Starting lineup
* Polls
* Pre-match discussion

During match:

Show:

* Live score
* Current minute
* Timeline
* Events
* Reactions
* Comments
* Stats

After match:

Show:

* Final score
* Player ratings
* Prediction results
* Points earned
* Leaderboard changes
* Post-match discussion

---

# 35. Offline & Poor Connection Handling

Mobile users may have inconsistent connections.

Implement sensible behavior:

* Cache recent match data
* Show last known score
* Display loading states
* Display "Live data temporarily unavailable"
* Retry failed requests

Never show stale data as if it were confirmed live data.

If displaying cached information, indicate the last update where appropriate.

---

# 36. API Architecture

The mobile application should communicate with our backend.

Examples:

GET /teams

GET /teams/:teamId

GET /teams/:teamId/matches

GET /matches

GET /matches/:matchId

GET /matches/:matchId/events

GET /matches/:matchId/comments

POST /matches/:matchId/comments

POST /events/:eventId/reactions

POST /matches/:matchId/predictions

GET /leaderboard

GET /players/:playerId

GET /users/:userId

The exact API architecture can use Supabase directly where appropriate, but business logic must remain server-side.

---

# 37. Security

Implement:

* Supabase Row Level Security
* Server-side authorization
* Secure API keys
* Secure environment variables

Users must only be able to:

* Modify their own profile
* Delete their own comments
* Modify their predictions before kickoff
* Create their own ratings
* React as themselves

Never expose:

SUPABASE_SERVICE_ROLE_KEY

or sports provider API keys to the mobile app.

---

# 38. Moderation

Because this is a social application, implement basic moderation.

MVP:

* Report comment
* Delete own comment
* Block user
* Admin delete comment

Later:

* Automated moderation
* Spam detection
* Profanity filtering
* Moderator dashboard

Do not build a complex moderation system before there is a community to moderate.

---

# 39. Analytics

Track:

### Acquisition

* account_created

### Engagement

* match_viewed
* prediction_created
* comment_created
* reaction_created
* player_rating_created

### Retention

* app_opened
* returning_user
* matchday_return

### Social

* comment_created
* reply_created
* reaction_created

### Sports

* live_match_viewed
* match_event_viewed
* match_shared

Important metrics:

* Registered users
* DAU
* MAU
* Users per match
* Predictions per match
* Comments per match
* Reactions per match
* Player ratings per match
* Matchday retention

The most important early metric:

> Do users return when Chelsea plays?

---

# 40. Sharing

Eventually allow users to share:

* Predictions
* Results
* Player ratings
* Leaderboard position
* Badges

Example:

"Daniel predicted Chelsea 2-1 Arsenal"

Create visually appealing share cards.

Potential destinations:

* WhatsApp
* Instagram
* X
* iMessage
* Copy link

Do not prioritize this until the core product works.

---

# 41. Monetization

Do not build monetization during the initial MVP.

Potential future model:

## Free

* Live matches
* Community
* Predictions
* Player ratings
* Basic statistics

## Premium

Potentially $4.99/month:

* Advanced statistics
* Advanced prediction analytics
* Historical comparisons
* Private prediction leagues
* AI match analysis
* Custom profiles
* Exclusive badges/cards
* Ad-free experience

Other possibilities:

* Advertising
* Affiliate partnerships
* Sponsored content
* Premium supporter communities

Validate engagement before building payments.

---

# 42. App Architecture

Recommended structure:

app/
(tabs)/
index.tsx
matches.tsx
community.tsx
profile.tsx

```
matches/
    [matchId].tsx

teams/
    [teamId].tsx

players/
    [playerId].tsx

auth/
    login.tsx
    signup.tsx
```

components/
match/
team/
player/
community/
prediction/
profile/
ui/

lib/
supabase/
sports/
realtime/
notifications/
analytics/

services/
matches/
teams/
players/
predictions/
community/

hooks/
useMatch.ts
useLiveMatch.ts
usePredictions.ts
useComments.ts

types/
sports.ts
social.ts
predictions.ts
users.ts

supabase/
migrations/

Keep UI components separate from business logic.

---

# 43. State Management

Do not introduce global state for everything.

Use:

### Server state

TanStack Query or equivalent for:

* Matches
* Teams
* Players
* Comments
* Predictions

### Local state

React state for:

* Modal visibility
* Form state
* Temporary UI state

### Realtime state

Realtime subscriptions should update/invalidate server state appropriately.

Avoid maintaining duplicate copies of match data across unrelated stores.

---

# 44. Caching

Sports data should be cached.

Do not make unnecessary external API requests.

Cache:

* Teams
* Players
* Competitions
* Historical matches
* Upcoming matches

Live matches require more frequent updates.

Only aggressively poll active matches.

---

# 45. Background Jobs

Create scheduled jobs for:

### Daily

* Teams
* Players
* Competitions
* Fixtures

### Matchday

* Live scores
* Events
* Match status

### Post-match

* Final statistics
* Player statistics
* Prediction scoring

Jobs should be idempotent.

---

# 46. Error Handling

Handle:

### Sports provider failure

"Live match data temporarily unavailable."

### Rate limit

Use caching/backoff.

### Postponed match

"POSTPONED"

### Cancelled match

"CANCELLED"

### Missing player

Display event without player information.

### Missing logo

Use fallback.

### Realtime disconnect

Automatically attempt reconnection.

---

# 47. Testing

Critical tests:

## Prediction

* Correct winner
* Incorrect winner
* Exact score
* Incorrect score
* Correct first scorer
* Incorrect first scorer
* Prediction before kickoff
* Prediction after kickoff
* Re-running scoring

## Sports normalization

* Goals
* Cards
* Substitutions
* Match status
* Teams
* Players

## Social

* Create comment
* Reply
* Reaction
* Duplicate reaction prevention
* Delete own comment
* Unauthorized comment deletion

## Realtime

* New event appears
* Score update appears
* Duplicate event ignored

---

# 48. Environment Variables

Use:

EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY

Server-side only:

SPORTS_API_KEY
SPORTS_API_BASE_URL
SUPABASE_SERVICE_ROLE_KEY

Create:

.env.example

Never commit secrets.

---

# 49. Milestone 0: Repository Setup

Goal:

Create the new mobile application.

Tasks:

* Initialize Expo
* TypeScript
* Expo Router
* Configure styling
* Configure Supabase
* Configure environment variables
* Configure linting
* Configure formatting
* Configure folder structure
* Create bottom navigation
* Create placeholder screens
* Create README

Screens:

Home
Matches
Community
Profile

Do not build sports functionality yet.

---

# 50. Milestone 1: Supabase & Authentication

Goal:

Users can create accounts.

Tasks:

* Configure Supabase
* Create users/profile table
* Sign up
* Login
* Logout
* Session persistence
* Protected screens
* Profile creation
* Row Level Security

Success criteria:

A user can install/open the app, create an account, close it, reopen it, and remain authenticated.

---

# 51. Milestone 2: Sports Data Provider

Goal:

Retrieve real Chelsea data.

Tasks:

* Select provider
* Implement provider abstraction
* Implement API client
* Retrieve Chelsea
* Retrieve competitions
* Retrieve squad
* Retrieve fixtures
* Retrieve match details
* Retrieve match events
* Normalize provider responses

Create a temporary development screen to inspect returned data.

Success criteria:

The app can retrieve real Chelsea data without exposing provider credentials to the mobile client.

---

# 52. Milestone 3: Database Sync

Goal:

Persist sports data.

Implement:

* Teams
* Competitions
* Seasons
* Players
* Team players
* Matches
* Match events

Implement upsert logic.

Success criteria:

The application can load Chelsea matches from our database.

The sports API is no longer required for every frontend request.

---

# 53. Milestone 4: Home & Matches

Goal:

Create the core navigation experience.

Home:

* Next match
* Recent results
* Live match card
* Basic community activity

Matches:

* Live
* Upcoming
* Results
* Competition filters

Make this polished and mobile-first.

---

# 54. Milestone 5: Match Center

Goal:

Build the core product screen.

Implement:

* Match header
* Score
* Status
* Timeline
* Goals
* Cards
* Substitutions
* Lineups if supported
* Basic match statistics

This screen should be the primary development focus.

Success criteria:

A user can open Chelsea's match and understand exactly what is happening.

---

# 55. Milestone 6: Social Match Experience

Goal:

Turn the match center into a social experience.

Implement:

* Match comments
* Event comments
* Replies
* Reactions
* Basic moderation

Important UX:

Goal happens.

↓

Event appears.

↓

Fans react.

↓

Fans comment.

↓

Fans reply.

Success criteria:

A match feels like a live social conversation.

---

# 56. Milestone 7: Realtime

Goal:

Remove the need for manual refreshing.

Implement:

* Live polling worker
* Event detection
* Event deduplication
* Database updates
* Supabase Realtime
* Client subscriptions

Test during an actual football match.

Measure:

Provider → backend latency

Backend → database latency

Database → app latency

Total event-to-screen latency

---

# 57. Milestone 8: Predictions

Goal:

Create the first major engagement mechanic.

Implement:

* Winner prediction
* Exact score
* First goalscorer
* Prediction deadline
* Prediction locking
* Scoring
* Prediction history

Success criteria:

A user can make a prediction before kickoff and automatically receive points afterward.

---

# 58. Milestone 9: Player Ratings

Goal:

Create post-match engagement.

Implement:

* Player rating screen
* 1-10 ratings
* One rating per player/match
* Aggregate rating
* Match player ratings

Success criteria:

Users continue interacting after the final whistle.

---

# 59. Milestone 10: Leaderboards

Goal:

Create recurring competition.

Implement:

* Season leaderboard
* Global leaderboard
* Prediction accuracy
* Ranking
* User statistics

Success criteria:

Users have a reason to keep predicting future matches.

---

# 60. Milestone 11: Notifications

Implement:

* Match reminders
* Kickoff
* Goals
* Red cards
* Full time
* Prediction deadline
* Comment replies
* Reactions
* Prediction results

Allow users to control notification preferences.

---

# 61. Milestone 12: Profiles & Gamification

Implement:

* Prediction history
* Statistics
* Badges
* Streaks
* Recent activity
* Favorite team
* Favorite player

Keep it simple.

---

# 62. Milestone 13: Polish

Before expanding to other teams:

Improve:

* Animations
* Loading states
* Empty states
* Error states
* Accessibility
* Performance
* Mobile UX
* Pull-to-refresh
* Offline handling
* Deep linking
* Share previews

Add analytics.

---

# 63. Milestone 14: Chelsea Beta

Launch to a small group of Chelsea supporters.

Do not immediately expand to every club.

Measure:

* Registrations
* DAU
* MAU
* Match views
* Predictions
* Comments
* Reactions
* Player ratings
* Returning users
* Matchday retention

Primary question:

> Do Chelsea fans actually return to the app when Chelsea plays?

---

# 64. Expansion Strategy

Only expand after the Chelsea experience is working.

Phase 1:

Chelsea

↓

Phase 2:

One additional major Premier League club

↓

Phase 3:

Premier League

↓

Phase 4:

Major European clubs

↓

Phase 5:

Additional leagues

↓

Phase 6:

Other sports

The underlying data model should already support this.

---

# 65. Architecture Rule

Never create Chelsea-specific business logic.

Bad:

ChelseaMatchService
ChelseaComments
ChelseaPredictions

Good:

MatchService
Comments
Predictions

with:

team_id
match_id
competition_id

Chelsea is the initial dataset.

It is not the architecture.

---

# 66. Cursor Development Rules

Cursor must follow these rules:

1. Do not implement multiple milestones at once.
2. Do not skip milestones.
3. Before coding, inspect the repository.
4. Explain major architectural decisions before implementing them.
5. Do not silently introduce major dependencies.
6. Keep the application team-agnostic.
7. Keep business logic separate from UI.
8. Do not expose secrets.
9. Do not call the sports provider directly from the mobile application.
10. Use strict TypeScript.
11. Avoid `any`.
12. Write tests for critical business logic.
13. Use database migrations.
14. Do not overengineer for hypothetical scale.
15. Keep the app deployable after every milestone.
16. Do not build post-MVP features before MVP features are complete.
17. If a requirement is ambiguous, explain the ambiguity and propose options before implementing.
18. Reuse code where appropriate, but do not create unnecessary abstractions.
19. Optimize for maintainability and readability.
20. Do not blindly follow generated code. Explain what was generated and why.

After completing every milestone, report:

### What changed

List major functionality.

### Files changed

List important files.

### Architecture

Explain important decisions.

### Testing

Explain how the milestone was tested.

### Manual testing

Give exact steps to test it.

### Known limitations

List anything intentionally deferred.

### Next milestone

State what should be built next.

Then STOP.

Do not automatically begin the next milestone.

---

# 67. First Cursor Prompt

The first prompt sent to Cursor should effectively be:

"Read the complete product specification in this repository.

Do not start building the product yet.

First inspect the repository and my development environment.

Determine:

1. Current Node version
2. Expo version
3. React Native version
4. TypeScript version
5. Existing dependencies
6. Recommended project structure
7. Supabase architecture
8. Sports provider abstraction
9. Authentication architecture
10. Realtime architecture
11. Push notification architecture
12. Database schema
13. Required environment variables
14. Testing strategy

Then provide an implementation plan for Milestone 0.

Do not write significant application code until I approve the proposed architecture."

---

# 68. Definition of Done

A milestone is complete only when:

* TypeScript passes
* Lint passes
* Tests pass where applicable
* Database migrations work
* Authentication/security is correct
* Loading states exist
* Error states exist
* Mobile layouts work
* No secrets are committed
* README is updated
* Manual testing instructions are provided
* Application remains runnable

---

# 69. Long-Term Product Principle

Do not lose sight of what the application is trying to become.

This is not:

"Another Chelsea scores app."

It is:

> A place where Chelsea fans experience matches together.

The live match is the trigger.

The community is the product.

The predictions and ratings create engagement.

The leaderboard creates competition.

The notifications bring users back.

Chelsea is the first community.

The platform eventually becomes a broader sports social network.
