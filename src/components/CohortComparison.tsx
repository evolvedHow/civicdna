import type { CohortComparison as Comparison, TopicComparison } from "../lib/compare";
import { CATEGORY_META } from "../lib/categories";

interface Props {
  comparison: Comparison;
  zip: string;
  cohort: string;
  gapLabel: (row: TopicComparison) => string;
  outlierGap: number;
}

/** Three stacked markers on a shared 1..100 track: you, your ZIP, the nation. */
function Track({ row }: { row: TopicComparison }) {
  const pct = (v: number) => `${Math.max(0, Math.min(100, ((v - 1) / 99) * 100))}%`;
  const accent = CATEGORY_META[row.topic.category].accent;

  return (
    <div className="relative mt-2 h-8">
      <div className="absolute inset-x-0 top-3.5 h-1 rounded-full bg-slate-200" />
      {/* national */}
      <div
        className="absolute top-2 h-3 w-0.5 -translate-x-1/2 rounded bg-slate-400"
        style={{ left: pct(row.nationalAvg) }}
        title={`National average ${row.nationalAvg}`}
      />
      {/* local */}
      <div
        className="absolute top-1.5 h-4 w-1 -translate-x-1/2 rounded bg-teal-600"
        style={{ left: pct(row.localAvg) }}
        title={`Your ZIP average ${row.localAvg}`}
      />
      {/* you */}
      <div
        className="absolute top-0.5 h-6 w-2.5 -translate-x-1/2 rounded-full border-2 border-white shadow"
        style={{ left: pct(row.value), backgroundColor: accent }}
        title={`You ${row.value}`}
      />
    </div>
  );
}

export default function CohortComparison({
  comparison,
  zip,
  cohort,
  gapLabel,
  outlierGap,
}: Props) {
  const { rows, avgLocalGap, avgNationalGap, outliers, aligned, aboveLocal } =
    comparison;
  if (rows.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          You vs. your cohort
        </p>
        <p className="text-[10px] text-slate-400">
          ZIP {zip}
          {cohort ? ` · ${cohort}` : ""}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-teal-50 p-2.5">
          <p className="text-xl font-extrabold tabular-nums text-teal-900">
            {avgLocalGap}
          </p>
          <p className="text-[10px] leading-tight text-teal-700/80">
            avg pts from your ZIP
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-2.5">
          <p className="text-xl font-extrabold tabular-nums text-slate-900">
            {avgNationalGap}
          </p>
          <p className="text-[10px] leading-tight text-slate-500">
            avg pts from the nation
          </p>
        </div>
        <div className="rounded-xl bg-indigo-50 p-2.5">
          <p className="text-xl font-extrabold tabular-nums text-indigo-900">
            {outliers.length}
          </p>
          <p className="text-[10px] leading-tight text-indigo-700/80">
            local outlier{outliers.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-600">
        On {aboveLocal} of {rows.length} answered issue
        {rows.length === 1 ? "" : "s"} you sit further toward the regulating /
        collective pole than your neighbours;{" "}
        {aligned.length > 0
          ? `you are in step with them on ${aligned.length}.`
          : "you are not closely in step with them on any."}
      </p>

      <ul className="mt-3 space-y-3">
        {rows.map((row) => {
          const isOutlier = Math.abs(row.vsLocal) >= outlierGap;
          return (
            <li
              key={row.topic.id}
              className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">
                  {row.topic.topicName}
                </p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    isOutlier
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {isOutlier ? "outlier" : "in range"}
                </span>
              </div>
              <Track row={row} />
              <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500">
                <span>
                  <b className="text-slate-800">you {row.value}</b> · zip{" "}
                  {row.localAvg} · nat {row.nationalAvg}
                </span>
                <span className="shrink-0 text-right">{gapLabel(row)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
