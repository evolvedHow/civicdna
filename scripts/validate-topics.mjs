#!/usr/bin/env node
/**
 * Validation suite for the topic framework (change request §13).
 * Plain Node, no test framework. Runs as part of `npm run build`.
 */
import fs from "node:fs";
import { parse } from "yaml";

const topicsDoc = JSON.parse(fs.readFileSync("src/data/topics.json", "utf8"));
const config = parse(fs.readFileSync("src/data/config.yaml", "utf8"));

const failures = [];
const warnings = [];
const fail = (m) => failures.push(m);
const warn = (m) => warnings.push(m);

const { meta, topics } = topicsDoc;
const active = topics.filter((t) => (t.topicStatus ?? "core") !== "archived");
const VALID_STATUS = ["core", "current", "emerging", "archived"];
const VALID_CATEGORIES = Object.keys(config.scoring?.categoryWeights ?? {});

// ---------------------------------------------------------------- schema ---
const seen = new Set();
for (const t of topics) {
  const at = `topic "${t.id ?? "<missing id>"}"`;
  if (!t.id) fail(`${at}: missing id`);
  if (seen.has(t.id)) fail(`${at}: duplicate id`);
  seen.add(t.id);

  if (!t.topicName) fail(`${at}: missing topicName`);
  if (!t.description) fail(`${at}: missing description`);
  if (!t.leftAnchorLabel) fail(`${at}: missing leftAnchorLabel`);
  if (!t.rightAnchorLabel) fail(`${at}: missing rightAnchorLabel`);
  if (t.leftAnchorLabel === t.rightAnchorLabel)
    fail(`${at}: anchors are identical`);

  if (typeof t.weight !== "number" || !(t.weight > 0))
    fail(`${at}: weight must be a number > 0 (got ${JSON.stringify(t.weight)})`);

  if (!VALID_CATEGORIES.includes(t.category))
    fail(`${at}: category "${t.category}" has no weight in config.yaml`);

  if (t.topicStatus && !VALID_STATUS.includes(t.topicStatus))
    fail(`${at}: invalid topicStatus "${t.topicStatus}"`);

  // §4 — partial data is worse than none: a nationalAvg with no source is an
  // uncitable claim, and splits without an average cannot be interpreted.
  // Demographic cells may be null (the cited survey didn't publish that
  // subgroup) but every non-null figure must land on the scale.
  const hasAvg = t.nationalAvg != null;
  const hasSplits = t.demographicSplits != null;
  const hasSource = t.source != null && t.source !== "";
  if (hasAvg !== hasSplits)
    fail(`${at}: nationalAvg and demographicSplits must be provided together`);
  if (hasAvg && !hasSource)
    fail(`${at}: has nationalAvg but no source — never publish uncited figures`);
  if (hasAvg && (t.nationalAvg < meta.scale.min || t.nationalAvg > meta.scale.max))
    fail(`${at}: nationalAvg ${t.nationalAvg} outside scale`);

  let reportedCells = 0;
  if (hasSplits) {
    for (const [dim, entries] of Object.entries(t.demographicSplits)) {
      if (entries == null) continue; // whole dimension unpublished
      for (const [k, v] of Object.entries(entries)) {
        if (v == null) continue; // single subgroup unpublished
        reportedCells += 1;
        if (typeof v !== "number" || v < meta.scale.min || v > meta.scale.max)
          fail(`${at}: ${dim}.${k} = ${v} outside scale`);
      }
    }
    if (reportedCells === 0)
      warn(`${at}: benchmark attached but no demographic cell is reported — cohort comparisons will show no data`);
  }
}

// ----------------------------------------------------------------- scale ---
const { min, max, neutral } = meta.scale;
if (min !== 0) fail(`scale.min must be 0 (got ${min})`);
if (max !== 100) fail(`scale.max must be 100 (got ${max})`);
if (neutral !== (min + max) / 2)
  fail(`scale.neutral must be the exact midpoint ${(min + max) / 2} (got ${neutral})`);

const cfgScore = config.score ?? {};
for (const key of ["min", "max", "neutral"]) {
  if (cfgScore[key] !== meta.scale[key])
    fail(`config.yaml score.${key} (${cfgScore[key]}) != topics.json scale.${key} (${meta.scale[key]})`);
}

// ------------------------------------------------------------------ meta ---
if (meta.totalTopics !== active.length)
  fail(`meta.totalTopics ${meta.totalTopics} != ${active.length} active topics`);
if (active.length < 15 || active.length > 30)
  warn(`${active.length} active topics is outside the 20-25 editorial target`);

// --------------------------------------------------------------- scoring ---
// Every live category must be reachable, or a radar axis is dead weight.
for (const cat of VALID_CATEGORIES) {
  if (!active.some((t) => t.category === cat))
    warn(`category "${cat}" has a weight but no active topics`);
}
for (const [cat, w] of Object.entries(config.scoring?.categoryWeights ?? {})) {
  if (typeof w !== "number" || !(w > 0))
    fail(`categoryWeights.${cat} must be a number > 0`);
}
if (config.scoring?.useSalience === true)
  warn("scoring.useSalience is ON — this changes the meaning of historical composite scores");

// ------------------------------------------------------------ badge bands ---
const bands = [...(config.badges ?? [])].sort((a, b) => a.min - b.min);
if (bands.length === 0) fail("config.yaml defines no badge bands");
let cursor = min;
for (const b of bands) {
  if (b.min !== cursor)
    fail(`badge band "${b.id}" starts at ${b.min}, expected ${cursor} (gap or overlap)`);
  if (b.max < b.min) fail(`badge band "${b.id}" has max < min`);
  cursor = b.max + 1;
}
if (cursor !== max + 1)
  fail(`badge bands stop at ${cursor - 1}, expected full coverage to ${max}`);

// -------------------------------------------------------------- editorial ---
// Flag topics whose names collide enough to suggest a redundant measurement.
const STOP = new Set(["and", "the", "of", "&", "in", "for", "a", "to"]);
const words = (t) =>
  new Set(
    t.topicName.toLowerCase().split(/[^a-z]+/).filter((w) => w && !STOP.has(w)),
  );
for (let i = 0; i < active.length; i++) {
  for (let j = i + 1; j < active.length; j++) {
    const a = words(active[i]);
    const b = words(active[j]);
    const shared = [...a].filter((w) => b.has(w));
    if (shared.length >= 2)
      warn(
        `"${active[i].topicName}" and "${active[j].topicName}" share terms [${shared.join(", ")}] — confirm they measure different beliefs`,
      );
  }
}

// ------------------------------------------------------------------ report ---
for (const w of warnings) console.warn(`  warn  ${w}`);
for (const f of failures) console.error(`  FAIL  ${f}`);

const benchmarked = active.filter((t) => t.nationalAvg != null).length;
console.log(
  `\ntopics: ${active.length} active, ${topics.length - active.length} archived` +
    ` · benchmark data on ${benchmarked}/${active.length}` +
    ` · badge bands: ${bands.length}` +
    ` · ${warnings.length} warning(s), ${failures.length} failure(s)`,
);

if (failures.length) {
  console.error("\ntopic validation FAILED");
  process.exit(1);
}
console.log("topic validation passed");
