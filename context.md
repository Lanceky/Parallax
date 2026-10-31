# Parallax — context.md

> Working name: **Parallax**. Meet every version of your taste. Build your past selves in minutes (tap, drop, snap, or speak), then put them in a room together to help you decide what to watch, eat, buy, or do next. Every self is grounded in Qloo's taste graph.

**Hackathon:** Qloo LLM Hackathon (Devpost). Finalists present live Nov 5, 2026.
**Rule that drives every decision:** if it works the same without Qloo, it's the wrong project. Qloo is the reasoning core: era data, gap-filling, scoring, and drift.

---

## 1. The idea in one breath

You are not one taste profile. You are a sequence of them. Parallax builds a **cast of selves** from data you already have, with almost no typing: any age (9, 14, 19, 27), any life chapter (first apartment, new city, lockdown, parent era), any role (work-me, Sunday-me, 3am-me) and even speculative ones (you at 40, the version of you who grew up elsewhere), plus a **Now-self**. Then it lets them **debate your decisions** with Qloo-backed arguments. "Would 2019-me approve of this?" becomes a real conversation, and the council's verdict is a better, more self-aware decision.

### Pitch (verbatim for Devpost)
**Open (15s):** "Agents are culturally blind. Worse, they think you're one person. You're not. You're who you were at nine, in your first apartment, in a new city, on a Sunday morning, and today. We built all of them."
**Close (15s):** "Your taste is the part of you every agent needs to know, and it has a history."
**If asked "is this consciousness?":** "No. It's your measurable cultural identity across time. Approximate, labeled, and yours to correct."

