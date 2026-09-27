import { parse } from "yaml";
import configYaml from "../data/config.yaml?raw";
import type { AppConfig, Badge, Category } from "../types";

const raw = parse(configYaml) as unknown as AppConfig;

export const BRAND = {
  name: raw.brand?.name ?? "civicDNA",
  wordmark: raw.brand?.wordmark ?? "C I V I C D N A",
  shareUrl: raw.brand?.shareUrl ?? "",
  badgeCta: raw.brand?.badgeCta ?? "",
  badgeEyebrow: raw.brand?.badgeEyebrow ?? "Badge",
};

export const SCORE = {
  label: raw.score?.label ?? "Index",
  suffix: raw.score?.suffix ?? "/100",
  min: raw.score?.min ?? 0,
  max: raw.score?.max ?? 100,
  neutral: raw.score?.neutral ?? 50,
};

/**
 * Largest possible distance from neutral. Used to normalise decisiveness.
 * Taken as the SMALLER of the two half-spans so the metric stays symmetric:
 * if neutral is off-centre, one direction can reach further than the other,
 * and a hard-left answer would score differently from a hard-right one.
 */
export const MAX_DISTANCE = Math.min(
  SCORE.neutral - SCORE.min,
  SCORE.max - SCORE.neutral,
);

export const DECISIVENESS = {
  label: raw.decisiveness?.label ?? "decisive",
  caption: raw.decisiveness?.caption ?? "{decisive}% {decisiveLabel}",
  explanation: raw.decisiveness?.explanation ?? "",
};

/**
 * Presentational banding of the stance scale. The maths it describes is
 * unchanged from the composite — it only re-expresses the same weighted
 * answers as a five-band distribution. Thresholds are clamped against
 * MAX_DISTANCE so a mis-edited config.yaml can never produce a band that
 * cannot be reached, or a lean band wider than the pole bands.
 */
const rawNeutralBand = Math.max(0, raw.spectrum?.neutralBand ?? 5);
const rawStrong = Math.max(0, raw.spectrum?.strongThreshold ?? 20);

export const SPECTRUM = {
  lowLabel: raw.spectrum?.lowLabel ?? "Individual",
  lowLeanLabel: raw.spectrum?.lowLeanLabel ?? "Leaning individual",
  neutralLabel: raw.spectrum?.neutralLabel ?? "Moderate",
  highLeanLabel: raw.spectrum?.highLeanLabel ?? "Leaning collective",
  highLabel: raw.spectrum?.highLabel ?? "Collective",
  neutralBand: Math.min(rawNeutralBand, MAX_DISTANCE),
  strongThreshold: Math.min(Math.max(rawStrong, rawNeutralBand + 1), MAX_DISTANCE),
  evenThreshold: Math.max(0, raw.spectrum?.evenThreshold ?? 10),
};

export const SHARE_TEMPLATE = raw.share?.text ?? "{scoreLabel} {score}{suffix}";

/**
 * Per-question importance rating ("how important is this to you?").
 *
 * The multiplier is `rating / default`, so `default` MUST be a rating the
 * control can actually produce and MUST be > 0 — it is the denominator. A
 * `default` of 3 on a 0..5 control is what makes this safe to ship: it is a
 * 1.0x no-op, so a respondent who rates nothing scores exactly as they did
 * before the control existed.
 */
const rawImportanceMax = Math.max(1, Math.trunc(raw.importance?.max ?? 5));
const rawImportanceDefault = Math.trunc(raw.importance?.default ?? 3);

export const IMPORTANCE = {
  enabled: raw.importance?.enabled ?? true,
  // Clamped into the control's range rather than trusted: a default outside
  // 0..max would either be unreachable (pre-selected but unselectable) or
  // divide by zero in the multiplier.
  max: rawImportanceMax,
  default: Math.min(
    rawImportanceMax,
    Math.max(0, rawImportanceDefault),
  ),
  prompt: raw.importance?.prompt ?? "How important is this to you?",
  lowLabel: raw.importance?.lowLabel ?? "Not at all",
  highLabel: raw.importance?.highLabel ?? "Essential",
  excludedNote:
    raw.importance?.excludedNote ??
    "Rated 0, so this question is left out of your score. Your position is still saved — raise the rating to count it.",
};

/** Multiplier applied to a topic's configured weight for a given rating. */
export function importanceWeight(rating: number): number {
  if (!IMPORTANCE.enabled) return 1;
  if (IMPORTANCE.default <= 0) return 1;
  return rating / IMPORTANCE.default;
}

/** Per-category pull on the composite index. Any category omitted defaults to 1. */
export const CATEGORY_WEIGHTS: Record<Category, number> = {
  market: raw.scoring?.categoryWeights?.market ?? 1,
  social: raw.scoring?.categoryWeights?.social ?? 1,
  welfare: raw.scoring?.categoryWeights?.welfare ?? 1,
  global: raw.scoring?.categoryWeights?.global ?? 1,
  governance: raw.scoring?.categoryWeights?.governance ?? 1,
  technology: raw.scoring?.categoryWeights?.technology ?? 1,
  environment: raw.scoring?.categoryWeights?.environment ?? 1,
};

export const BADGES = (raw.badges ?? []).slice().sort((a, b) => a.min - b.min);

const FALLBACK_BADGE: Badge = {
  id: "unscored",
  min: SCORE.min,
  max: SCORE.max,
  name: "Unscored",
  icon: "fingerprint",
  color: "#64748b",
  tagline: "No badge bands configured.",
  description:
    "config.yaml did not define any bands, so no badge could be assigned.",
};

export function findBadge(score: number): Badge {
  if (BADGES.length === 0) return FALLBACK_BADGE;
  const s = Math.round(score);
  const hit = BADGES.find((b) => s >= b.min && s <= b.max);
  if (hit) return hit;
  // Score fell in a gap between bands or outside them — clamp to the nearest
  // end rather than returning undefined.
  return s < BADGES[0].min ? BADGES[0] : BADGES[BADGES.length - 1];
}

// Back-compat aliases for the previous badges.ts surface.
export const SCORE_LABEL = SCORE.label;
export const SCORE_SUFFIX = SCORE.suffix;
