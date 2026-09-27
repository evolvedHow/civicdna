import type { StanceValue } from "../types";

/**
 * Topic ids renamed between schema versions.
 *
 * Only add an entry when the new topic measures the SAME construct with the
 * SAME anchor orientation — otherwise the carried-over number silently means
 * something different than it did when the respondent set it.
 *
 * v1 -> v2: `universal-healthcare` ("Pure Market Insurance" ->
 * "Universal Public Coverage") became `healthcare-system` ("Private Market
 * Healthcare" -> "Universal Publicly Guaranteed Coverage"). Same construct,
 * same direction, so the stored position keeps its exact meaning.
 */
export const TOPIC_RENAMES: Record<string, string> = {
  "universal-healthcare": "healthcare-system",
};

export interface PersistedAppState {
  answers?: Record<string, StanceValue>;
  touched?: Record<string, boolean>;
  [key: string]: unknown;
}

function remap<T>(
  src: Record<string, T> | undefined,
): Record<string, T> | undefined {
  if (!src) return src;
  const out: Record<string, T> = {};
  for (const [key, value] of Object.entries(src)) {
    const next = TOPIC_RENAMES[key] ?? key;
    // If the respondent somehow holds both ids, the answer already stored
    // under the NEW id wins — never clobber a more recent answer.
    if (next !== key && next in src) continue;
    out[next] = value;
  }
  return out;
}

/** Highest rating the current control offers. Mirrors config.yaml. */
const CURRENT_MAX = 5;
/** Full range of the old 0..100 scale, used to convert it. */
const LEGACY_MAX = 100;

/**
 * The importance rating used to be specced as 0..100 (change request §6) and
 * shipped as 0..5. No UI ever wrote the field, so in practice nothing is
 * stored on the old scale — but any value the current control could not produce
 * is unambiguous evidence of the old scale, so rescale it rather than letting
 * the clamp in lib/stance.ts silently pin a legacy 82 to "max".
 */
function rescaleRating(record: StanceValue): StanceValue {
  if (typeof record === "number") return record;
  const s = record.salience;
  if (typeof s !== "number" || !Number.isFinite(s) || s < 0) {
    // A negative rating is corrupt, not legacy. Collapse it to the one value
    // that is unambiguously "excluded" rather than pass it downstream.
    return typeof s === "number" && Number.isFinite(s) && s < 0
      ? { ...record, salience: 0 }
      : record;
  }
  if (s <= CURRENT_MAX) return record;
  // 0..100 -> 0..5, then round to a rating the control can actually hold.
  // Any non-zero legacy value stays at least 1: on the current scale 0 does not
  // mean "smallest", it means "excluded", and rounding 0.3 down to it would
  // silently drop a question the respondent had counted.
  if (s <= 0) return { ...record, salience: 0 };
  const scaled = Math.max(1, Math.min(CURRENT_MAX, Math.round((s / LEGACY_MAX) * CURRENT_MAX)));
  return { ...record, salience: scaled };
}

function migrateAnswers(
  answers: Record<string, StanceValue> | undefined,
): Record<string, StanceValue> | undefined {
  if (!answers) return answers;
  const out: Record<string, StanceValue> = {};
  for (const [id, value] of Object.entries(answers)) {
    out[id] = rescaleRating(value);
  }
  return out;
}

/**
 * v1 -> v2 (topic framework expansion).
 *
 * Renamed ids are carried across. `trade-offshoring` has no v2 successor and
 * is deliberately LEFT IN PLACE rather than deleted: the topic is retained in
 * topics.json with topicStatus "archived", so the answer stays interpretable
 * even though it no longer feeds the composite.
 *
 * v2 -> v3 (importance rating).
 *
 * Only the salience scale changes; positions are untouched, so no composite
 * index moves. See `rescaleRating`.
 *
 * No unanswered topic is ever backfilled with a neutral value.
 */
export function migrateAppState(
  persisted: unknown,
  fromVersion: number,
): unknown {
  const state = persisted as PersistedAppState | null;
  if (!state || fromVersion >= 3) return persisted;

  if (fromVersion >= 2) {
    // Nothing to remap ids for, but the rating scale still needs converting.
    return { ...state, answers: migrateAnswers(state.answers) };
  }

  return {
    ...state,
    answers: migrateAnswers(remap(state.answers)),
    touched: remap(state.touched),
  };
}
