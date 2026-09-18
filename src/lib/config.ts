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

export const SHARE_TEMPLATE = raw.share?.text ?? "{scoreLabel} {score}{suffix}";

/** Per-category pull on the composite index. Any category omitted defaults to 1. */
export const CATEGORY_WEIGHTS: Record<Category, number> = {
  market: raw.scoring?.categoryWeights?.market ?? 1,
  social: raw.scoring?.categoryWeights?.social ?? 1,
  welfare: raw.scoring?.categoryWeights?.welfare ?? 1,
  global: raw.scoring?.categoryWeights?.global ?? 1,
  governance: raw.scoring?.categoryWeights?.governance ?? 1,
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
