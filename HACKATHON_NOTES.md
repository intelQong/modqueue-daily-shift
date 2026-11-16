# Reddit's Game of the Day Hackathon 2026: ModQueue: Daily Shift

## 1. Hackathon Snapshot
- **URL**: [redditgameofday2026.devpost.com](https://redditgameofday2026.devpost.com/)
- **Timeline**: November 11, 2026 – December 8, 2026
- **Prize Pool**: $35,000 USD
- **Pillars / Judging Rubric**:
  1. **Delightful UX** (Fast, tactile, intuitive, zero-learning curve)
  2. **Polish** (Juicy micro-interactions, sound/haptic FX, mobile responsive)
  3. **"Reddit-y"** (Community-centric, sparks hilarious comment threads, authentic Reddit culture)
  4. **Recurring Content** (Daily seed, global streaks, daily leaderboards)

---

## 2. Chosen Game Concept: 🛡️ *ModQueue: Daily Shift*
> **Tagline**: *"Papers, Please"* meets *Tinder* inside Reddit. You are a rookie AutoMod trying to survive your 60-second daily shift without getting quarantined.

### The Gameplay Loop (90 Seconds / Day)
1. **The Morning Briefing**:
   - Each calendar day (UTC reset), players are assigned to moderate a hilarious fictional subreddit (e.g. `r/AskGhosts`, `r/CatsWithMonocles`, `r/ExplainLikeImAlien`, `r/MildlyRadioactive`).
   - The subreddit displays **3 Active AutoMod Rules** for the day:
     - *Rule 1 (Title)*: e.g. "Titles must start with [Tag] (e.g. `[Serious]` or `[Question]`)"
     - *Rule 2 (User)*: e.g. "OP account age must be older than 30 days"
     - *Rule 3 (Content)*: e.g. "Zero mentions of banned word: 'banana'"
2. **The 60-Second Triage (Card Swiping)**:
   - A queue of 15 satirical user posts slides onto the screen as interactive cards showing:
     - User Avatar + Username + Account Age + Karma
     - Post Flair + Title + Text/Image snippet
   - **Player Controls**:
     - 🟢 **Swipe Right / [D] / Click 'Approve'**: Passes all 3 rules.
     - 🔴 **Swipe Left / [A] / Click 'Remove'**: Violates at least 1 rule.
     - 🔨 **Swipe Up / [W] / Click 'Ban Hammer'**: Spammers / zero-karma bot accounts.
3. **Scoring & Multipliers**:
   - Correct rapid decisions increase the **"Mod Combo"** multiplier (1x -> 2x -> 4x).
   - Speed bonus for clearing the queue quickly.
   - 3 wrongful decisions trigger a **"Subreddit Revolt"** warning!
4. **Post-Game Summary & Shareable Reddit Output**:
   - Performance tier: *Trainee Mod* -> *Junior Janitor* -> *Senior Mod* -> *Lead Custodian*.
   - 1-click button to copy spoiler-safe daily score for Reddit comments.

---

## 3. Shareable Reddit Comment Output
```text
🛡️ ModQueue: Shift #07 (r/CatsWithMonocles)
✅ Decisions: 14/15 Correct
🔨 Bots Banned: 2
⭐ Mod Efficiency: 96%
⏱️ Shift Time: 42s
🔥 Mod Streak: 5 Days (Senior Mod)
```

---

## 4. Technical Architecture (Devvit Web)
- **Framework**: Devvit Web (`@devvit/web`, `@devvit/start`)
- **Frontend**: React 19, Tailwind CSS 4, Vite, Lucide Icons, Canvas confetti/particles
- **Backend**: Hono + tRPC on Node.js v22 Devvit runtime
- **Storage**: Reddit Redis (`redis.zAdd`, `redis.hSet`) for:
  - Daily leaderboards (Top Mod Efficiency & Speed)
  - User streaks & historical stats
  - Subreddit aggregate stats (% of players who approved Post #4)
- **Views**:
  - `splash.html`: Lightweight inline view showing today's Subreddit assignment, personal streak, and a big "START SHIFT" button.
  - `game.html`: Expanded full-screen webview running the high-FPS swipe queue, audio effects, and post-game certificate.

---

## 5. Development Roadmap & Status Checklist
- [x] Hackathon registered & guidelines reviewed
- [x] Devvit CLI (`@devvit/cli`) & Node 22 verified
- [x] Official Devvit Web React template cloned and analyzed
- [x] Unique game concept locked: **ModQueue: Daily Shift**
- [x] Initialize project into root workspace (`/home/ubuntu/reddit-hackathon`)
- [x] Implement daily deterministic seed generator (UTC date -> Subreddit & 15 post cards)
- [x] Build card swipe engine (touch drag, keyboard hotkeys, stamp animations)
- [x] Sound/audio feedback system (synth stamps, buzzers, ban thuds using Web Audio API)
- [x] Build Reddit Redis backend (leaderboards, streaks, daily stats)
- [x] Connect Devvit Reddit identity & shareable comment clipboard generator
- [x] Full test, lint, and build verification passing with 0 errors
- [x] Connect Reddit Developer Account via `devvit login`
- [x] App registered on developer portal (`modqueue-daily-shift`)
- [x] Uploaded to App Directory & installed to `r/ModQueueDaily`
- [x] Live playtest session active on `r/ModQueueDaily`
- [x] Design overhaul based on mobile test: zero white bleed, glowing briefing pod, Reddit Snoo avatars
- [x] Tricky scenarios engine added (5/5 automated tests passing)
- [x] Devpost complete submission draft generated ([DEVPOST_SUBMISSION.md](file:///home/ubuntu/reddit-hackathon/DEVPOST_SUBMISSION.md))
- [ ] Record 1-2 min screen capture video
- [ ] Submit to [redditgameofday2026.devpost.com](https://redditgameofday2026.devpost.com/) before Dec 8, 2026
