import type { CategoryBreakdown } from "../lib/genome";
import { CATEGORY_META } from "../lib/categories";
import { SCORE } from "../lib/config";

interface Props {
  breakdown: CategoryBreakdown[];
  /** Per-topic salience weights, revealed alongside the category weights. */
  topicWeights: { id: string; name: string; category: string; weight: number }[];
}

/**
 * Deliberately NOT shown during the quiz. Seeing that an issue counts 1.3x
 * while answering it invites gaming the score, so the weighting is only
 * disclosed once the badge has been generated and the answers are locked in.
 */
export default function WeightingPanel({ breakdown, topicWeights }: Props) {
  const live = breakdown.filter((b) => b.answered > 0);
  if (live.length === 0) return null;

  const uneven = topicWeights.some((t) => t.weight !== 1);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        How your score was weighted
      </p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        Your index is not a flat average. Topics are first averaged inside
        their category, then the categories are combined by the weights below —
        so a category with more questions in it doesn't automatically count for
        more.
      </p>

      <ul className="mt-3 space-y-2">
        {live.map((b) => {
          const meta = CATEGORY_META[b.category];
          const pct = Math.round(b.share * 100);
          return (
            <li key={b.category} className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${meta.chip}`}
                >
                  {meta.label}
                </span>
                <span className="text-[11px] font-semibold tabular-nums text-slate-700">
                  {pct}% of your index
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: meta.accent }}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-slate-400">
                weight {b.weight} · scored {b.score}
                {SCORE.suffix} from {b.answered} of {b.total} issue
                {b.total === 1 ? "" : "s"} answered
              </p>
            </li>
          );
        })}
      </ul>

      {live.length < breakdown.length && (
        <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
          Categories you answered nothing in are dropped, and the remaining
          weights re-normalise to 100%.
        </p>
      )}

      {uneven && (
        <details className="mt-3 rounded-xl bg-slate-50 p-3">
          <summary className="cursor-pointer text-[11px] font-semibold text-slate-700">
            Per-issue salience weights
          </summary>
          <ul className="mt-2 space-y-1">
            {topicWeights.map((t) => (
              <li
                key={t.id}
                className="flex items-baseline justify-between gap-2 text-[10px]"
              >
                <span className="min-w-0 flex-1 truncate text-slate-500">
                  {t.name}
                </span>
                <span
                  className={`shrink-0 tabular-nums ${
                    t.weight === 1
                      ? "text-slate-400"
                      : "font-semibold text-slate-700"
                  }`}
                >
                  ×{t.weight}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
            These set how much each issue counts against its siblings within
            the same category. Hidden during the quiz so they can't steer your
            answers.
          </p>
        </details>
      )}
    </section>
  );
}
