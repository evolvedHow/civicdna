/**
 * civicDNA — AI narrative endpoint (Cloudflare Workers + Workers AI)
 *
 * POST { zip, archetype, categoryScores, topics:[{topicName, value, nationalAvg, localAvg}] }
 *  -> 200 { narrative: string }
 *
 * The Workers AI token stays in this Worker; GitHub Pages just calls this URL.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*", // tighten to https://<user>.github.io for prod
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  // Authorization must be listed or the preflight rejects the very header
  // the CIVICDNA_AI_TOKEN gate below requires.
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

const JSON_CORS = { ...CORS, "Content-Type": "application/json" };

async function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const [da, db] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const xa = new Uint8Array(da);
  const ya = new Uint8Array(db);
  let d = 0;
  for (let i = 0; i < xa.length; i++) d |= xa[i] ^ ya[i];
  return d === 0;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "POST only" }), {
        status: 405,
        headers: { ...JSON_CORS, Allow: "POST, OPTIONS" },
      });
    }

    if (env.CIVICDNA_AI_TOKEN) {
      const ok = await timingSafeEqual(
        `Bearer ${env.CIVICDNA_AI_TOKEN}`,
        request.headers.get("Authorization") ?? "",
      );
      if (!ok) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: JSON_CORS,
        });
      }
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: JSON_CORS,
      });
    }

    // An unhandled throw here returns a bare 500 with NO CORS headers, which
    // the browser surfaces as an opaque network error rather than the real
    // failure. Catch it and answer in-protocol.
    try {
      const result = await env.AI.run("@cf/meta/llama-3.2-3b-instruct", {
        prompt: buildPrompt(payload),
        max_tokens: 600,
        temperature: 0.6,
      });

      return new Response(JSON.stringify({ narrative: result.response ?? "" }), {
        headers: JSON_CORS,
      });
    } catch (err) {
      console.error("AI.run failed", err);
      return new Response(
        JSON.stringify({ error: "Narrative generation failed" }),
        { status: 502, headers: JSON_CORS },
      );
    }
  },
};

function buildPrompt(p) {
  const lines = [
    "You are 'civicDNA', a neutral civic-data interpreter. Write a short, data-grounded narrative of this person's political-genome profile.",
    "Rules: neutral tone, no partisan cheerleading or slogans; cite the national and local (ZIP) averages numerically where relevant; identify where the person is an outlier vs. their community; close with a one-sentence persona line. 180-220 words total.",
    `Geography: U.S. ZIP ${p.zip ?? "unknown"}.`,
    `Suggested archetype (verify it against the data before using it): ${p.archetype ?? "unspecified"}.`,
    "Issue-by-issue stance (your score 1-100; national avg; local ZIP avg):",
    ...(p.topics ?? []).map(
      (t) =>
        `- ${t.topicName}: ${t.value}/100 (national ${t.nationalAvg}, local ${t.localAvg})`,
    ),
    "Category basket averages (radar axes, 0-100):",
    ...Object.entries(p.categoryScores ?? {}).map(
      ([k, v]) => `- ${k}: ${v}/100`,
    ),
  ];
  return lines.join("\n");
}