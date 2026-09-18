import type { LocalBenchmark, Profile, Topic } from "../types";
import { cohortCount } from "./profile";

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

function shiftApprox<T extends Record<string, number>>(
  entry: T,
  rng: () => number,
): T {
  return Object.fromEntries(
    Object.entries(entry).map(([k, v]) => [k, clamp(v + (rng() - 0.5) * 10)]),
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
 * How far the user's chosen demographic cohort diverges from the
 * national average on this issue (mean across the dims they shared).
 */
export function cohortOffset(topic: Topic, profile?: Profile): number {
  if (!profile) return 0;
  const values: number[] = [];
  if (profile.gender) values.push(topic.demographicSplits.gender[profile.gender]);
  if (profile.race) values.push(topic.demographicSplits.race[profile.race]);
  if (profile.income) values.push(topic.demographicSplits.income[profile.income]);
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return mean - topic.nationalAvg;
}

/**
 * Deterministic mock "zip-level average" for a topic.
 * National average + per-zip seeded noise + urbanicity pull, then blended
 * toward the user's demographic cohorts. The more dims they share, the
 * stronger the cohort pull (capped).
 */
export function localBenchmark(
  zip: string,
  topic: Topic,
  profile?: Profile,
): LocalBenchmark {
  const key = (salt: string) => mulberry32(hash(`${zip}:${topic.id}:${salt}`));
  const density = zipDensity(zip);
  const urbanPull =
    topic.demographicSplits.urbanicity.urban -
    topic.demographicSplits.urbanicity.rural;

  // Count only the dims the user actually shared. (An empty `{}` profile is
  // still truthy, so testing `profile` itself would apply a cohort pull to
  // users who opted out of every question.)
  const dims = profile ? cohortCount(profile) : 0;
  const blend = Math.min(0.5, 0.17 * dims);

  const avg = clamp(
    topic.nationalAvg +
      (key("avg")() - 0.5) * 22 +
      (density - 0.5) * urbanPull +
      cohortOffset(topic, profile) * blend,
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
export function zipCodeAvg(zip: string, topic: Topic, profile?: Profile): number {
  return localBenchmark(zip, topic, profile).avg;
}