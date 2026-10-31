# Parallax Implementation Plan

Build Parallax as a judge-ready, Qloo-powered web application before the November 5, 2026 finalist presentation. The critical path is the Qloo-grounded Council: the app must be useful because it understands a user's taste across time, not because it merely roleplays multiple voices.

## 1. Bootstrap the product shell

- Create the Next.js + TypeScript web app with Tailwind, Framer Motion, and a Node/TypeScript API boundary.
- Add strict environment validation for `QLOO_API_KEY`, `QLOO_BASE_URL`, database, and LLM credentials.
- Add the MIT `LICENSE`, README quickstart, formatting/linting, focused tests, and a clean demo route that works without login.
- Establish the visual language: dark timeline canvas, colored self orbs, provenance markers, confidence badges, and accessible keyboard controls.

## 2. Build and verify the Qloo adapter first

- Confirm endpoint names, entity types, filters, authentication, rate limits, and year/release metadata in the current Qloo developer guide.
- Keep every Qloo request in `packages/qloo` behind typed functions: entity search, details, recommendations, era pools, affinity, similarity, max-min candidates, and era translation.
- Normalize Qloo responses into internal types, cache repeatable calls, log request IDs and failures, and fail visibly when credentials or required data are unavailable.
- Add fixtures and contract tests so the UI can run deterministically while preserving a real-Qloo integration path.

## 3. Add persistence, privacy, and demo data

- Create Postgres migrations for users, eras, era entities, sources, anchors, councils, translations, outcomes, self trust, consent logs, and MCP tokens.
- Store only extracted entities, sentiments, weights, provenance, style statistics, and user-approved labels; discard raw exports, screenshots, audio, and photo files after processing.
- Enforce 18+ eligibility, private/trusted/public scopes, user-owned access, correction/deletion, and a “wipe everything” operation.
- Seed three synthetic personas with different decades, cities, and tastes so judges can enter the full experience without creating an account.

## 4. Implement Timeline Studio and the Era Grid

- Make Timeline Studio the home screen with a year scrubber, era blocks, completeness rings, activity histogram, provenance legend, and five capture tiles.
- Implement the Era Grid with Music, Film/TV, Food, Brands/Fashion, Games, and Places tabs.
- Load cards from Qloo era pools, support tap/love, hate, and skip actions, show confidence, and reshuffle toward Qloo neighbors after each signal.
- Enable “Meet this self” after enough signals and persist the selected era with its labeled, weighted entities.

## 5. Implement the merge engine and self profiles

- Convert every capture into a common signal format and calculate entity weights using sentiment, source trust, recency, and mention frequency.
- Merge duplicate Qloo entities, surface contradictory signals for confirmation, and tag every item as export, screenshot, tap, photo, anchor, or inferred.
- Use Qloo gap-filling only for explicitly inferred entities and display lower confidence for those results.
- Build the Meet a Self profile: label, date range, knowledge horizon, voice chips, top entities, completeness, corrections, and “approximation built from your data” disclosure.

## 6. Build the Qloo-grounded Council

- Support option comparison, “Would past-me approve?”, and “find what all my selves would love,” with optional price, budget, reversibility, and frequency inputs.
- Score every option against every selected self with Qloo affinity and retain the contributing entities and confidence.
- Stream two short debate rounds: opening statements, one concession, one strongest counterargument, and a Now-self mediator verdict.
- Show vote strips, dissent, regret forecast, compromise or cheaper alternative, entity chips, and an LLM-only toggle using the same inputs to demonstrate the Qloo difference.
- Constrain generated text to the self profile and Qloo results; never present a self as the real person and never make purchases or bookings.

## 7. Add the capture pipeline

- Implement Spotify Extended Streaming History and WhatsApp parsing first, including source detection, date bucketing, user-author selection, histogram generation, and suggested era cuts.
- Add typed time-capsule prompts that extract candidate places, foods, music, and constraints, then require user confirmation before Qloo resolution.
- Add screenshot cards with editable extracted chips and an explicit year picker when the year cannot be read.
- Add browser-only photo scanning with EXIF year/GPS extraction, coarse reverse geocoding, review checkboxes, and a clear statement that photos never leave the device.
- Keep the parser interface extensible for Telegram, Netflix, YouTube, and Instagram after the core demo is stable.

## 8. Add translation, drift, and the outcome loop

- Build the Timeline Map with a lived trunk, context lanes, speculative branches, and draggable self orbs that can be summoned to the Council.
- Before scoring, translate each option to the self’s knowledge horizon with Qloo; show the original entity, translated entity, direction, and confidence.
- Add Drift view for kept, dropped, and newly acquired tastes using Qloo profile similarity.
- Record Loved, Fine, or Regret outcomes, update per-self/per-domain Beta trust weights, and show a measurable Self Leaderboard without inventing performance numbers.
- Generate a shareable verdict card containing the question, votes, cited entities, verdict, and approximation disclosure.

## 9. Ship the MCP surface and the hosted product

- Expose scoped, revocable Streamable HTTP MCP tools: `list_eras`, `get_era_profile`, `ask_past_self`, `convene_council`, `compare_eras`, and `recommend_for_all_selves`.
- Build the Connect page with token creation, scope selection, copyable Claude/Cursor configurations, `tools/list` smoke test, activity log, and revocation.
- Deploy the web app publicly on Vercel and the API/MCP service on Render or Fly with HTTPS, health checks, rate limits, error monitoring, and transient-upload cleanup.
- Verify the public demo from a clean browser and ensure all synthetic personas work without private access.

## 10. Validate the demo and submit

- Run unit tests for parsers, merge weights, access/privacy rules, Qloo normalization, affinity aggregation, translation fallback, and council guardrails.
- Run an end-to-end judge path: choose a persona, tap eight Era Grid cards, meet a self, run a money decision with three selves, compare Qloo versus LLM-only, record an outcome, and open Connect.
- Test missing Qloo credentials, unavailable year filters, unresolved entities, malformed imports, empty photo metadata, rate limits, and mobile layouts with explicit user-facing errors.
- Complete the README, Devpost description, public repository, MIT license visibility, live demo URL, Qloo integration explanation, and final clean-browser smoke test.
