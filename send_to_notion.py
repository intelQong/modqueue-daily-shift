import os
import sys
import json
import time
import re
import requests

NOTION_TOKEN = os.environ.get("NOTION_TOKEN")
if not NOTION_TOKEN:
    print("Error: NOTION_TOKEN environment variable not set.")
    sys.exit(1)
HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

def create_rich_text(text: str, link: str = None) -> list:
    """Create a list of Notion rich text objects from a string, truncating at 1900 chars if needed."""
    if not text:
        return []
    
    chunks = [text[i:i+1900] for i in range(0, len(text), 1900)]
    rich_text = []
    for chunk in chunks:
        obj = {
            "type": "text",
            "text": {
                "content": chunk
            }
        }
        if link:
            obj["text"]["link"] = {"url": link}
        rich_text.append(obj)
    return rich_text

def parse_markdown_to_blocks(md_text: str) -> list:
    lines = md_text.splitlines()
    blocks = []
    i = 0
    in_code_block = False
    code_lang = "plain text"
    code_lines = []

    while i < len(lines):
        line = lines[i]

        # Handle fenced code blocks
        if line.strip().startswith("```"):
            if not in_code_block:
                in_code_block = True
                lang = line.strip()[3:].strip().lower()
                # Map to standard Notion languages
                known_langs = ["typescript", "javascript", "python", "json", "html", "css", "bash", "markdown", "text"]
                code_lang = lang if lang in known_langs else "plain text"
                if code_lang == "text":
                    code_lang = "plain text"
                code_lines = []
            else:
                in_code_block = False
                code_text = "\n".join(code_lines)
                blocks.append({
                    "type": "code",
                    "code": {
                        "rich_text": create_rich_text(code_text[:1900]),
                        "language": code_lang
                    }
                })
            i += 1
            continue

        if in_code_block:
            code_lines.append(line)
            i += 1
            continue

        stripped = line.strip()

        # Skip empty lines
        if not stripped:
            i += 1
            continue

        # Dividers
        if stripped in ["---", "***", "___"]:
            blocks.append({"type": "divider", "divider": {}})
            i += 1
            continue

        # LaTeX block equation ($$...$$)
        if stripped.startswith("$$") and stripped.endswith("$$") and len(stripped) > 4:
            eq = stripped[2:-2].strip()
            blocks.append({
                "type": "equation",
                "equation": {"expression": eq}
            })
            i += 1
            continue

        # Blockquote / Callout
        if stripped.startswith("> "):
            callout_text = stripped[2:].strip()
            blocks.append({
                "type": "callout",
                "callout": {
                    "rich_text": create_rich_text(callout_text),
                    "icon": {"type": "emoji", "emoji": "💡"}
                }
            })
            i += 1
            continue

        # Headings
        if stripped.startswith("# "):
            blocks.append({
                "type": "heading_1",
                "heading_1": {"rich_text": create_rich_text(stripped[2:].strip())}
            })
            i += 1
            continue

        if stripped.startswith("## "):
            blocks.append({
                "type": "heading_2",
                "heading_2": {"rich_text": create_rich_text(stripped[3:].strip())}
            })
            i += 1
            continue

        if stripped.startswith("### "):
            blocks.append({
                "type": "heading_3",
                "heading_3": {"rich_text": create_rich_text(stripped[4:].strip())}
            })
            i += 1
            continue

        # Bullet list items
        if stripped.startswith("* ") or stripped.startswith("- "):
            blocks.append({
                "type": "bulleted_list_item",
                "bulleted_list_item": {"rich_text": create_rich_text(stripped[2:].strip())}
            })
            i += 1
            continue

        # Numbered list items
        match_num = re.match(r"^(\d+)[\.\)]\s+(.*)$", stripped)
        if match_num:
            blocks.append({
                "type": "numbered_list_item",
                "numbered_list_item": {"rich_text": create_rich_text(match_num.group(2))}
            })
            i += 1
            continue

        # Standard Paragraph
        blocks.append({
            "type": "paragraph",
            "paragraph": {"rich_text": create_rich_text(stripped)}
        })
        i += 1

    return blocks

