import type { Answers, Category, Topic } from "../types";
import {
  CATEGORY_WEIGHTS,
  IMPORTANCE,
  MAX_DISTANCE,
  SCORE,
  SPECTRUM,
  importanceWeight,
} from "./config";
import { BANDS, bandFor, bandLabel, tiltPhrase, type BandIndex, type BandSide } from "./spectrum";
import { getImportance, getPosition } from "./stance";

export const CATEGORIES: Category[] = [
  "market",
  "welfare",
  "social",
  "environment",
  "technology",
  "global",
  "governance",
];

/**
 * effectiveWeight = topicWeight x (rating / IMPORTANCE.default)
 *
 * A question rated the default is a no-op, so a respondent who touches no
 * rating scores exactly what they scored before the control existed. A rating
 * of 0 zeroes the weight, which drops the question out of the composite
 * entirely — the stance stays recorded and visible, it just stops counting.
 */
function ratingMultiplier(answers: Answers, topicId: string): number {
  if (!IMPORTANCE.enabled) return 1;
  return importanceWeight(getImportance(answers, topicId));
}

export interface CategoryBreakdown {
  category: Category;
  /** Weighted mean stance of the answered topics in this category. */
  score: number;
  /** Mean distance from neutral within this category, as a percentage. */
  decisive: number;
  /** Configured category weight from config.yaml. */
  weight: number;
  /** 0..1 — this category's actual share of the composite, after re-normalising. */
  share: number;
  /** Answered topics in this category. */
  answered: number;
  /** Topics offered in this category. */
  total: number;
}

export interface Genome {
  /** Category-weighted composite on the configured score scale. */
  index: number;
  /** 0..100 — mean distance from neutral, as a share of the maximum possible. */
  decisive: number;
  /** Mean points off neutral that `decisive` corresponds to. */
  avgDistance: number;
  /** Score per radar axis (only categories with at least one answer). */
  perCategory: Partial<Record<Category, number>>;
  /** Full per-category detail, ordered, for the weighting disclosure. */
  breakdown: CategoryBreakdown[];
  answered: number;
  total: number;
  coverage: number;
}

interface Acc {
  sum: number;
  dist: number;
  w: number;
  answered: number;
  total: number;
}

/**
 * TWO-STAGE, CATEGORY-WEIGHTED SCORING.
 *
 *   stage 1 — within a category, average topics by their own `weight`
 *   stage 2 — average the category scores by CATEGORY_WEIGHTS
 *
 * Stage 2 matters because the question bank is not evenly distributed. A flat
 * topic-level average would make the index mostly a score for whichever
 * category happens to have the most questions written about it.
 *
 * Untouched topics are EXCLUDED rather than scored as neutral: folding in
 * defaults drags every partial result toward the centre.
 */
export function computeGenome(topics: Topic[], answers: Answers): Genome {
  const acc = new Map<Category, Acc>();
  const bump = (c: Category) => {
    let a = acc.get(c);
    if (!a) {
      a = { sum: 0, dist: 0, w: 0, answered: 0, total: 0 };
      acc.set(c, a);
    }
    return a;
  };

  let answered = 0;
  for (const t of topics) {
    const a = bump(t.category);
    a.total++;
    const v = getPosition(answers, t.id);
    if (v == null) continue;
    const w = (t.weight ?? 1) * ratingMultiplier(answers, t.id);
    if (w <= 0) continue; // rated 0: the topic leaves the score entirely
    answered++;
    a.answered++;
    a.w += w;
    a.sum += w * v;
    a.dist += w * Math.abs(v - SCORE.neutral);
  }

  // Stage 2 — only categories with at least one answer participate, and their
  // weights re-normalise so a partial run still lands on the same scale.
  const live = CATEGORIES.filter((c) => (acc.get(c)?.w ?? 0) > 0);
  const weightTotal = live.reduce((sum, c) => sum + CATEGORY_WEIGHTS[c], 0);

  const perCategory: Partial<Record<Category, number>> = {};
  const breakdown: CategoryBreakdown[] = [];
  let index = 0;
  let distance = 0;

  for (const c of CATEGORIES) {
    const a = acc.get(c);
    if (!a || a.total === 0) continue;
    const isLive = a.w > 0;
    const catScore = isLive ? a.sum / a.w : SCORE.neutral;
    const catDist = isLive ? a.dist / a.w : 0;
    const share = isLive && weightTotal > 0 ? CATEGORY_WEIGHTS[c] / weightTotal : 0;

    if (isLive) {
      perCategory[c] = Math.round(catScore);
      index += catScore * share;
      distance += catDist * share;
    }

    breakdown.push({
      category: c,
      score: Math.round(catScore),
      decisive: MAX_DISTANCE > 0 ? Math.round((catDist / MAX_DISTANCE) * 100) : 0,
      weight: CATEGORY_WEIGHTS[c],
      share,
      answered: a.answered,
      total: a.total,
    });
  }

  return {
    index: live.length ? Math.round(index) : SCORE.neutral,
    decisive:
      live.length && MAX_DISTANCE > 0
        ? Math.round((distance / MAX_DISTANCE) * 100)
        : 0,
    avgDistance: Math.round(distance),
    perCategory,
    breakdown,
    answered,
    total: topics.length,
    coverage: topics.length ? answered / topics.length : 0,
  };
}

