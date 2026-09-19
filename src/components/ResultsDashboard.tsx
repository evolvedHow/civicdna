import { useCallback, useMemo, useState } from "react";
import type { Category } from "../types";
import { TOPICS as topics } from "../lib/topics";
import { CATEGORY_META, CATEGORY_ORDER } from "../lib/categories";
import { computeGenome } from "../lib/genome";
import {
  BRAND,
  DECISIVENESS,
  findBadge,
  SCORE,
  SHARE_TEMPLATE,
} from "../lib/config";
import { fill } from "../lib/template";
import { compareToCohort, gapLabel, OUTLIER_GAP } from "../lib/compare";
import { cohortLabel } from "../lib/profile";
import {
  canShareFile,
  downloadBlob,
  renderBadgeImage,
} from "../lib/badgeImage";
import { useAppStore } from "../store/useAppStore";
import { FingerprintGem } from "./icons";
import BadgeCard from "./BadgeCard";
import CohortComparison from "./CohortComparison";
import NarrativePanel from "./NarrativePanel";
import WeightingPanel from "./WeightingPanel";

export default function ResultsDashboard() {
  const zip = useAppStore((s) => s.zip);
  const profile = useAppStore((s) => s.profile);
  const answers = useAppStore((s) => s.answers);
  const setScreen = useAppStore((s) => s.setScreen);
  const reset = useAppStore((s) => s.reset);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const genome = useMemo(() => computeGenome(topics, answers), [answers]);
  const badge = useMemo(() => findBadge(genome.index), [genome.index]);
  const comparison = useMemo(
    () => compareToCohort(topics, answers, zip, profile),
    [answers, zip, profile],
  );
  const cohort = useMemo(() => cohortLabel(profile), [profile]);

  const activeCategories = useMemo(
    () => CATEGORY_ORDER.filter((c) => genome.perCategory[c] != null),
    [genome.perCategory],
  );

  const leanCategory = useMemo(() => {
    let best: Category | null = null;
    let bestD = 0;
    for (const c of CATEGORY_ORDER) {
      const v = genome.perCategory[c];
      if (v == null) continue;
      const d = Math.abs(v - 50);
      if (d > bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }, [genome.perCategory]);

  /** Every copy template in config.yaml resolves against these. */
  const vars = useMemo(
    () => ({
      score: genome.index,
      suffix: SCORE.suffix,
      scoreLabel: SCORE.label,
      badge: badge.name,
      tagline: badge.tagline,
      decisive: genome.decisive,
      decisiveLabel: DECISIVENESS.label,
      avgDistance: genome.avgDistance,
      answered: genome.answered,
      total: genome.total,
      zip,
      brand: BRAND.name,
      url: BRAND.shareUrl,
    }),
    [genome, badge, zip],
  );

  // Per-band override falls back to the global template.
  const explanation = useMemo(
    () => fill(badge.explanation ?? DECISIVENESS.explanation, vars),
    [badge, vars],
  );

  const decisiveCaption = useMemo(
    () => fill(DECISIVENESS.caption, vars),
    [vars],
  );

  const narrative = useMemo(() => {
    const lean = leanCategory
      ? ` with the strongest tilt toward ${CATEGORY_META[leanCategory].label.toLowerCase()}`
      : "";
    const local = comparison.rows.length
      ? ` You sit an average of ${comparison.avgLocalGap} pts from your ZIP ${zip} benchmark`
      : "";
    const out = comparison.outliers.length
      ? `, and you are a clear outlier locally on ${comparison.outliers.length} of ${comparison.rows.length} issues.`
      : local
        ? "."
        : "";
    return `Your ${SCORE.label} is ${genome.index}${SCORE.suffix}, held at ${genome.decisive}% ${DECISIVENESS.label}${lean} — ${badge.name}: "${badge.tagline}".${local}${out}`;
  }, [genome, leanCategory, badge, comparison, zip]);

  const shareText = useMemo(
    () => fill(badge.shareText ?? SHARE_TEMPLATE, vars),
    [badge, vars],
  );

  const topicWeights = useMemo(
    () =>
      topics.map((t) => ({
        id: t.id,
        name: t.topicName,
        category: t.category,
        weight: t.weight ?? 1,
      })),
    [],
  );

  const buildImage = useCallback(
    () =>
      renderBadgeImage({
        badge,
        score: genome.index,
        decisive: genome.decisive,
        decisiveCaption,
        scoreLabel: SCORE.label,
        zip,
        cohort,
        perCategory: genome.perCategory,
      }),
    [badge, genome, zip, cohort, decisiveCaption],
  );

  const filename = `civicdna-${badge.id}-${genome.index}.png`;

  const copySummary = async () => {
    setShareError(null);
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setShareError("Clipboard is blocked here — select and copy manually.");
    }
  };

  const shareBadge = async () => {
    setShareError(null);
    setBusy(true);
    try {
      const blob = await buildImage();
      const file = blob
        ? new File([blob], filename, { type: "image/png" })
        : null;

      // Best: share the badge image itself. Then: share text. Then: download.
      if (file && canShareFile(file)) {
        await navigator.share({ title: BRAND.name, text: shareText, files: [file] });
      } else if (typeof navigator.share === "function") {
        await navigator.share({
          title: BRAND.name,
          text: shareText,
          url: BRAND.shareUrl || undefined,
        });
      } else if (blob) {
        downloadBlob(blob, filename);
      } else {
        setShareError("Badge image could not be generated in this browser.");
      }
    } catch (err) {
      // AbortError = the user dismissed the share sheet; not a failure.
      if (!(err instanceof Error) || err.name !== "AbortError") {
        setShareError("Sharing failed — try downloading the badge instead.");
      }
    } finally {
      setBusy(false);
    }
  };

  const downloadBadge = async () => {
    setShareError(null);
    setBusy(true);
    try {
      const blob = await buildImage();
      if (blob) downloadBlob(blob, filename);
      else setShareError("Badge image could not be generated in this browser.");
    } finally {
      setBusy(false);
    }
  };

  // Nothing to score yet — send them back rather than badging a phantom 50.
  if (genome.answered === 0) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 pb-20 pt-6 text-slate-900">
        <div className="mx-auto max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold">No stances recorded yet</h1>
          <p className="text-sm text-slate-600">
            Your {BRAND.name} index is built from the positions you actually
            set.
            Move at least one slider and your fingerprint will appear here.
          </p>
          <button
            type="button"
            onClick={() => setScreen("quiz")}
            className="h-12 w-full rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            Set my stances
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 pb-20 pt-6 text-slate-900">
      <div className="mx-auto max-w-md space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600">
              {BRAND.name}
            </p>
            <h1 className="mt-1 text-2xl font-bold leading-tight text-slate-900">
              Your Genome
            </h1>
          </div>
          <div className="flex h-11 items-center gap-2 rounded-full bg-white px-3.5 shadow-sm ring-1 ring-slate-200">
            <FingerprintGem />
            <span className="text-sm font-extrabold tabular-nums text-slate-900">
              {genome.index}
              <span className="text-xs font-semibold text-slate-400">
                {SCORE.suffix}
              </span>
            </span>
          </div>
        </header>

        {genome.answered < genome.total && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
            <p className="text-xs font-semibold text-amber-900">
              Provisional score — {genome.answered} of {genome.total} issues
              answered
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-amber-800/80">
              Untouched issues are left out of the maths rather than counted as
              neutral, so your index reflects only the positions you set.
            </p>
          </div>
        )}

        <BadgeCard
          badge={badge}
          score={genome.index}
          decisive={genome.decisive}
          avgDistance={genome.avgDistance}
          answered={genome.answered}
          total={genome.total}
          explanation={explanation}
        />

        {/* Category breakdown */}
        {activeCategories.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Basket averages
            </p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {activeCategories.map((c) => {
                const meta = CATEGORY_META[c];
                const v = genome.perCategory[c]!;
                return (
                  <div key={c} className="rounded-xl bg-slate-50 p-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${meta.chip}`}
                    >
                      {meta.label}
                    </span>
                    <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-slate-900">
                      {v}
                      <span className="text-xs text-slate-400">/100</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Weighting is disclosed only here, after the badge exists. */}
        <WeightingPanel
          breakdown={genome.breakdown}
          topicWeights={topicWeights}
        />

        <CohortComparison
          comparison={comparison}
          zip={zip}
          cohort={cohort}
          gapLabel={gapLabel}
          outlierGap={OUTLIER_GAP}
        />

        {/* Narrative — deterministic locally, enriched by the Worker when configured */}
        <NarrativePanel
          localNarrative={narrative}
          zip={zip}
          badge={badge}
          perCategory={genome.perCategory}
          rows={comparison.rows}
        />

        {/* Share + actions */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Share your badge
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Generates a 1080×1350 PNG of your fingerprint badge — shared through
            your device's share sheet, or saved to your downloads.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={shareBadge}
              disabled={busy}
              className="h-10 rounded-xl bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {busy ? "Rendering…" : "Share badge"}
            </button>
            <button
              type="button"
              onClick={downloadBadge}
              disabled={busy}
              className="h-10 rounded-xl bg-slate-800 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              Download PNG
            </button>
          </div>
          <button
            type="button"
            onClick={copySummary}
            className="mt-2 h-10 w-full rounded-xl bg-white text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:text-indigo-700"
          >
            {copied ? "Copied!" : "Copy text summary"}
          </button>
          {shareError && (
            <p className="mt-2 text-[11px] font-medium text-amber-600">
              {shareError}
            </p>
          )}
        </section>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setScreen("quiz")}
            className="h-12 flex-1 rounded-xl bg-white text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:text-indigo-700"
          >
            Back to stances
          </button>
          <button
            type="button"
            onClick={reset}
            className="h-12 flex-1 rounded-xl py-2 text-sm font-medium text-slate-400 transition hover:text-slate-600"
          >
            Reset
          </button>
        </div>
      </div>
    </main>
  );
}
