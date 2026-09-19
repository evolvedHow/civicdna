import topicsJson from "../data/topics.json";
import type { Topic } from "../types";

const ALL = topicsJson.topics as Topic[];

function withinWindow(t: Topic, now: Date): boolean {
  if (t.activeFrom && now < new Date(t.activeFrom)) return false;
  if (t.activeUntil && now > new Date(t.activeUntil)) return false;
  return true;
}

/**
 * Topics currently in the questionnaire. Archived topics and topics outside
 * their activeFrom/activeUntil window are excluded, but remain in ALL_TOPICS
 * so historical answers stay interpretable.
 *
 * Nothing anywhere asserts a specific count — the list can grow or shrink
 * with no code change (change request §9).
 */
export const TOPICS: Topic[] = ALL.filter(
  (t) => (t.topicStatus ?? "core") !== "archived" && withinWindow(t, new Date()),
);

/** Every topic ever defined, including archived ones. */
export const ALL_TOPICS: Topic[] = ALL;

export const TOPIC_SCALE = topicsJson.meta.scale;

/** A topic can only be benchmarked if it has validated data attached. */
export function hasBenchmark(
  topic: Topic,
): topic is Topic & { nationalAvg: number; demographicSplits: NonNullable<Topic["demographicSplits"]> } {
  return topic.nationalAvg != null && topic.demographicSplits != null;
}

export const TOPICS_WITH_BENCHMARK = TOPICS.filter(hasBenchmark);
