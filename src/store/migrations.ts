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

/**
 * v1 -> v2 (topic framework expansion).
 *
 * Renamed ids are carried across. `trade-offshoring` has no v2 successor and
 * is deliberately LEFT IN PLACE rather than deleted: the topic is retained in
 * topics.json with topicStatus "archived", so the answer stays interpretable
 * even though it no longer feeds the composite.
 *
 * No unanswered topic is ever backfilled with a neutral value.
 */
export function migrateAppState(
  persisted: unknown,
  fromVersion: number,
): unknown {
  const state = persisted as PersistedAppState | null;
  if (!state || fromVersion >= 2) return persisted;

  return {
    ...state,
    answers: remap(state.answers),
    touched: remap(state.touched),
  };
}
