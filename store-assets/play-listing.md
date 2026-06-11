# Play Console copy-paste sheet

## Store listing

**App name:** Winner Dinner

**Short description** (max 80 chars):
> Agree on dinner, finally. Vote on restaurants with friends and get a match.

**Full description:**
> Can't decide where to eat? Winner Dinner ends the group chat debate.
>
> Create a dinner party, invite your friends with a link, and build a list of
> restaurants together — type them in, browse what's nearby, or search by
> cuisine. Then everyone votes: yes, no, or super like.
>
> The moment everyone says yes to the same place, it's a match. Confetti,
> notifications, dinner solved.
>
> • Real-time voting with friends — everyone votes on their own phone
> • Find restaurants near you or search by cuisine
> • Push notifications when you match, when friends join, and when new
>   restaurants are added
> • Super likes to champion your favorites
> • No full match? See the best partial match, or narrow down and revote
>
> Free, no ads. Sign in with Google and start a party.

**App icon:** `store-assets/icon-512.png`
**Feature graphic:** `store-assets/feature-graphic.png`
**Screenshots:** take 2+ on your phone (home screen with parties, a voting
card, a match with confetti are the good ones)

**Category:** Food & Drink
**Tags:** restaurants, voting, friends
**Privacy policy URL:** https://samiprehn.github.io/winner_dinner/privacy.html
**Contact email:** sami.prehn@gmail.com

## Content rating questionnaire

Everything "No" (no violence, sexuality, profanity, drugs, gambling,
user-generated public content*, etc.). Result should be Everyone.

*Party content is only visible to invited members, so answer No to the
"users can interact / share content publicly" questions; there IS
communication between users (party names/restaurant lists are user-entered
and visible to the party) — if asked "does the app allow users to interact?"
answer Yes, with "shared content is only visible to invited group members."

## Data safety form

**Does your app collect or share user data?** Yes (collect), No (share)

| Data type | Collected? | Shared? | Processed ephemerally? | Required? | Purpose |
|---|---|---|---|---|---|
| Personal info → Name | Yes | No | No | Yes | App functionality (shown to your party) |
| Personal info → Email address | Yes | No | No | Yes | App functionality (account/sign-in) |
| Location → Approximate location | Yes | No | Yes | No (optional features) | App functionality (find nearby restaurants) |
| App activity → Other user-generated content | Yes | No | No | Yes | App functionality (party names, restaurants, votes) |
| Device IDs → (push token) | Yes | No | No | No | App functionality (notifications) |

**Is all collected data encrypted in transit?** Yes
**Can users request data deletion?** Yes — email sami.prehn@gmail.com
(per privacy policy; deletion within 30 days)

## App access (for reviewers)

> All features are available after signing in with any Google account.
> No special test credentials required.

## After first AAB upload — DON'T FORGET

Play Console → Setup → App signing → copy the **SHA-1** of the app signing
key → add it to Firebase console → Project settings → Android app →
Add fingerprint. Without this, Google sign-in fails for Play-installed
copies.