**Language rules:** never say consciousness, clone, or digital copy in UI or copy. Say: past selves, taste eras, council. Every Then-self is labeled *an approximation built from your data*. The agent proposes, the user decides, nothing is sent or bought.
**Eligibility:** 18+ only (a "16-year-old self" is an adult's memory, not a minor user).

---

## 1b. Kinds of selves (diverse by design)

An **era is not just a pair of years.** Every self is a *slice* of the user's data along one axis. Four axes, one engine:

| Axis | What defines the slice | Example selves | How the data is sliced |
|---|---|---|---|
| **Age / life stage** | age range (user enters birth year once; UI shows age and year side by side) | Childhood (6–10), Pre-teen (11–13), Teen (14–17), Campus (18–22), First job (22–26), Late 20s, 30s, Parent era, Empty-nest era | by date |
| **Life event** | before/after an anchor event the user names | First apartment, Moved cities, Study abroad, Lockdown 2020, New job, Wedding year, Backpacking year, Gym era, Gaming era | by date range around the event; GPS shifts and activity spikes suggest events |
| **Context / role** | recurring situation, not a period | Work-me (weekday 9–5), Weekend-me, Sunday-morning-me, 3am-me, Commute-me, Budget-me, Treat-yourself-me | by **time-of-day and day-of-week** on dated exports (Spotify, YouTube, Netflix, chats), or by user tags |
| **Speculative** | projected or hypothetical, always labeled | You at +5 / +10 / +25 yrs, Aspirational-you ("who I want to be"), Counterfactual-you ("grew up in Lisbon / Seoul / Lagos") | Qloo drift extrapolation; for counterfactuals, shift the profile along a different city's cultural graph |

**Add-a-self flow (Timeline Studio):** an **"+ Add self"** button opens a picker with four tabs matching the axes. Each tab offers preset chips plus "Custom," and every preset can be renamed ("Campus era" → "Chuka days"). The app also **suggests selves automatically** from the data: big taste-drift spikes, long activity gaps, location moves seen in photo GPS, and clear time-of-day clusters ("Your 1–4am listening is very different. Add a '3am-me'?").

**Limits and defaults:**
- Table size cap of **6 selves** per council (more is noise); the user chooses who sits.
- Childhood and pre-1995 eras have thinner Qloo coverage: the Era Grid uses release-year metadata and curated seed pools, adds domain tabs for **Cartoons & kids TV, Games, Snacks & drinks, School-era songs**, and shows lower confidence.
- Speculative selves are visibly marked (dashed orb) and never presented as fact.
- The user must be 18+; a "child self" is an adult's memory, not a minor user.

---

## 2. The five capture mechanisms (all required, one hub)

All five feed one **Timeline Studio** and one merge engine. Any single one produces a usable twin. Each added source visibly upgrades the timeline.

### 2.1 Era Grid: tap what was "you" (the zero-upload default)
**What:** pick a year; the app shows what was culturally big that year; the user taps what was "me."
**UI:**
- A horizontal **year scrubber** (e.g. 2005 → today) with big tick marks. User taps a year or drags a range to create an era ("2018–2020: High school").
- A full-screen **card grid** by domain tabs (Music · Film/TV · Food · Brands/Fashion · Games · Places). Each card has artwork, title, and three gestures: tap = "that was me", long-press/swipe = "hated it", skip = ignore.
- A **live meter** at the top: "Taste signal 62%" fills as taps accumulate. At ~8–10 taps a "Meet 2019-you" button lights up.
- After each tap the grid **reshuffles toward neighbors** (Qloo similarity), so later cards are more relevant. Satisfying and fast.
**Data:** era candidate pools come from Qloo popularity and metadata filtered to the era (verify time/year filter support in Qloo docs; fallback: filter by release year or precomputed era seed pools stored in `seed/era_pools/`).
**Confidence tag:** `tapped` (high) vs `inferred` (medium).

### 2.2 Dated export auto-slicer: one upload, many eras
**What:** one export becomes several eras automatically.
**Supported sources (verify exact export formats at build time):**
- WhatsApp `.txt` / `.zip`; Telegram `result.json`; Instagram data download (messages/likes JSON)
- **Spotify Extended Streaming History** (`Streaming_History_Audio_*.json`: timestamp, track, artist, ms_played)
- **Google Takeout**: YouTube watch history, Search/Maps activity
- **Netflix** `ViewingActivity.csv` (title, start time)
**UI:**
- A big **drop zone** that auto-detects the source ("Looks like Spotify history. 41,203 plays, 2016–2026").
- Instantly renders an **activity histogram by year** across the top of the Timeline Studio. Bars are volume per year.
- **Drag handles on the histogram** let the user cut and merge eras ("2017–2019 = Campus era"). Auto-suggested era cuts at big changes in taste (a drift spike) with a one-tap "accept."
- A progress rail: *Reading → Slicing by date → Extracting → Matching to Qloo*, with a live counter of entities found.
**Rule:** only the user's own lines (chat) or own activity are used. Raw content is discarded after extraction.

### 2.3 Screenshot drop: Wrapped, Replays, playlists, shelves
**What:** drag in screenshots of Spotify Wrapped, Apple Music Replay, YouTube Recap, Goodreads shelves, an old playlist, Letterboxd, Steam library.
**UI:**
- A **multi-image drop zone** with thumbnails. A vision model reads each.
- Each screenshot appears as a **card with extracted chips** ("Burna Boy · Wizkid · Tems") and a **year field** pre-filled from the image ("Wrapped 2019") or asked with a one-tap year picker.
- Chips are **tappable**: tap to remove a wrong read, tap + to add. Confirm → the card flies onto the right era on the timeline.
**Fallback:** if the model can't read the year, ask. Never guess silently.

### 2.4 Camera roll by year (on-device)
**What:** photos reveal places, food, and vibes, bucketed by when they were taken. No typing.
**How (feasible in a web demo):**
- User selects a folder or multi-selects photos (`<input type=file multiple accept="image/*">`, `webkitdirectory` where supported). **Everything runs in the browser.**
- Read **EXIF date** (year bucket) and **GPS** (if present) with `exifr`.
- GPS → reverse geocode (cache, coarse precision) → venue/place → Qloo place search.
- A small client-side vision model (transformers.js, CLIP-style zero-shot) labels the **cuisine/scene/vibe** per photo ("ramen", "beach", "live concert", "streetwear").
- **Only extracted labels and place names leave the device. Photos never upload.**
**UI:**
- A **privacy banner**: "Photos stay on your device. Only labels like 'ramen · Lisbon' are used."
- A **scan progress ring** and a live **mosaic** that sorts into year columns as photos are read.
- A review screen of detected places/foods per era with checkboxes ("Include / Skip"). Nothing is used without review.
**Honest limit:** many photos lack GPS; label-only signals are lower confidence. Flag as `inferred`.

### 2.5 Anchor memories: quick cards, typed or spoken
**What:** three fast prompts per era turn into seeds.
**UI:**
- A **"Time capsule" card** per era with three fields: *Where did you live? · What did weekends look like? · One song on repeat?*
- A **mic button** (browser speech recognition) so users can talk instead of type; live transcript fills the fields.
- Free-text answers are parsed by an LLM into entities and constraints (city, hangouts, songs, foods) and resolved through Qloo. Each answer shows resulting chips for confirmation.

### 2.6 The Capture Hub (one intuitive surface)
**Timeline Studio** is the home screen of the app:
- Top: the **timeline** (year scrubber + activity histogram) with era blocks, each with an **avatar orb** and a **completeness ring** (0–100%).
- Below the selected era: **five tiles**: Tap the Grid · Drop an export · Drop screenshots · Scan photos · Tell a memory. Each shows its estimated time ("1 min") and what it adds.
- Every completed action **animates onto the timeline** and bumps the ring. A **"Meet this self"** button appears at 40%+.
- A **provenance legend**: ● from your data, ◐ from screenshots/photos, ○ inferred by Qloo.

### 2.7 Merge engine
Per entity, combine sources into one weight:
`weight = sentiment × source_trust × recency_in_era × log(1+mentions)`
`source_trust`: dated export 1.0 > screenshot 0.85 > tap 0.8 > photo label 0.6 > anchor text 0.7 > Qloo-inferred 0.4.
Conflicts (loved in one source, hated in another) are surfaced to the user as a one-tap "Which is true?" card.

---

## 3. The Council: how the selves talk and help decide

### 3.1 Cast
- **Then-selves** (1 to 4 eras) + **Now-self**. Optional **Future-self** (projects drift forward; clearly labeled speculative).
- Each self has: era profile (weighted entities), constraints, **voice** (from dated messages' style stats when available; otherwise era-appropriate tone chips the user picks: "dramatic · sarcastic · earnest"), and an avatar/orb color.

### 3.2 Decision modes (the user picks one)
1. **Choose between options:** user enters 2–5 options (or lets Qloo generate candidates): where to eat, what to watch, which jacket, which city for a trip.
2. **"Would past-me approve?":** one option, every self rates it.
3. **Find what all of me would love:** Qloo generates candidates that maximize the *minimum* affinity across selves (the "everybody wins" pick).
4. **Letter from the past:** a Then-self writes a short note on the topic, in voice, with entities it'd bring up.
5. **Pick your table:** the user chooses which selves attend (max 6). The app suggests seats by decision type: food → Childhood-me, Campus-me, Treat-yourself-me; travel → Backpacking-me, Counterfactual-me; big purchase → Budget-me, Future-me; a night out → Weekend-me, 3am-me, Now-me.

### 3.3 Council flow (what the UI streams)
1. **Frame:** user states the decision. The agent extracts options, location, and constraints.
2. **Score:** for each option × self, compute **affinity** using Qloo (entity-to-profile similarity from that era's weighted entities). Returns score + top contributing entities.
3. **Opening statements:** each self argues in voice, citing its entities as chips ("2019-me: it has the same energy as *Burna Boy* and *Narcos*, yes").
4. **Rebuttals:** one round where selves respond to each other, driven by disagreements in scores (the biggest gap triggers a debate).
5. **Mediator (Now-self):** synthesizes: **verdict**, **who voted for what**, **regret risk** ("2022-you would've hated this; 2019-you would love it"), and a **compromise pick** if the vote splits.
6. **Approve:** user accepts, dismisses, or asks "why?" on any chip. Nothing is booked.

### 3.4 UI
- A **round-table view**: orbs arranged in a circle, the speaking self glows, speech bubbles stream with **Qloo entity chips**.
- A **vote strip** under each option: one dot per self, color-coded (love / meh / no).
- A **"Drift view"**: slider across eras showing how taste shifted (what you kept, dropped, picked up). Powered by Qloo similarity between era profiles.
- **Replay mode:** user can re-run the council with one self muted ("what if I ignore 2019-me?").

### 3.5 Prompt sketch (council agent)
```
You are {self.label}, an approximation of the user at {era}, built from their data.
You speak in this voice: {self.voice}.
You may only reference entities in your profile: {self.top_entities}.
Qloo affinity for each option is given; do not contradict the scores, explain them.
Argue for the option your scores favor. If another self disagrees, respond to their strongest point.
Never claim to be the real person. Keep each turn under 60 words. Cite entities by name.
```
Guardrails: scores come from Qloo, text comes from the LLM. The LLM never invents entities outside the profile or Qloo results.

---

### 3.6 Make the debate the product (this is where the value is)

The Council is not a feature of the profile builder; the profile builder exists to feed the Council. Design it as the thing people open the app to do.

**Decisions with real stakes** (lead with these in the UI and the demo):
- Purchases: a jacket, headphones, furniture, a gadget
- Travel: destination, neighborhood, hotel vibe
- Nights out and events: where to go, what to spend
- Gifts, subscriptions, "treat myself vs save" dilemmas

**Stakes inputs** (asked up front, optional): price of each option, budget, reversibility (returnable? refundable?), how often it will be used. Stakes change the debate: Budget-me gets louder as price rises, and Future-me gets louder on durable purchases.

**Debate rules (so it is a real debate, not theater):**
1. Every self must state a position, concede one point to another self, and name the strongest counter-argument.
2. Max two rounds. If all selves already agree, short-circuit with "Unanimous" instead of inventing conflict.
3. Arguments must cite profile entities; scores come from Qloo, words from the LLM; the mediator must cite the scores.
4. The mediator reports: **verdict**, **dissent** (who disagreed and why), **regret forecast** (which self is most likely to regret it, and why), and a **cheaper/safer alternative** if stakes are high.

**Outcome loop (the part that makes it compound):**
- After the event or purchase, one tap: *Loved it / Fine / Regret*. Offer it as a notification or a prompt the next time the user opens the app.
- Update a **trust weight per self, per domain** (e.g. Beta(α, β) updated on whether that self's vote matched the outcome).
- Show a **Self Leaderboard**: "Your 22-year-old self is right about food 7 of 10 times. Sunday-me is right about purchases." Verdicts increasingly weight the selves who have been right.
- This gives you a measurable hit rate versus the LLM-only baseline, which becomes a headline number in the demo and the Devpost write-up.

**Shareable verdict card:** an image/link with the question, the votes, one quote per self, and the verdict. It is the viral surface and a good screenshot for the submission.

**Actions are links, not purchases:** the agent proposes; the user clicks out to buy or book. No auto-purchase, ever.

### 3.7 Business case (use for "Potential Impact")

- **Consumer:** free tier with a few councils per month and up to 3 selves; Pro unlocks all five capture methods, unlimited selves and councils, the outcome loop, and MCP access.
- **Affiliate and referral:** decisions that end in a purchase or booking link earn referral revenue.
- **B2B "Ask my selves" widget and API:** retailers, travel, and restaurant sites embed the council on a product or listing page ("Would the different versions of you buy this?"), priced per decision call. The pitch to merchants is fewer regretted purchases and returns, and higher conversion. Only user-approved, scoped taste data is shared.
- **Why Qloo is the moat:** the taste graph supplies era data, cross-domain inference and affinity scoring; without it the selves are generic roleplay. Parallax in turn produces consented, structured taste history, which is the kind of data Qloo's own customers want.
- **Metrics to show (measure them, don't invent them):** decision confidence before and after the council, regret rate from the outcome loop, council hit rate versus the LLM-only baseline, share rate of verdict cards.

---

### 3.8 Timeline traversal (how selves travel)

The selves live on a **Timeline Map**, a transit-style graph:
- **Trunk line:** the lived timeline, left to right, ending at Now. Age and life-event selves sit on it as stations.
- **Parallel lanes** under the trunk: context selves (Work-me, Weekend-me, 3am-me) running alongside it.
- **Forward branches** (dashed): Future selves.
- **Side branches** (dashed): counterfactual forks ("grew up in Lisbon", "took the other job").

**Traversal moves** (each is a gesture plus a Qloo call):
1. **Summon:** drag a self's orb to the Council table; it animates along its track and takes a seat.
2. **Translate across time (the core trick):** every self has a **knowledge horizon** (the end of its era) and cannot know anything newer. When an option arrives, Qloo finds the closest entities that existed by that horizon, and the self judges the option through them: "To 2012-me this is basically *X* and *Y*, so yes." Shown as chips with a **Translated** badge and a before → after line. This is what makes the selves feel like they come from different times instead of being the same voice in costumes.
3. **Carry forward:** pick a past favorite and translate it to today ("what would 2012-me's favorite band be streaming now?"), using Qloo similarity restricted to current entities.
4. **Fork:** at any station tap **"What if…"** and name the change (different city, different path). The app copies the era profile and applies a delta (shift signals toward a target place's taste graph, or add/remove entities the user names). The branch is labeled speculative and can sit at the table.
5. **Fast-forward:** from Now, extend the drift trend N years. The Future self's horizon is N years ahead, using Qloo trend/popularity signals, labeled speculative.
6. **Message across time:** selves leave short notes for each other ("From 2012-me to Now-me"), rendered in voice and pinned on the map.
7. **(P2) Back-test:** rerun a past decision with only the selves that existed then, and check whether the council would have predicted what the user chose.

**Council hook:** before scoring, each self runs *translate* on every option, so every debate line starts from that self's own world. This is the demo moment: scrub the timeline, orbs fly to the table, and one says "to me this is basically…".

**Implementation notes:** build the map with React Flow (or SVG + Framer Motion); cache translations; if Qloo can't filter by year, fall back to release-year metadata, and if that is missing, mark the translation low confidence.

---

## 4. Qloo integration

> **Verify every endpoint, parameter, and entity-type name in Qloo's hackathon developer guide before coding. Names below are placeholders.** Keep all Qloo calls in one module (`packages/qloo`).

Env: `QLOO_API_KEY=`, `QLOO_BASE_URL=`

Where Qloo is essential (put this list in the Devpost description):
1. **Era seed pools:** culturally popular entities for a given year per domain (the Era Grid).
2. **Entity resolution:** every export line, screenshot chip, photo place, and spoken memory is resolved to a Qloo entity ID.
3. **Gap-filling:** cross-domain inference turns a few taps into a fuller era profile (music taps → likely films, food, brands), tagged `inferred`.
4. **Affinity scoring:** score any option against any era profile for council votes.
5. **Candidate generation:** "what would all my selves love?" via recommendations seeded by multiple profiles with a min-affinity objective.
6. **Drift measurement:** similarity between era profiles to power the Drift view and auto era-cut suggestions.
7. **Era translation:** nearest-in-taste entities that existed by a self's knowledge horizon (and the reverse, carrying past favorites to today), powering the Timeline Map traversal.

LLM-only baseline toggle: same decision, same inputs, no Qloo. Show side by side ("Council with Qloo" vs "plain LLM roleplay") to prove the grounding.

Wrapper functions: `searchEntities`, `getRecommendations`, `getEntityDetails`, `eraPool(year, domain)`, `affinity(profile, entity)`, `similarity(profileA, profileB)`, `maxMinCandidates(profiles[], type, location)`. Cache everything; precompute persona data.

---

## 5. MCP (a feature, not the pitch)

**Parallax MCP server** at `https://<domain>/mcp` (Streamable HTTP), Bearer token from the Connect page, scoped and revocable.

| Tool | Purpose |
|---|---|
| `list_eras` | the user's eras with completeness |
| `get_era_profile` | top entities for an era (scope-filtered) |
| `ask_past_self` | one self's reaction to an option (score + voice line + why) |
| `convene_council` | full council on a decision; returns verdict and votes |
| `compare_eras` | drift summary between two eras |
| `recommend_for_all_selves` | max-min candidate picks |

**Connect page:** create token, copy-paste configs (Claude Desktop / Claude Code `claude mcp add --transport http ...` / Cursor), curl `tools/list` smoke test, live "try it" panel, activity log, revoke. Document in `docs/MCP.md`.
**Consumed MCP/APIs (P2):** places MCP for real venues near the user; calendar free/busy to propose a slot.

---

## 6. Architecture and stack

```
Web (Next.js, TS, Tailwind, Framer Motion)
  Timeline Studio · Era Grid · Import hub · Screenshot cards · Photo scanner (in-browser) · Time capsule · Council · Drift
        │
API (Node/TS) ── Import pipeline ── Qloo module ── Council agent (LLM tool loop) ── MCP server
        │
Postgres (+pgvector)  ·  Object storage only for transient uploads (auto-deleted)
```
- LLM: Claude via Anthropic API (extraction, vision for screenshots, council text). Adapter-based.
- In-browser: `exifr` (EXIF), transformers.js (CLIP-style labels), Web Speech API (voice memories).
- Hosting: Vercel (web) + Render/Fly (API/MCP). Public and live. Personas work without login.
- License: MIT, shown in the repo About section.

---

## 7. Data model (Postgres)

```sql
create table users (id uuid primary key default gen_random_uuid(), email text unique, display_name text, over_18 boolean not null default false, created_at timestamptz default now());

create table eras (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  label text, kind text default 'age',        -- age | event | context | speculative
  start_year int, end_year int, age_start int, age_end int,
  anchor_event text,                          -- e.g. "Moved cities"
  slice_rule jsonb,                           -- e.g. {"hours":[1,4]} or {"weekday":[6,7]} for context selves
  knowledge_horizon_year int,                 -- the self cannot know entities newer than this
  parent_era_id uuid references eras(id),     -- set for forks and future branches
  fork_delta jsonb,                           -- {"add":[...],"remove":[...],"shift_to":"Lisbon"}
  is_speculative boolean default false, is_now boolean default false,
  voice jsonb,                 -- tone chips + style stats (no raw text)
  completeness real default 0, color text, created_at timestamptz default now()
);

create table era_entities (
  id uuid primary key default gen_random_uuid(),
  era_id uuid references eras(id) on delete cascade,
  qloo_entity_id text not null, qloo_type text, name text,
  sentiment smallint,          -- -2..2
  weight real, provenance text, -- export | screenshot | tap | photo | anchor | inferred
  source_ref uuid, scope text default 'private'
);
create index on era_entities (era_id, qloo_type);

create table anchors (id uuid primary key default gen_random_uuid(), era_id uuid references eras(id) on delete cascade, prompt text, answer_parsed jsonb);

create table sources (id uuid primary key default gen_random_uuid(), user_id uuid, kind text, status text, entity_count int, year_min int, year_max int, created_at timestamptz default now());

create table councils (id uuid primary key default gen_random_uuid(), user_id uuid, question text, mode text, options jsonb, scores jsonb, transcript jsonb, verdict jsonb, qloo_enabled boolean default true, created_at timestamptz default now());

create table consent_log (id bigserial primary key, user_id uuid, action text, detail jsonb, at timestamptz default now());

alter table councils add column stakes jsonb;      -- {price, budget, reversible, frequency}
create table translations (
  qloo_entity_id text, target_year int, direction text,   -- 'to_past' | 'to_present'
  results jsonb, confidence real,
  primary key (qloo_entity_id, target_year, direction)
);
create table decision_outcomes (
  id uuid primary key default gen_random_uuid(),
  council_id uuid references councils(id) on delete cascade,
  chosen_option text, outcome smallint,             -- 2 loved, 1 fine, -1 regret
  asked_at timestamptz, answered_at timestamptz
);
create table self_trust (
  era_id uuid references eras(id) on delete cascade,
  domain text, alpha real default 1, beta real default 1,   -- Beta posterior of "this self was right"
  primary key (era_id, domain)
);
create table mcp_tokens (id uuid primary key default gen_random_uuid(), user_id uuid, token_hash text, scope text, allowed_tools text[], label text, last_used_at timestamptz, revoked_at timestamptz, created_at timestamptz default now());
```

---

## 8. Import details (parsers)

All importers output `{timestamp, author?, text|title, source}`, then bucket by year into the user's eras.
- **WhatsApp:** handle `[12/03/2025, 14:22:10] Name: msg` and `12/03/25, 14:22 - Name: msg`; multi-line continuation; skip system/media lines; "Which one is you?" picker; keep only that author.
- **Telegram:** `messages[]`, flatten `text` arrays, filter by `from`.
- **Spotify:** group plays by year, weight by `ms_played` (ignore plays under ~30s), top artists/tracks per era.
- **Netflix:** group `Title` by year (strip season/episode suffixes before matching).
- **YouTube/Takeout:** titles → channels/topics, bucket by `time`.
- **Instagram:** per-source parse; keep only the user's own content.
- **Extraction LLM output:** `{mentions:[{surface,type_hint,sentiment,year}], constraints:[], style:{}}`; paraphrased evidence only; no secrets, health, relationships, or third-party details.
- **Resolution:** Qloo entity search with threshold; unresolved items are dropped or shown for manual fix, never guessed.

---

## 9. Privacy and trust (built for real)

- Raw text, screenshots, and audio are processed transiently and discarded; only entities, sentiments, and style stats persist.
- **Photos never leave the device.** Only user-approved labels and place names are sent.
- Drop other people's lines in chats; no contact names stored.
- Scopes (`private|trusted|public`) on entities; MCP tokens inherit scope.
- **"What my selves know"** page: edit or delete any entity, mute an era, wipe everything in one tap.
- Envelope encryption of stored profile fields; consent log; no content analytics.
- Every Then-self is labeled an approximation; user can correct a self ("I never liked that") and the council re-runs.

---

## 10. Screens

1. **Landing:** hook line, "Try a demo persona" and "Meet your past selves."
2. **Timeline Studio** (home): timeline, era orbs, five capture tiles, provenance legend, and a toggle to the **Timeline Map** (trunk, lanes, forks, future branches; orbs travel to the council table).
3. **Era Grid:** year scrubber + swipe/tap card grid + live signal meter.
4. **Import drop zone:** auto-detect, histogram, draggable era cuts, progress rail.
5. **Screenshot cards:** thumbnails + editable chips + year picker.
6. **Photo scanner:** privacy banner, scan ring, year-column mosaic, review checklist.
7. **Time capsule:** three prompts per era with mic.
8. **Meet a self:** profile card with top entities, voice chips, correction buttons.
9. **Council:** round table, vote strips, verdict card, LLM-only toggle, replay-with-mute.
10. **Drift view:** era slider showing kept/dropped/new taste.
11. **Connect (MCP)** and **What my selves know**.

Ship **3 synthetic personas** with pre-built eras (different decades, cities, tastes) so judges can use everything with zero setup.

---

## 11. Build plan (check the Devpost deadline now; cut scope to fit)

| Phase | Deliverable | Done when |
|---|---|---|
| 1 | Repo, DB, auth, Qloo wrapper, era pool endpoint | Era Grid shows real Qloo cards for a chosen year |
| 2 | **Era Grid + merge engine + Meet a self** | 10 taps produce a labeled era profile with inferred gaps |
| 3 | **Council** (score, statements, rebuttal, verdict, vote strips, LLM-only toggle) | council runs on a persona decision end to end |
| 4 | Dated export slicer (WhatsApp + Spotify first) + histogram + era cuts | one upload creates 3 eras |
| 5 | Screenshot drop + Time capsule (typed first, mic after) | chips confirm and land on the timeline |
| 6 | Photo scanner (EXIF + GPS first, CLIP labels second) | photos bucket into years in-browser |
| 7 | Drift view + MCP server + Connect page | curl `tools/list` works on the deployed URL |
| 8 | Netflix/YouTube/Telegram parsers, polish, personas, deploy, README, LICENSE | fresh-browser judge quickstart passes |

**Cut order if short:** Telegram/Netflix/YouTube parsers → mic input → CLIP labels (keep EXIF/GPS) → Instagram → Drift view animation → Future-self. **Never cut:** Era Grid, Council, era translation, LLM-only toggle, personas, live deploy. Cut forks, fast-forward, notes across time and back-test before translation.

---

## 12. Demo script (90s)

1. **Hook (20s):** judge picks a year; the Era Grid appears; they tap 8 things. "Meet 2019-you" lights up.
2. **Build (20s):** drop a Spotify export on the timeline; histogram appears; two more eras materialize. Quick flash of the photo mosaic sorting into year columns.
3. **Centerpiece (35s):** judge asks, "Where should I take someone for dinner Friday?" Make it a money decision (a $180 jacket or a weekend trip): Budget-me, Campus-me and Now-me argue with Qloo chips; vote strips split; a regret forecast appears; the mediator picks a compromise; a shareable verdict card is generated. Flash the Self Leaderboard ("Campus-me is right about fashion 8 of 10 times"). Toggle LLM-only to show the generic version.
4. **Close (15s):** "Your taste has a history. Every agent should know it." Show the MCP connect page in one beat.

---

## 13. Submission checklist

- [ ] Live public demo (personas work without login)
- [ ] Public repo with all source and run instructions
- [ ] MIT license file visible in About
- [ ] Description: what it does, the seven Qloo roles (section 4), MCP access
- [ ] Hosted externally; tested from a clean browser
- [ ] README top section: 60-second judge quickstart (persona → Era Grid → Council → Connect)

## 14. Risks

- **Qloo year/era filters** may not exist as such: fall back to release-year metadata and precomputed era pools; confirm early.
- **Export formats change:** keep parsers defensive, ship sample files in `/seed`.
- **Photo scanning in-browser** can be slow: cap batch size, show progress, make it optional.
- **Overclaiming:** label every self an approximation, show provenance on every entity.
- **Impersonation worries:** selves only talk to their owner; no messaging real people as a past self.
- **Context selves depend on timestamps:** time-of-day slicing only works on sources with precise times (Spotify, YouTube, Netflix, chats). Hide that tab when no such source is imported.
- **Too many selves:** cap the table at 6 and default to 3–4 suggested seats so the council stays readable.
- **Open items:** deadline, exact Qloo endpoints, vision-model choice for screenshots.