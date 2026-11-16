# Devpost Submission: ModQueue: Daily Shift

## Project Title
**ModQueue: Daily Shift**

## Elevator Pitch (Tagline)
*"Papers, Please"* meets *Tinder* inside Reddit. You are an AutoMod rookie trying to survive a 60-second daily shift moderating satirical communities without causing a subreddit revolt!

---

## 💡 Inspiration
Every Redditor has had a post instantly removed by an AutoMod for a microscopic formatting error or witnessed moderators debating bizarre subreddit rules. 

When brainstorming for **Reddit's Game of the Day Hackathon 2026**, we asked: *Why are all daily games just word puzzles or trivia clones? What is the most uniquely Reddit experience in the world?*

The answer was immediate: **The Mod Queue**.

We wanted to turn the chaos of subreddit moderation into a fast-paced, tactile, hilarious daily micro-game where players step into the shoes of an unpaid moderator and try to keep order against spammers, crypto bots, and rule-breakers.

---

## 🎮 What It Does
*ModQueue: Daily Shift* delivers an addictive, 60-second daily habit directly inside interactive Reddit posts:

1. **The Morning Briefing**:
   - Every 24 hours (synchronized via UTC date), the entire world is assigned to moderate a new satirical subreddit (such as `r/AskGhosts`, `r/CatsWithMonocles`, `r/ExplainLikeImAlien`, or `r/MildlyRadioactive`).
   - The subreddit displays **3 Active AutoMod Rules** for the day (e.g., specific title bracket tags, minimum user account age or karma thresholds, and banned forbidden keywords).

2. **The 60-Second Card Swiping Queue**:
   - A queue of 15 user submissions slides onto the screen with author username, avatar, karma, account age, flair, title, and body snippet sampled dynamically from a huge dataset of **135+ handcrafted satirical cards across 5 distinct subreddits** (`r/AskGhosts`, `r/CatsWithMonocles`, `r/ExplainLikeImAlien`, `r/MildlyRadioactive`, and `r/TimeTravelerProblems`).
   - **Challenging "Tricky Scenarios"**: Includes deceptive mod traps that test players' sharp eye:
     - *The 1-Unit Cutoff*: Accounts at 99 days old (when 100 is required) or 249 Karma (when 250 is required).
     - *Innocent Idioms*: Harmless phrases like "no daylight between", "tree bark", or "hot dogs" that accidentally trigger strict AutoMod regex filters.
     - *The Mod Bait*: Veteran 18k karma users warning the subreddit about crypto spam (hitting ban on them causes an outrage strike!).
     - *Stealth Spammers*: Polite bots using proper tags but hiding negative karma and affiliate links in their bio.
   - Using single-thumb touch gestures (or keyboard hotkeys `A`, `D`, `W`):
     - 🟢 **Swipe Right / [D] (APPROVE)**: Post satisfies all 3 active subreddit rules.
     - 🔴 **Swipe Left / [A] (REMOVE)**: Post breaks at least one rule.
     - 🔨 **Swipe Up / [W] (BAN BOT)**: Instant ban hammer for negative karma spammers and crypto bots.

3. **Juicy Feedback & Combos**:
   - Dynamic rubber stamps (*APPROVED*, *REMOVED*, *BANNED*) rotate and fade with drag velocity.
   - Consecutive correct decisions build an escalating **Combo Multiplier** (1x, 2x, 3x, 4x) accompanied by rising pentatonic audio chimes.
   - 3 incorrect calls trigger a **Subreddit Revolt** warning!

4. **1-Click Reddit Comment Share Output**:
   - Players earn daily Mod Titles (from *Trainee on Probation* to *Grand Subreddit Overseer*).
   - Generates a Wordle-style spoiler emoji grid ready to copy and paste into Reddit comment threads:

```text
🛡️ ModQueue: Daily Shift (r/CatsWithMonocles)
📅 2026-11-14 | Rank: ⭐ Senior Subreddit Janitor
📊 Accuracy: 93% (14/15) | ⏱️ Time: 38s | 🔥 Streak: 6 Days

🟩🟩🟩🔨🟩🟥🟩🟩🟩🔨🟩🟩🟩🟩🟩

Played inside Reddit via Devvit
```

