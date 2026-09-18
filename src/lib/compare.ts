import type { Answers, Profile, Topic } from "../types";
import { localBenchmark } from "./zipData";

export interface TopicComparison {
  topic: Topic;
  /** The user's locked stance, 1..100. */
  value: number;
  nationalAvg: number;
  localAvg: number;
  /** value − localAvg. Positive = further toward the right anchor than the ZIP. */
  vsLocal: number;
  /** value − nationalAvg. */
  vsNational: number;
}

export interface CohortComparison {
  rows: TopicComparison[];
  /** Mean |value − localAvg| across answered topics, 0..99. */
  avgLocalGap: number;
  /** Mean |value − nationalAvg| across answered topics. */
  avgNationalGap: number;
  /** Topics where the user sits >= OUTLIER_GAP from their ZIP, biggest first. */
  outliers: TopicComparison[];
  /** Topics within ALIGNED_GAP of their ZIP, closest first. */
  aligned: TopicComparison[];
  /** Answered topics where the user is to the right of their ZIP. */
  aboveLocal: number;
}

/** Points of divergence from the local benchmark that counts as an outlier. */
export const OUTLIER_GAP = 20;
/** Points of divergence at or under which the user reads as in step locally. */
export const ALIGNED_GAP = 8;

export function compareToCohort(
  topics: Topic[],
  answers: Answers,
  zip: string,
  profile: Profile,
): CohortComparison {
  const rows: TopicComparison[] = [];

  for (const topic of topics) {
    const value = answers[topic.id];
    if (value == null) continue; // untouched topics are not a stance
    const localAvg = localBenchmark(zip, topic, profile).avg;
    rows.push({
      topic,
      value,
      nationalAvg: topic.nationalAvg,
      localAvg,
      vsLocal: value - localAvg,
      vsNational: value - topic.nationalAvg,
    });
  }

  const n = rows.length;
  const mean = (pick: (r: TopicComparison) => number) =>
    n ? Math.round(rows.reduce((a, r) => a + Math.abs(pick(r)), 0) / n) : 0;

  return {
    rows,
    avgLocalGap: mean((r) => r.vsLocal),
    avgNationalGap: mean((r) => r.vsNational),
    outliers: rows
      .filter((r) => Math.abs(r.vsLocal) >= OUTLIER_GAP)
      .sort((a, b) => Math.abs(b.vsLocal) - Math.abs(a.vsLocal)),
    aligned: rows
      .filter((r) => Math.abs(r.vsLocal) <= ALIGNED_GAP)
      .sort((a, b) => Math.abs(a.vsLocal) - Math.abs(b.vsLocal)),
    aboveLocal: rows.filter((r) => r.vsLocal > 0).length,
  };
}

/** Human phrasing for a single divergence, e.g. "31 pts toward Strict Total Regulation". */
export function gapLabel(row: TopicComparison): string {
  const gap = Math.round(Math.abs(row.vsLocal));
  if (gap === 0) return "exactly on your ZIP's average";
  const anchor =
    row.vsLocal > 0 ? row.topic.rightAnchorLabel : row.topic.leftAnchorLabel;
  return `${gap} pt${gap === 1 ? "" : "s"} toward ${anchor}`;
}
