# Parallax

> **Meet every version of your taste.** Parallax turns your past selves into a Qloo-grounded council that helps you decide what to watch, eat, buy, or do next.

## Judge quickstart

1. Install Node.js 20+ and run `npm install`.
2. Start the public-demo shell with `npm run dev`.
3. Open `http://localhost:3000` - no account or API key is required for the seeded persona.
4. Select `Campus-me`, `New-city-me`, or `Now-me` on the timeline.
5. Open **Era Grid**, choose 2016, 2019, or 2026, and tap at least four cultural signals.
6. Use **Meet 2019-me** to see how confirmed signals become a weighted, provenance-aware profile.
7. Check the API boundaries at `http://localhost:3000/api/health` and `http://localhost:3000/api/era-pool?year=2019&domain=Music`.
8. Open `/connect` to create a scoped MCP token and run the `tools/list` smoke test.

The current shell intentionally favors the judge path: it is fast, keyboard-accessible, and works from a clean browser before integrations are configured. With a Qloo key, Era Grid calls the hackathon Insights API; without one, it uses clearly labeled local demo pools.

## Live demo

The current public deployment is [`parallaxv1.vercel.app`](https://parallaxv1.vercel.app).

## Product direction

Parallax is built for the Qloo LLM Hackathon. It creates labeled taste eras from user-approved signals, then lets those selves debate real decisions. Qloo is the differentiator: its graph provides era pools, entity resolution, cross-domain gap filling, affinity scores, drift, and time-aware translation. The language model will eventually explain those grounded scores; it will not invent the evidence.

The Qloo adapter uses the hackathon contract: `X-Api-Key`, `GET /search`, `GET /entities`, and `GET /v2/insights`. It does not call the unsupported legacy `/recommendations` or `/recs` routes. Server-side responses are cached briefly to reduce repeat calls, and request failures are surfaced with a user-safe error.

Every self is an approximation built from the user's data. The agent proposes, the user decides, and Parallax never purchases or books anything automatically.

The working judge flow includes the Council Studio, transient Spotify/WhatsApp capture parsing, browser-only screenshot and EXIF photo review, drift comparison, time-aware translation fallback, outcome feedback, a Self Leaderboard, and a scoped MCP surface with `list_eras`, `get_era_profile`, `ask_past_self`, `convene_council`, `compare_eras`, and `recommend_for_all_selves`.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Production integrations are validated strictly when `NODE_ENV=production`. The no-login demo remains available while credentials are absent so the visual and interaction shell can be reviewed independently. The SQL migration in `db/migrations/001_initial.sql` contains the privacy-first schema; raw imports, screenshots, audio, and photos are not persisted.

## Checks

```bash
npm run typecheck
npm run lint
npm test
```

Or run all three with:

```bash
npm run check
```

## Structure

```text
src/app/                 Next.js App Router pages and API routes
src/components/          Client-side product surfaces
src/lib/env.ts           Typed runtime configuration and validation
src/lib/demo-data.ts     Seeded no-login judge persona
implementation.md        Ten-step build plan
context.md               Product and hackathon context
```

## Environment

Copy `.env.example` to `.env.local`. `QLOO_API_KEY`, `QLOO_BASE_URL`, `DATABASE_URL`, and `ANTHROPIC_API_KEY` are required for the production integration path. The health endpoint reports only whether each integration is configured; it never returns secret values.

## License

MIT. See [`LICENSE`](./LICENSE).
