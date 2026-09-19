import type { LocalBenchmark, Profile, Topic } from "../types";
import { hasBenchmark } from "./topics";

/** FNV-1a so the same (zip, topic) always yields the same numbers. */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v: number) => Math.min(95, Math.max(5, Math.round(v)));

/** Undefined/null cells pass through untouched; present cells get seeded noise. */
function shiftApprox<T extends Record<string, number | null>>(
  entry: T | null,
  rng: () => number,
): T | null {
  if (!entry) return null;
  return Object.fromEntries(
    Object.entries(entry).map(([k, v]) => [
      k,
      v == null ? null : clamp(v + (rng() - 0.5) * 10),
    ]),
  ) as T;
}

/**
 * Coarse metro-density heuristic from the ZIP's first digit
 * (0-2 dense coasts, 3-4 mixed metros, 5-6 suburban, 7-9 rural bands).
 * A real deployment would swap this for ACS tract-level density.
 */
function zipDensity(zip: string): number {
  const band = Number(zip[0] ?? "3");
  if (band <= 2) return 0.75;
  if (band <= 4) return 0.55;
  if (band <= 6) return 0.4;
  return 0.25;
}

/**
 * How far the user's chosen demographic cohort diverges from the national
 * average on this issue (mean across the dims they shared that actually have
 * survey data). `n` is how many of those dims contributed, so callers can
 * scale the cohort pull by real data coverage rather than by what the user
 * filled in.
 */
export function cohortOffset(
  topic: Topic,
  profile?: Profile,
): { offset: number; n: number } {
  if (!profile || !hasBenchmark(topic)) return { offset: 0, n: 0 };
  const values: number[] = [];
  if (profile.gender) {
    const v = topic.demographicSplits.gender?.[profile.gender];
    if (v != null) values.push(v);
  }
  if (profile.race) {
    const v = topic.demographicSplits.race?.[profile.race];
    if (v != null) values.push(v);
  }
  if (profile.income) {
    const v = topic.demographicSplits.income?.[profile.income];
    if (v != null) values.push(v);
  }
  if (values.length === 0) return { offset: 0, n: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return { offset: mean - topic.nationalAvg, n: values.length };
}

/**
 * Deterministic mock "zip-level average" for a topic.
 * National average + per-zip seeded noise + urbanicity pull, then blended
 * toward the user's demographic cohorts. The more dims with REAL data they
 * share, the stronger the cohort pull (capped).
 */
export function localBenchmark(
  zip: string,
  topic: Topic,
  profile?: Profile,
): LocalBenchmark | null {
  // No validated national/demographic data means no benchmark can be derived.
  // Returning null keeps invented numbers out of the UI (change request §4).
  if (!hasBenchmark(topic)) return null;

  const key = (salt: string) => mulberry32(hash(`${zip}:${topic.id}:${salt}`));
  const density = zipDensity(zip);
  const urbs = topic.demographicSplits.urbanicity;
  const urbanPull =
    urbs?.urban != null && urbs.rural != null ? urbs.urban - urbs.rural : 0;

  // Only blend toward cohorts whose subgroup figure the survey actually
  // published — a user who shared a dim with no crosstab gets no pull there.
  const { offset, n } = cohortOffset(topic, profile);
  const blend = Math.min(0.5, 0.17 * n);

  const avg = clamp(
    topic.nationalAvg +
      (key("avg")() - 0.5) * 22 +
      (density - 0.5) * urbanPull +
      offset * blend,
  );

  return {
    avg,
    gender: shiftApprox(topic.demographicSplits.gender, key("gender")),
    race: shiftApprox(topic.demographicSplits.race, key("race")),
    income: shiftApprox(topic.demographicSplits.income, key("income")),
    urbanicity: shiftApprox(
      topic.demographicSplits.urbanicity,
      key("urbanicity"),
    ),
  };
}

/** Convenience wrapper matching the spec's `zipCodeAvg` naming. */
export function zipCodeAvg(
  zip: string,
  topic: Topic,
  profile?: Profile,
): number | null {
  return localBenchmark(zip, topic, profile)?.avg ?? null;
}