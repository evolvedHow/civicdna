import type { Answers, StanceRecord, StanceValue } from "../types";

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

/** 0..100 importance the respondent placed on this issue, if they said. */
export function getSalience(
  answers: Answers,
  topicId: string,
): number | undefined {
  const v = answers[topicId];
  if (v == null || typeof v === "number") return undefined;
  return Number.isFinite(v.salience) ? v.salience : undefined;
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

/** Immutably set salience, promoting a legacy bare number to a record. */
export function withSalience(
  value: StanceValue | undefined,
  salience: number,
): StanceRecord {
  const base = value == null ? { position: 50 } : toRecord(value);
  return { ...base, salience };
}

/** Immutably set confidence, promoting a legacy bare number to a record. */
export function withConfidence(
  value: StanceValue | undefined,
  confidence: number,
): StanceRecord {
  const base = value == null ? { position: 50 } : toRecord(value);
  return { ...base, confidence };
}
