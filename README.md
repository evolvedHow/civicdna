# civicDNA

A mobile-first civic self-assessment. You set your stance on a series of national
issues, and the app compares each one against the national average and against a
benchmark for your ZIP code and demographic cohort — then scores the whole thing
into a single index with a shareable badge.

## Quick start

```bash
npm install
npm run dev       # → http://localhost:5173
npm run validate  # topic/config validation suite
npm run build     # validate && tsc --noEmit && vite build → dist/
npm run preview   # serve the production build
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

Salience weighting (`effectiveWeight = topicWeight × salience/50`) is
implemented but **off** — `scoring.useSalience` in `config.yaml`. Turning it on
changes the meaning of every previously recorded composite, so it is opt-in.

**Decisiveness** is a separate number: mean distance from neutral, as a share of
the maximum possible. It measures distance, not direction — a firmly-held left
position at either end of a spectrum scores identically, so question wording
can't inflate it. This is why the stance scale must stay symmetric.

The index is **not** a left/right political identity. `leftAnchorLabel` and
`rightAnchorLabel` are the poles of each issue's own policy spectrum; the field
names are retained for schema compatibility only. Band copy must not use party
or ideology labels.

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

## Topics

`src/data/topics.json` holds the issue bank: **23 active topics** across seven
categories (technology, governance, global, environment, market, welfare,
social), plus archived topics retained for historical answers.

No code asserts a topic count — the list can grow or shrink freely. `meta.
totalTopics` is validated against the actual active count rather than enforcing
a target.

Each topic may carry:

- `topicStatus` — `core` | `current` | `emerging` | `archived` (default `core`).
  Archived topics leave the questionnaire and the composite but stay readable.
- `activeFrom` / `activeUntil` — ISO dates bounding when a topic is asked.
- `dimensions` — documentation-only list of sub-axes a topic really spans, for
  a future multi-question model. No scoring logic reads it.

### Demographic benchmark data

Every active topic carries a real survey benchmark: `nationalAvg` (the % of the
national public endorsing the right-anchor, more collective/regulated pole of
that issue's spectrum), `demographicSplits` where the cited survey published
crosstabs, and a `source` string naming the pollster, field dates, sample, and
the exact question. Provenance lives in the `source` field — never fabricate or
guess a figure.

Cells a survey does not publish are `null` by design and are never estimated.
The app degrades honestly: issue cards show "not reported" for hidden subgroups,
and cards whose survey published no crosstabs at all explain that cohort
comparison has nothing to show.

The validator enforces that `nationalAvg` and `demographicSplits` arrive
together, that neither ships without a `source`, and that every non-null figure
lands on the 0–100 scale.

## Validation

`npm run validate` (also part of `npm run build`) checks schema integrity,
unique ids, weights > 0, `neutral === (min + max) / 2`, agreement between
`topics.json` and `config.yaml`, gapless badge bands, and flags topic names that
overlap enough to suggest a redundant measurement.

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