def main():
    print("Reading project submission files...")
    submission_path = "/home/ubuntu/reddit-hackathon/DEVPOST_SUBMISSION.md"
    
    with open(submission_path, "r", encoding="utf-8") as f:
        devpost_content = f.read()

    # Create a comprehensive Notion document covering all required Devpost sections & project links
    full_md = f"""# 🛡️ ModQueue: Daily Shift — Hackathon Submission & Project Story

> **Project Tagline:** "Papers, Please" meets Tinder inside Reddit. You are an AutoMod rookie trying to survive a 60-second daily shift moderating satirical communities without causing a subreddit revolt!
> **Hackathon:** Reddit's Game of the Day Hackathon 2026 ($35,000 Prize Pool)
> **Developer:** u/LeftistDinosaur | Subreddit: r/ModQueueDaily

---

## 🔗 Submission Links & App Credentials

* **Live Reddit Playtest URL:** https://www.reddit.com/r/ModQueueDaily/?playtest=modqueue-daily-shift
* **Reddit Developer Portal App:** https://developers.reddit.com/apps/modqueue-daily-shift
* **Public GitHub Repository:** https://github.com/intelQong/modqueue-daily-shift
* **Test Subreddit:** r/ModQueueDaily
* **App Name:** modqueue-daily-shift

---

## Inspiration

Every Redditor has experienced that universal rite of passage: spending twenty minutes crafting a thoughtful post, only for it to be instantly vaporized within three milliseconds by an AutoMod regex for a microscopic bracket mistake like `[Question?]` instead of `[Question]`.

On the other side of the screen sit Reddit's volunteer moderators — the true custodians of the internet — triaging thousands of posts a day, squinting at user account ages, dodging crypto raid bots, and debating whether a post violates the sacred rules of their community.

When brainstorming for Reddit's Game of the Day Hackathon 2026, we asked ourselves:
> *"Why are all daily games just Wordle clones or trivia quizzes? What is an experience that could ONLY happen on Reddit?"*

The answer was immediate: The Mod Queue.

We set out to turn the comedic chaos, high stakes, and bizarre community cultures of Reddit into a fast-paced, tactile daily micro-game. We envisioned "Papers, Please" meets "Tinder" inside Reddit: an addictive daily shift where players step into the shoes of an AutoMod rookie trying to keep order across hilarious satirical subreddits without causing a community revolt.

---

## What it does

ModQueue: Daily Shift turns community moderation into a 60-second, single-thumb daily ritual embedded directly inside Reddit posts:

* **1. The Morning Briefing:** Every 24 hours (synchronized globally via UTC reset), every player in the world is assigned to moderate the exact same satirical subreddit (such as r/AskGhosts, r/CatsWithMonocles, r/ExplainLikeImAlien, r/MildlyRadioactive, or r/TimeTravelerProblems). The briefing presents 3 Active AutoMod Rules plus the universal Ban Hammer rule.
* **2. The 60-Second Swiping Queue:** A queue of 15 satirical user posts slides onto the screen with author username, avatar, karma, account age, flair, title, and body snippet.
* **Swipe Right / [D] (APPROVE):** Post satisfies all 3 active subreddit rules.
* **Swipe Left / [A] (REMOVE):** Post breaks at least one community rule.
* **Swipe Up / [W] (BAN BOT):** Slam the Ban Hammer on negative-karma spammers and crypto phishing bots.

### Deceptive Tricky Scenarios
* **The 1-Unit Cutoff:** Accounts at 99 days old (when 100 is required) or 249 Karma (when 250 is required).
* **The Regex Trap:** Innocent idioms like "no daylight between" or "hot dogs" that trigger strict forbidden-keyword filters (daylight, dog).
* **The Mod Bait:** An 18k karma veteran warning the sub about crypto scams (banning them causes a community outrage strike!).
* **The Stealth Spammer:** A polite bot wearing a tuxedo that hides negative karma (-95) and affiliate bio links.

### Scoring & Multiplier Mechanics
Scores reward both moderation accuracy and triage velocity with combo multipliers:

$$Score = (100 * N_correct) + max(0, (60 - T_elapsed) * 10) + sum(k * 25)$$

Where N_correct is in [0, 15], T_elapsed <= 60 seconds, and k runs across combo streaks.

### Dynamic Stamp Physics
Rubber stamps rotate and fade in real-time according to drag displacement:

$$theta_rotation = clamp(-18, 18, dx * 0.08)$$

$$alpha_approve = clamp(0, 1, dx / 80)$$

$$alpha_remove = clamp(0, 1, -dx / 80)$$

$$alpha_ban = clamp(0, 1, -dy / 70)$$

### 1-Click Reddit Comment Share Output
Players earn certified Mod Ranks and generate a Wordle-style spoiler emoji grid to copy directly into Reddit comment threads:

```text
🛡️ ModQueue: Daily Shift (r/CatsWithMonocles)
📅 2026-11-16 | Rank: ⭐ Senior Subreddit Janitor
📊 Accuracy: 93% (14/15) | ⏱️ Time: 38s | 🔥 Streak: 6 Days

🟩🟩🟩🔨🟩🟥🟩🟩🟩🔨🟩🟩🟩🟩🟩

*Played inside Reddit via Devvit*
```

---

## How we built it

We built ModQueue: Daily Shift using Reddit's modernized Devvit Web platform:

* **Frontend:** React 19, Tailwind CSS 4, and Vite bundled into optimized Reddit Webview iframe containers (splash.html and game.html). We used HTML5 Pointer Events (setPointerCapture) with strict touch locks (touch-action: manipulation) to ensure silky 60fps card swiping with zero mobile viewport jitter.
* **Backend Server:** Serverless Node.js v22 runtime powered by a high-performance Hono REST router handling shift initialization and decision verification.
* **Storage:** Reddit's built-in Redis engine powers daily streaks, player history, and sorted-set daily leaderboards (redis.zAdd, redis.zRange).
* **Content Catalog:** A massive dataset of 135+ handcrafted, satirical Reddit cards across 5 distinct subreddits (r/AskGhosts, r/CatsWithMonocles, r/ExplainLikeImAlien, r/MildlyRadioactive, and r/TimeTravelerProblems).

### Deterministic Daily Seeding (Mulberry32 PRNG)
To ensure every player worldwide receives the exact same daily shift, we hash the UTC date string into a 32-bit unsigned integer and drive a Mulberry32 Pseudo-Random Number Generator:

$$s_(n+1) = (s_n + 0x6D2B79F5) mod 2^32$$

This guarantees deterministic daily competition while allowing our Fisher-Yates sampling algorithm to draw balanced distributions of Compliant, Rule-Breaking, Bot, and Tricky cards.

### Zero-Asset Procedural Web Audio Engine
All sound effects are synthesized in real-time via the browser's Web Audio API using exponential pitch and gain decay curves (0 KB external downloads):

$$f(t) = f_base * e^(-lambda_f * t)$$

* **Approve Stamp:** Resonant low sine wave dropping 160 Hz -> 30 Hz.
* **Remove Rejection:** Dual dissonant sawtooth oscillators (150 Hz + 158 Hz) producing an 8 Hz acoustic beating effect.
* **Ban Hammer:** Heavy square wave bass transient (90 Hz -> 30 Hz) followed by a metallic anvil decay (2200 Hz).
* **Combo Chimes:** Equal-tempered pentatonic scale frequencies (C5, D5, E5, G5, A5, C6) filtered through a resonant bandpass (Q = 8).

---

## Challenges we ran into

1. **Mobile Webview Touch Hijacking & Pull-to-Refresh:** In early mobile testing, swiping cards frequently triggered the mobile browser's native pull-to-refresh or vertical page scroll, canceling the card drag mid-flight. We implemented HTML5 setPointerCapture(pointerId) combined with CSS touch-action: manipulation and -webkit-tap-highlight-color: transparent.
2. **Viewport Height Bleed-Through on Dynamic Mobile Screens:** On iOS Safari and Android Chrome, the dynamic URL bar caused the iframe canvas to stretch inconsistently, revealing an unsightly white rectangle at the bottom of the screen. We enforced background-color: #09090b and color-scheme: dark at the root levels with 100dvh (Dynamic Viewport Height).
3. **Audio Reliability in Sandboxed Iframes:** Many mobile webviews restrict audio autoplay or introduce 500ms+ latency when loading external MP3 audio clips over cellular data. We developed a procedural synthesizer using the browser's native AudioContext with 0 KB of external asset downloads.
4. **Designing Genuinely "Tricky" Moderation Scenarios:** Making the game too simple made it repetitive; making it too arbitrary made it frustrating. We designed 5 distinct categories of deceptive edge cases (1-day cutoffs, innocent idioms, plural tags, mod baits, and disguised bots).

---

## Accomplishments that we're proud of

* **100% Original Concept:** Audited the entire Devvit and Reddit app ecosystem to ensure ModQueue is an entirely new game genre on Reddit.
* **Massive Content Scale:** Crafted 135+ unique cards across 5 communities with rich satire, lore, and tricky edge cases.
* **Zero External Asset Latency:** 0 KB of audio downloads, 0 KB of image dependencies — instant sub-second load times worldwide.
* **Production Engineering Standards:** 100% TypeScript type safety (0 errors), ESLint compliance (0 errors), and 6/6 passing automated unit tests.

---

## What we learned

1. **Devvit Web is Reddit's Most Powerful Tool:** Moving from legacy Blocks to Devvit Web gave us full access to modern React 19, Tailwind CSS 4, and Web APIs, allowing us to build an experience that feels indistinguishable from a native mobile arcade game.
2. **Juiciness is Everything in Micro-Games:** Fast games live or die by feedback. Adding rubber stamp physics, velocity-linked opacity, and pentatonic audio chimes transformed a routine sorting mechanic into a deeply satisfying sensory loop.
3. **Shared Daily Seeds Drive Social Conversation:** Having every player tackle the exact same 15 cards every day creates natural watercooler discussion in Reddit comments, where players debate specific posts, laugh at the tricky traps, and compare Mod Ranks.

---

## What's next for ModQueue: Daily Shift

* **Community AutoMod Rule Importer:** Allow actual subreddit moderators to plug in their community's real rules and generate custom weekend shifts for their own members.
* **Exclusive Subreddit Flair Rewards:** Award players with verifiable user flairs in participating subreddits upon achieving 10-day moderation streaks.
* **Endless "Mod Conference" Chaos Mode:** An intense time-attack arcade mode where rules shift dynamically as the queue accelerates!

---

## 🏷️ Built With
devvit, reddit-api, react-19, typescript, tailwind-css-4, vite, hono, redis, web-audio-api, latex
"""

    blocks = parse_markdown_to_blocks(full_md)
    print(f"Total parsed Notion blocks: {len(blocks)}")

    first_batch = blocks[:80]
    remaining_batches = [blocks[i:i+80] for i in range(80, len(blocks), 80)]

    page_payload = {
        "parent": {"workspace": True},
        "icon": {"type": "emoji", "emoji": "🛡️"},
        "cover": {
            "type": "external",
            "external": {
                "url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"
            }
        },
        "properties": {
            "title": [
                {
                    "type": "text",
                    "text": {"content": "ModQueue: Daily Shift — Hackathon Submission & Project Story"}
                }
            ]
        },
        "children": first_batch
    }

    print("Creating Notion page in workspace...")
    res = requests.post("https://api.notion.com/v1/pages", headers=HEADERS, json=page_payload)
    if res.status_code not in [200, 201]:
        print(f"Failed to create Notion page: {res.status_code}")
        print(res.text)
        sys.exit(1)

    page_data = res.json()
    page_id = page_data["id"]
    page_url = page_data.get("url", f"https://notion.so/{page_id.replace('-', '')}")
    print(f"Successfully created Notion page! ID: {page_id}")
    print(f"Page URL: {page_url}")

    # Append remaining batches
    for idx, batch in enumerate(remaining_batches, start=1):
        print(f"Appending batch {idx}/{len(remaining_batches)} ({len(batch)} blocks)...")
        append_url = f"https://api.notion.com/v1/blocks/{page_id}/children"
        app_res = requests.patch(append_url, headers=HEADERS, json={"children": batch})
        if app_res.status_code not in [200, 201]:
            print(f"Warning: Failed to append batch {idx}: {app_res.status_code}")
            print(app_res.text)
        else:
            print(f"Batch {idx} appended successfully.")
        time.sleep(0.3)

    print("\n=======================================================")
    print("SUCCESS: ModQueue Submission & Story sent to Notion!")
    print(f"Page ID: {page_id}")
    print(f"Page URL: {page_url}")
    print("=======================================================")

if __name__ == "__main__":
    main()
