import type { Answers, StanceRecord, StanceValue } from "../types";
import { IMPORTANCE } from "./config";

/**
 * Answers are stored either as a bare number (the original schema, still in
 * users' localStorage) or as a StanceRecord. Every read goes through here so
 * neither shape leaks into scoring or UI code.
 */
export function toRecord(value: StanceValue): StanceRecord {
  return typeof value === "number" ? { position: value } : value;
}

/** The respondent's position, or undefined if they never answered. */
export function getPosition(
  answers: Answers,
  topicId: string,
): number | undefined {
  const v = answers[topicId];
  if (v == null) return undefined;
  const pos = typeof v === "number" ? v : v.position;
  return Number.isFinite(pos) ? pos : undefined;
}

/** Raw stored importance rating, or undefined if they never rated it. */
function rawRating(
  answers: Answers,
  topicId: string,
): number | undefined {
  const v = answers[topicId];
  if (v == null || typeof v === "number") return undefined;
  return Number.isFinite(v.salience) ? v.salience : undefined;
}

/**
 * The importance rating to score with: 0..IMPORTANCE.max, clamped, falling
 * back to the configured default when the respondent never rated the question.
 *
 * Clamping matters because a stored value is not trusted data — a stray
 * out-of-range number would silently reweight the composite, and a negative one
 * would drop the question without the UI ever saying so.
 */
export function getImportance(
  answers: Answers,
  topicId: string,
): number {
  const r = rawRating(answers, topicId);
  if (r == null) return IMPORTANCE.default;
  return Math.min(IMPORTANCE.max, Math.max(0, r));
}

/** True only if the respondent explicitly set a rating (vs. inheriting one). */
export function hasExplicitRating(
  answers: Answers,
  topicId: string,
): boolean {
  return rawRating(answers, topicId) != null;
}

/** 0..100 certainty the respondent expressed, if they said. */
export function getConfidence(
  answers: Answers,
  topicId: string,
): number | undefined {
  const v = answers[topicId];
  if (v == null || typeof v === "number") return undefined;
  return Number.isFinite(v.confidence) ? v.confidence : undefined;
}

/** True if the respondent has taken a position on this topic. */
export function isAnswered(answers: Answers, topicId: string): boolean {
  return getPosition(answers, topicId) !== undefined;
}

/** Immutably set the position, preserving any salience/confidence already set. */
export function withPosition(
  value: StanceValue | undefined,
  position: number,
): StanceValue {
  if (value == null || typeof value === "number") return position;
  return { ...value, position };
}

/**
 * Immutably set the importance rating, promoting a legacy bare number to a
 * record. Deliberately does NOT seed a position: a question rated before it is
 * positioned must stay unanswered rather than silently scoring as neutral.
 */
export function withSalience(
  value: StanceValue | undefined,
  salience: number,
): StanceRecord {
  const base = value == null ? {} : toRecord(value);
  return { ...base, salience };
}

/** Immutably set confidence. Like `withSalience`, never seeds a position. */
export function withConfidence(
  value: StanceValue | undefined,
  confidence: number,
): StanceRecord {
  const base = value == null ? {} : toRecord(value);
  return { ...base, confidence };
}
