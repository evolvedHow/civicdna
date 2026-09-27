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

Every question can also be **rated for importance, 0–5** (default `3`), which
scales how much that answer counts (`effectiveWeight = topicWeight ×
rating/IMPORTANCE.default`). The default is a no-op, so scores recorded before
the control existed are unchanged; `0` means the answer does not count at all
and is excluded from the maths, which re-normalises the rest. Ratings are
opt-in per question and are stored with the answer (`salience` on the stance
record), so rating a question before positioning it does not register a neutral
answer. The persisted store is version `3`; older ratings on a `0–100` scale
are rescaled on load.

Tunable under `importance:` in `config.yaml` (`enabled`, `default`, `max`).

**Decisiveness** is a separate number: mean distance from neutral, as a share of
the maximum possible. It measures distance, not direction — a firmly-held left
position at either end of a spectrum scores identically, so question wording
can't inflate it. This is why the stance scale must stay symmetric.

The index is **not** a left/right political identity. `leftAnchorLabel` and
`rightAnchorLabel` are the poles of each issue's own policy spectrum; the field
names are retained for schema compatibility only. Band copy must not use party
or ideology labels.

### The results spectrum

A single `60/100, 44% decisive` pair turned out to be the least useful thing on
the results page, so the headline is now a five-band **distribution** of the
same weighted answers:

| Band | Stance |
| --- | --- |
| Individual | far below neutral |
| Leaning individual | just below |
| Moderate | within `spectrum.neutralBand` of neutral |
| Leaning collective | just above |
| Collective | far above |

Each band percentage is a **share of total effective weight**, so the five
numbers sum to exactly 100 and the weighting shown against every question in
the quiz is literally what moves them. Alongside it: a signed `tilt`
(-100..+100), the `intensity` of each band, and a per-band list of the issues
that produced it, named with their own anchor wording.

The labels describe the axis every topic's anchors already share — from
individual/market discretion to collective/regulated coordination. They are
presentational only. Per change request §14 they never appear as the primary
response choices; the sliders keep using each topic's own fluid anchor labels.
Tunable in `config.yaml` under `spectrum:` (labels, `neutralBand`,
`strongThreshold`, `evenThreshold`), and guarded by `npm run validate`.

### The shareable badge

The downloadable image is the same idea taken further: instead of a dial and a
single figure, it is one horizontal axis with a **bubble per category** —
`x` is where that category landed, fill is read off the same gradient as the
axis, and area is its share of the composite. There is deliberately no headline
number, since a single figure on a shareable image invites exactly the
comparison that means least.

Categories do cluster, often hard, so the layout is a real packing problem.
Bubbles are separated **vertically only** — `x` is the value encoding, and
nudging a bubble sideways would move a category off the position it actually
scored. When a cluster will not fit, the radius cap gives way until it does,
which keeps area *proportional* to share (area is what the eye reads as
magnitude) at the cost of overall scale. `layoutBubbles()` in
`src/lib/badgeImage.ts` is pure geometry with no canvas dependency, so this is
testable without a renderer.

### Two scoring invariants

- `score.neutral` in `config.yaml` **must** be the exact midpoint of
  `score.min`..`score.max`, or decisiveness becomes asymmetric.
- In `topics.json`, `leftAnchorLabel` is always the market/autonomy pole and
  `rightAnchorLabel` always the collective/regulated pole. Flipping one topic
  inverts its contribution and silently corrupts the composite index.

## Configuration

`src/data/config.yaml` drives branding, the score scale, decisiveness copy, the
results spectrum, share text, category weights, and the range-based badge bands —
no code changes needed. Bands are inclusive `min..max` and should tile the full
score range. Each band may override the global `explanation` and `shareText`
templates.

Placeholders available in those templates: `{score}` `{suffix}` `{scoreLabel}`
`{badge}` `{tagline}` `{decisive}` `{decisiveLabel}` `{avgDistance}`
`{answered}` `{total}` `{zip}` `{brand}` `{url}` `{spectrumHeadline}` `{tilt}`
`{tiltText}` `{spectrum}`. Unknown tokens render verbatim
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
