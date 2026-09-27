import { MAX_DISTANCE, SCORE, SPECTRUM } from "./config";

/**
 * The five result bands, ordered from score.min to score.max. Index matters:
 * it is used as the array key everywhere, so the order is a data invariant.
 *
 * Band 2 (the centre) is the only one that straddles the neutral midpoint;
 * bands 0/1 sit entirely below it and 3/4 entirely above, so a band can never
 * contain stances pointing both ways.
 */
export const BANDS = [
  { index: 0, side: "low", color: "#b45309", text: "text-amber-700" },
  { index: 1, side: "low", color: "#d97706", text: "text-amber-600" },
  { index: 2, side: "center", color: "#94a3b8", text: "text-slate-500" },
  { index: 3, side: "high", color: "#6366f1", text: "text-indigo-500" },
  { index: 4, side: "high", color: "#4338ca", text: "text-indigo-700" },
] as const;

export type BandIndex = (typeof BANDS)[number]["index"];
export type BandSide = (typeof BANDS)[number]["side"];

/** Display label for a band, straight from config.yaml. */
export function bandLabel(index: number): string {
  switch (index) {
    case 0:
      return SPECTRUM.lowLabel;
    case 1:
      return SPECTRUM.lowLeanLabel;
    case 2:
      return SPECTRUM.neutralLabel;
    case 3:
      return SPECTRUM.highLeanLabel;
    default:
      return SPECTRUM.highLabel;
  }
}

/** Compact label for tight spaces, e.g. a legend under a 5-segment bar. */
export function bandShortLabel(index: number): string {
  switch (index) {
    case 0:
      return SPECTRUM.lowLabel;
    case 1:
      return SPECTRUM.lowLabel;
    case 2:
      return SPECTRUM.neutralLabel;
    case 3:
      return SPECTRUM.highLabel;
    default:
      return SPECTRUM.highLabel;
  }
}

/**
 * Which band a 0..100 stance falls into.
 *
 * `off` is the signed distance from the neutral midpoint, so the thresholds are
 * symmetric by construction: a stance mirrored about neutral always lands in
 * the mirrored band. Every returned index is in 0..4.
 */
export function bandFor(value: number): BandIndex {
  if (!Number.isFinite(value)) return 2;
  const off = value - SCORE.neutral;
  const distance = Math.abs(off);
  if (distance <= SPECTRUM.neutralBand) return 2;
  const isLean = distance <= SPECTRUM.strongThreshold;
  if (off < 0) return isLean ? 1 : 0;
  return isLean ? 3 : 4;
}

/** Normalised signed position, -1 (at score.min) .. +1 (at score.max). */
export function tiltFor(value: number): number {
  if (MAX_DISTANCE <= 0) return 0;
  return (value - SCORE.neutral) / MAX_DISTANCE;
}

/** Human-readable form of a tilt, for copy templates and share text. */
export function tiltPhrase(tilt: number): string {
  const mag = Math.abs(Math.round(tilt));
  if (mag < 1) return "dead centre";
  return `${mag}% toward ${tilt < 0 ? SPECTRUM.lowLabel.toLowerCase() : SPECTRUM.highLabel.toLowerCase()}`;
}
