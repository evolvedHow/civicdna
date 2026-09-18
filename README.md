# civicDNA

A mobile-first civic self-assessment. You set your stance on a series of national
issues, and the app compares each one against the national average and against a
benchmark for your ZIP code and demographic cohort — then scores the whole thing
into a single index with a shareable badge.

## Quick start

```bash
npm install
npm run dev      # → http://localhost:5173
npm run build    # tsc --noEmit && vite build → dist/
npm run preview  # serve the production build
```

## How the score works

Two-stage, **category-weighted**:

1. Within a category, topics are averaged using their own `weight` from
   `src/data/topics.json` (salience against sibling issues).
2. Category scores are combined using `scoring.categoryWeights` in
   `src/data/config.yaml`.

Stage 2 is the point: a flat topic-level average would make the index mostly a
score for whichever category happened to have the most questions written about
it. Categories with no answered topics drop out and the remaining weights
re-normalise, so a partial run still lands on the same scale.

Unanswered topics are **excluded**, not scored as neutral — folding in defaults
drags every partial result toward the centre.

**Decisiveness** is a separate number: mean distance from neutral, as a share of
the maximum possible. It measures distance, not direction — a firmly-held left
position and a firmly-held right position score identically, so question wording
can't inflate it. This is why the stance scale must stay symmetric.

### Two scoring invariants

- `score.neutral` in `config.yaml` **must** be the exact midpoint of
  `score.min`..`score.max`, or decisiveness becomes asymmetric.
- In `topics.json`, `leftAnchorLabel` is always the market/autonomy pole and
  `rightAnchorLabel` always the collective/regulated pole. Flipping one topic
  inverts its contribution and silently corrupts the composite index.

## Configuration

`src/data/config.yaml` drives branding, the score scale, decisiveness copy,
share text, category weights, and the range-based badge bands — no code changes
needed. Bands are inclusive `min..max` and should tile the full score range.
Each band may override the global `explanation` and `shareText` templates.

Placeholders available in those templates: `{score}` `{suffix}` `{scoreLabel}`
`{badge}` `{tagline}` `{decisive}` `{decisiveLabel}` `{avgDistance}`
`{answered}` `{total}` `{zip}` `{brand}` `{url}`. Unknown tokens render verbatim
so a typo is visible rather than silently blank.

`src/data/topics.json` holds the issue bank. **Only 3 of an intended 25 topics
are present** (see `meta.demoNote`) — with this few, two of the five radar
categories never appear.

## AI narrative (optional)

`worker/` is a Cloudflare Worker wrapping Workers AI. It is **disabled by
default**: with `VITE_NARRATIVE_URL` unset, no network call is made and the
results screen uses its deterministic local read-out.

```bash
cd worker && npx wrangler deploy     # prints the workers.dev URL
cd .. && cp .env.example .env.local  # paste it into VITE_NARRATIVE_URL
```

Anything `VITE_`-prefixed is inlined into the public bundle, so
`VITE_NARRATIVE_TOKEN` is rate-limiting friction, **not** authentication. Real
protection is pinning `Access-Control-Allow-Origin` in `worker/index.js` — it is
currently `*`.

## Data caveat

ZIP-level benchmarks in `src/lib/zipData.ts` are **deterministic mock data**:
national averages plus seeded per-ZIP noise and an urbanicity pull derived from
the ZIP's first digit. They are stable per (ZIP, topic) but they are not real
local polling. A production deployment would swap `zipDensity()` for ACS
tract-level data.

## Deployment

Pushing to `main` builds and publishes to GitHub Pages via
`.github/workflows/deploy.yml`. Pages must be set to **Source: GitHub Actions**
in repository settings. `vite.config.ts` uses `base: "./"`, so the build works
from a project subpath without further configuration.