// ---------------------------------------------------------------------------
// Per-question weighting
// ---------------------------------------------------------------------------

export interface TopicWeightShare {
  category: Category;
  /** Configured category weight from config.yaml. */
  categoryWeight: number;
  /** The topic's own salience weight against its category siblings. */
  topicWeight: number;
  /** The respondent's importance rating, 0..IMPORTANCE.max. */
  rating: number;
  /** rating / IMPORTANCE.default — 1 when the rating is the default. */
  ratingMultiplier: number;
  /** 0..1 — this category's share of the whole index. */
  categoryShare: number;
  /** 0..1 — this topic's share of its own category. */
  withinCategory: number;
  /**
   * 0..1 — this single question's share of the whole index, as a share of the
   * FULL question bank. This is `categoryShare x withinCategory`, i.e. the two
   * stages of the composite multiplied out.
   *
   * Because unanswered categories drop out of the composite and the rest
   * re-normalise, a question's realised share rises as the respondent skips
   * others. The UI labels this figure as the full-bank share so the number
   * does not move while the quiz is being answered.
   */
  share: number;
}

/**
 * How much of the composite each individual question is worth.
 *
 * The composite is a product of two averages, so the shares factor exactly:
 *
 *   share(topic) = categoryShare(category) x withinCategory(topic)
 *
 * Stage 2 is deliberately independent of how many questions a category has —
 * that is the entire point of the two-stage model — so `categoryShare` sums
 * the configured category weights, not the topic mass beneath them.
 *
 * `answers` is optional and only consulted for importance ratings, so passing
 * an empty object yields the unrated weighting. An unrated question inherits
 * the default rating, whose multiplier is 1, so ratings are the only thing
 * that moves a share here.
 */