---

## 🛠️ How We Built It
We built *ModQueue: Daily Shift* using Reddit's modernized **Devvit Web** platform:

* **Frontend**: React 19, Tailwind CSS 4, and Vite bundled into Reddit Webview iframe containers (`splash.html` and `game.html`).
* **Mobile-First Gestures**: Built with Pointer Events and `touch-none` gesture locking to eliminate mobile scroll jitter and deliver silky 60fps Tinder-style card swipes.
* **Procedural Sound Engine**: Using the **Web Audio API**, all sound effects (stamp thuds, rejection buzzers, ban hammer thunder, and combo chimes) are synthesized procedurally in real-time. This requires **0 KB of external audio downloads**, guaranteeing zero latency on mobile cellular data.
* **Backend Server**: Serverless Node.js v22 runtime powered by **Hono** routing.
* **Storage**: Reddit's built-in **Redis** engine:
  - Daily leaderboards powered by Redis Sorted Sets (`redis.zAdd`, `redis.zRange`).
  - Persistent daily streak tracking and player history (`redis.get`, `redis.set`).
* **In-Feed Splash Integration**: Lightweight inline feed post that uses `@devvit/web/client`'s native `requestExpandedMode()` to transition smoothly from Reddit feed to full-screen arcade mode.

---

## 🏆 How It Hits the 4 Judging Pillars

| Judging Pillar | How ModQueue Excels |
| :--- | :--- |
| **1. Delightful UX** | Instant pickup-and-play. No tutorials needed—anyone understands swiping right/left/up within 3 seconds. Tactile stamps and procedural sound effects give immediate, juicy feedback. |
| **2. Polish** | Production-ready quality. Strict TypeScript (`0 errors`), ESLint (`0 errors`), 6/6 automated unit test coverage, and responsive layouts that fit all phone and desktop screen sizes with zero white bleed-through. |
| **3. "Reddit-y"** | 100% authentic Reddit humor. Built around Reddit lore (AutoMod, karma bots, power mods, flairs). Sparks hilarious debates in comment sections as players discuss the satirical posts. |
| **4. Recurring Content** | Deterministic UTC daily seed system gives all players globally the exact same daily shift. Streak counters, leaderboards, and spoiler-safe comment grids keep players coming back every morning. |

---

## 🚧 Challenges We Ran Into
1. **Mobile Webview Touch Interception**: Mobile browsers natively try to pull-to-refresh or page-scroll when swiping cards. We solved this using Pointer Capture with strict CSS touch locks so swipes remain smooth and tactile.
2. **Audio Reliability in Embedded Iframes**: Many mobile webviews block autoplay or lag when downloading external MP3s. We solved this by developing a procedural Web Audio API synthesizer that needs zero network bandwidth.
3. **Fair Daily Seed Generation**: Designing a deterministic UTC hashing algorithm that maps dates to curated subreddit rules and cards so all global players face identical daily puzzles.

---

## 🌟 Accomplishments That We're Proud Of
* **100% Original Concept**: Audited the entire Devvit catalog to ensure no clone exists—*ModQueue* is genuinely new.
* **Zero-Asset Dependency**: High-speed loading with sub-second Vite builds and zero heavy external media assets.
* **True Reddit-Native Integration**: Seamlessly leverages Devvit interactive posts, Redis storage, and comment sharing.

---

## 🔮 What's Next for ModQueue
* **Community-Created Subreddit Shifts**: Allowing subreddit moderators to submit their own real community rules and satirical submissions for community-specific weekend events.
* **Subreddit Flair Rewards**: Rewarding players with custom user flairs in participating subreddits when they hit 10-day or 30-day moderation streaks.
* **Mod Conference Chaos Mode**: A chaotic endless mode with multiple overlapping rules and faster queue conveyor speeds.

---

## 🏷️ Built With
`devvit`, `reddit-api`, `react`, `typescript`, `tailwind-css`, `vite`, `hono`, `redis`, `web-audio-api`
