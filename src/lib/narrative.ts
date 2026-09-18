import type { Badge, Category, Topic } from "../types";
import type { TopicComparison } from "./compare";

/**
 * Cloudflare Worker that owns the Workers AI binding, e.g.
 * https://civicdna-narrative.<subdomain>.workers.dev
 * Unset (the default) = the AI read-out is skipped entirely and the
 * deterministic local read-out is all the user sees.
 */
const NARRATIVE_URL = (import.meta.env.VITE_NARRATIVE_URL ?? "").trim();

/**
 * Optional bearer token matching the Worker's CIVICDNA_AI_TOKEN.
 *
 * NOTE: anything with a VITE_ prefix is inlined into the public bundle, so
 * this is a speed bump against drive-by abuse, NOT a secret. Real protection
 * comes from pinning Access-Control-Allow-Origin in the Worker.
 */
const NARRATIVE_TOKEN = (import.meta.env.VITE_NARRATIVE_TOKEN ?? "").trim();

const TIMEOUT_MS = 20_000;

export const narrativeEnabled = NARRATIVE_URL !== "";

export interface NarrativeRequest {
  zip: string;
  badge: Badge;
  perCategory: Partial<Record<Category, number>>;
  rows: TopicComparison[];
}

/** Matches the Worker's documented POST body exactly. */
function toPayload({ zip, badge, perCategory, rows }: NarrativeRequest) {
  return {
    zip,
    archetype: badge.name,
    categoryScores: perCategory,
    topics: rows.map((r: { topic: Topic; value: number; nationalAvg: number; localAvg: number }) => ({
      topicName: r.topic.topicName,
      value: r.value,
      nationalAvg: r.nationalAvg,
      localAvg: r.localAvg,
    })),
  };
}

/**
 * Fetch the AI read-out. Throws on any failure so the caller can fall back to
 * the deterministic local read-out — this is an enhancement, never a gate.
 *
 * @param signal caller's abort signal (unmount / result change)
 */
export async function fetchNarrative(
  req: NarrativeRequest,
  signal?: AbortSignal,
): Promise<string> {
  if (!narrativeEnabled) throw new Error("Narrative endpoint not configured");

  // Race the caller's signal against our own timeout.
  const timer = new AbortController();
  const timeout = setTimeout(() => timer.abort(), TIMEOUT_MS);
  const onAbort = () => timer.abort();
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    const res = await fetch(NARRATIVE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(NARRATIVE_TOKEN
          ? { Authorization: `Bearer ${NARRATIVE_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(toPayload(req)),
      signal: timer.signal,
    });

    if (!res.ok) {
      const detail = await res.json().catch(() => null);
      throw new Error(detail?.error ?? `Narrative endpoint returned ${res.status}`);
    }

    const data = await res.json();
    const text = typeof data?.narrative === "string" ? data.narrative.trim() : "";
    if (!text) throw new Error("Narrative endpoint returned an empty response");
    return text;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", onAbort);
  }
}
