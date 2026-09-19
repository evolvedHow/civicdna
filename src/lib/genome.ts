import type { Answers, Category, Topic } from "../types";
import { CATEGORY_WEIGHTS, MAX_DISTANCE, SCORE, USE_SALIENCE } from "./config";
import { getPosition, getSalience } from "./stance";

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
 * effectiveWeight = topicWeight x (salience / neutral)
 *
 * Midpoint salience leaves the weight untouched, so turning USE_SALIENCE on
 * does not shift the score of anyone who never set a salience. OFF by default:
 * enabling it changes the meaning of every historical composite, which the
 * change request (§12) explicitly warns against doing silently.
 */
function salienceMultiplier(answers: Answers, topicId: string): number {
  if (!USE_SALIENCE) return 1;
  const s = getSalience(answers, topicId);
  if (s == null || SCORE.neutral === 0) return 1;
  return s / SCORE.neutral;
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
    const w = (t.weight ?? 1) * salienceMultiplier(answers, t.id);
    if (w <= 0) continue; // zero salience removes the topic entirely
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