export function computeTopicWeights(
  topics: Topic[],
  answers: Answers = {},
): Map<string, TopicWeightShare> {
  const effective = new Map<string, number>();
  const siblingWeight = new Map<Category, number>();
  for (const t of topics) {
    const w = (t.weight ?? 1) * ratingMultiplier(answers, t.id);
    effective.set(t.id, w);
    if (!(w > 0)) continue;
    siblingWeight.set(t.category, (siblingWeight.get(t.category) ?? 0) + w);
  }

  // Only categories that actually carry a live question take part, so the
  // shares still sum to 1 when a category is present but fully zero-weighted.
  const liveCategories = CATEGORIES.filter((c) => (siblingWeight.get(c) ?? 0) > 0);
  const categoryTotal = liveCategories.reduce(
    (sum, c) => sum + CATEGORY_WEIGHTS[c],
    0,
  );

  const out = new Map<string, TopicWeightShare>();
  for (const t of topics) {
    const topicWeight = t.weight ?? 1;
    const effectiveWeight = effective.get(t.id) ?? 0;
    const categoryWeight = CATEGORY_WEIGHTS[t.category];
    const siblings = siblingWeight.get(t.category) ?? 0;
    const categoryShare =
      categoryTotal > 0 && siblings > 0 ? categoryWeight / categoryTotal : 0;
    // A zero or negative weight drops the topic out of the maths entirely.
    // Still emit an entry so callers can render a truthful "counts for
    // nothing" rather than having to guard every lookup.
    const withinCategory =
      siblings > 0 && effectiveWeight > 0 ? effectiveWeight / siblings : 0;
    out.set(t.id, {
      category: t.category,
      categoryWeight,
      topicWeight,
      rating: getImportance(answers, t.id),
      ratingMultiplier: ratingMultiplier(answers, t.id),
      categoryShare,
      withinCategory,
      share: categoryShare * withinCategory,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Derived results spectrum
// ---------------------------------------------------------------------------

export interface SpectrumBandResult {
  band: BandIndex;
  side: BandSide;
  label: string;
  /** 0..1 of total effective weight in this band. */
  share: number;
  /** Displayed 0..100. Bands are rounded to sum to exactly 100. */
  pct: number;
  /** Answered topics in this band. */
  count: number;
  /**
   * Mean distance from neutral of the topics in this band, as a percentage of
   * the furthest possible. How firmly this band is held, independent of how
   * much of the score sits there.
   */
  intensity: number;
  /** The topics here, firmest position first. */
  topics: { topic: Topic; value: number }[];
}

export interface Spectrum {
  /** Always five bands, low to high, so the bar never reflows. */
  bands: SpectrumBandResult[];
  /** Highest-share band; ties resolve toward the centre. */
  dominant: SpectrumBandResult;
  /**
   * The single phrase the whole result leads with. Computed once here so the
   * header chip, the panel, the narrative and the share text cannot drift
   * apart. "Evenly split" when the two sides are balanced, otherwise the
   * dominant band.
   */
  headline: string;
  /** 0..1 share below neutral (bands 0 + 1). */
  low: number;
  /** 0..1 share in the centre band. */
  moderate: number;
  /** 0..1 share above neutral (bands 3 + 4). */
  high: number;
  /** -100..+100, signed and weight-normalised. Positive is toward the high pole. */
  tilt: number;
  /** Ready-made `tilt` wording for copy. */
  tiltText: string;
  /** True when the two sides are within SPECTRUM.evenThreshold of each other. */
  even: boolean;
  answered: number;
  total: number;
}

interface Bucket {
  w: number;
  dist: number;
  topics: { topic: Topic; value: number }[];
}

/**
 * Rounds a set of shares to whole percentages that still sum to 100.
 *
 * Naive per-band rounding is what makes a five-number breakdown fail the first
 * time someone adds it up, so the leftover points go to the bands with the
 * largest discarded fraction.
 */
function roundToHundred(shares: number[]): number[] {
  const total = shares.reduce((a, b) => a + b, 0);
  if (total <= 0) return shares.map(() => 0);
  const scaled = shares.map((s) => (s / total) * 100);
  const out = scaled.map(Math.floor);
  let remainder = 100 - out.reduce((a, b) => a + b, 0);
  const byFraction = scaled
    .map((v, i) => ({ i, fraction: v - Math.floor(v) }))
    .sort((a, b) => b.fraction - a.fraction);
  for (let k = 0; k < byFraction.length && remainder > 0; k++, remainder--) {
    out[byFraction[k].i] += 1;
  }
  return out;
}

/**
 * The same weighted answers the composite is built from, expressed as a
 * five-band distribution instead of one coordinate.
 *
 * Each answered topic drops into a band by its distance from neutral, and the
 * band percentages are weight shares — so the weighting shown against every
 * question in the quiz is literally what moves these numbers, and the two
 * screens cannot disagree.
 *
 * Untouched topics are excluded, exactly as in the composite: counting a
 * default as moderate would let a short run look moderate.
 */
export function computeSpectrum(topics: Topic[], answers: Answers): Spectrum {
  const buckets = new Map<BandIndex, Bucket>();
  let totalWeight = 0;
  let weightedOffset = 0;
  let answered = 0;

  for (const t of topics) {
    const v = getPosition(answers, t.id);
    if (v == null) continue;
    const w = (t.weight ?? 1) * ratingMultiplier(answers, t.id);
    if (w <= 0) continue;
    answered++;
    totalWeight += w;
    weightedOffset += w * (v - SCORE.neutral);

    const band = bandFor(v);
    let bucket = buckets.get(band);
    if (!bucket) {
      bucket = { w: 0, dist: 0, topics: [] };
      buckets.set(band, bucket);
    }
    bucket.w += w;
    bucket.dist += w * Math.abs(v - SCORE.neutral);
    bucket.topics.push({ topic: t, value: v });
  }

  const sides = { low: 0, center: 0, high: 0 } as Record<BandSide, number>;
  const rawShares: number[] = [];
  for (const def of BANDS) {
    const bucket = buckets.get(def.index);
    const share = totalWeight > 0 && bucket ? bucket.w / totalWeight : 0;
    sides[def.side] += share;
    rawShares.push(share);
  }
  const pcts = roundToHundred(rawShares);

  const bands: SpectrumBandResult[] = BANDS.map((def, i) => {
    const bucket = buckets.get(def.index);
    return {
      band: def.index,
      side: def.side,
      label: bandLabel(def.index),
      share: rawShares[i],
      pct: pcts[i],
      count: bucket?.topics.length ?? 0,
      intensity:
        bucket && bucket.w > 0 && MAX_DISTANCE > 0
          ? Math.round((bucket.dist / bucket.w / MAX_DISTANCE) * 100)
          : 0,
      topics: (bucket?.topics ?? []).sort(
        (a, b) =>
          Math.abs(b.value - SCORE.neutral) - Math.abs(a.value - SCORE.neutral),
      ),
    };
  });

  // A genuine tie between opposite poles is not a lean, it is a wash, so ties
  // resolve toward the centre rather than by array order.
  const dominant =
    bands
      .filter((b) => b.count > 0)
      .sort(
        (a, b) => b.share - a.share || Math.abs(a.band - 2) - Math.abs(b.band - 2),
      )[0] ?? bands[2];

  const tilt =
    totalWeight > 0 && MAX_DISTANCE > 0
      ? Math.round((weightedOffset / totalWeight / MAX_DISTANCE) * 100)
      : 0;

  const even = Math.abs(sides.high - sides.low) * 100 <= SPECTRUM.evenThreshold;

  return {
    bands,
    dominant,
    headline: answered === 0
      ? "Not enough answered"
      : even
        ? "Evenly split"
        : dominant.label,
    low: sides.low,
    moderate: sides.center,
    high: sides.high,
    tilt,
    tiltText: tiltPhrase(tilt),
    even,
    answered,
    total: topics.length,
  };
}
