import type { Profile, Topic } from "../types";
import { CATEGORY_META } from "../lib/categories";
import { localBenchmark, cohortOffset } from "../lib/zipData";
import { hasBenchmark } from "../lib/topics";
import { cohortLabel } from "../lib/profile";
import { MAX_DISTANCE, IMPORTANCE, SCORE } from "../lib/config";
import type { TopicWeightShare } from "../lib/genome";

interface IssueCardProps {
  topic: Topic;
  /** How much of the composite this question carries, disclosed on the card. */
  weight: TopicWeightShare;
  zip: string;
  profile: Profile;
  /** Current value from the store (1..100). */
  value: number;
  /** Importance rating, 0..IMPORTANCE.max. Defaults to IMPORTANCE.default. */
  rating: number;
  /** True once the respondent has explicitly set a rating. */
  ratingSet: boolean;
  /** True once the user actually moved this topic's slider. */
  touched: boolean;
  index: number;
  total: number;
  onStanceChange: (value: number) => void;
  onRatingChange: (value: number) => void;
}

const NEUTRAL_BAND = 4;

const DEMOGRAPHIC_BARS: {
  label: string;
  color: string;
  pick: (d: NonNullable<Topic["demographicSplits"]>) => number | null;
}[] = [
  { label: "Men", color: "#64748b", pick: (d) => d.gender?.men ?? null },
  { label: "Women", color: "#334155", pick: (d) => d.gender?.women ?? null },
  { label: "White", color: "#94a3b8", pick: (d) => d.race?.white ?? null },
  { label: "Black", color: "#475569", pick: (d) => d.race?.black ?? null },
  { label: "Hispanic", color: "#818cf8", pick: (d) => d.race?.hispanic ?? null },
  { label: "Asian", color: "#38bdf8", pick: (d) => d.race?.asian ?? null },
  { label: "Income under $40K", color: "#a3e635", pick: (d) => d.income?.lt40k ?? null },
  { label: "Income $40K–$80K", color: "#84cc16", pick: (d) => d.income?._40to80k ?? null },
  { label: "Income $80K–$150K", color: "#65a30d", pick: (d) => d.income?._80to150k ?? null },
  { label: "Income $150K+", color: "#4d7c0f", pick: (d) => d.income?.gt150k ?? null },
];

function MiniBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-[11px] font-medium text-slate-500">
          {label}
        </span>
        <span className="shrink-0 text-[11px] font-bold tabular-nums text-slate-800">
          {value}%
        </span>
      </div>
      <div className="mt-0.5 h-1 rounded-full bg-slate-200/80">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, value)}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

export default function IssueCard({
  topic,
  weight,
  zip,
  profile,
  value,
  rating,
  ratingSet,
  touched,
  index,
  total,
  onStanceChange,
  onRatingChange,
}: IssueCardProps) {
  const meta = CATEGORY_META[topic.category];
  const benchmarked = hasBenchmark(topic);
  const local = localBenchmark(zip, topic, profile);
  const label = cohortLabel(profile);
  const cohortActive = cohortOffset(topic, profile).n > 0;

  const splits = topic.demographicSplits;
  const reportedBars = DEMOGRAPHIC_BARS.map((bar) => ({
    ...bar,
    value: splits ? bar.pick(splits) : null,
  })).filter((bar): bar is typeof bar & { value: number } => bar.value != null);

  const positionText = `of Americans lean toward "${topic.rightAnchorLabel}"`;
  const localText = `estimated residents in your area lean toward "${topic.rightAnchorLabel}"`;

  const off = value - SCORE.neutral;
  const towardLeft = off < 0;
  const strength = Math.round((Math.abs(off) / MAX_DISTANCE) * 100);
  const position =
    Math.abs(off) <= NEUTRAL_BAND
      ? `Neutral midpoint · exactly on ${SCORE.neutral}`
      : `${strength}% toward ${towardLeft ? topic.leftAnchorLabel : topic.rightAnchorLabel}`;

  const span = SCORE.max - SCORE.min;
  const fill = span > 0 ? ((value - SCORE.min) / span) * 100 : 0;

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="px-5 pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Issue {index + 1} of {total}
          </span>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${meta.chip}`}
          >
            {meta.label}
          </span>
        </div>
      </header>

      <section className="px-5 pt-3">
        <h2 className="text-xl font-bold leading-snug text-slate-900">
          {topic.topicName}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          {topic.description}
        </p>
      </section>

      {/* Weighting disclosure. The composite is a product of two averages, so a
          question's share of it factors exactly into
          `categoryShare x withinCategory` — shown here as both numbers rather
          than one, so a weighted result can be checked instead of trusted. */}
      <section
        className={`mx-5 mt-4 rounded-2xl border p-3.5 transition ${
          weight.share > 0
            ? "border-slate-200 bg-slate-50/80"
            : "border-rose-200 bg-rose-50"
        }`}
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            How much this counts
          </span>
          <span
            className={`shrink-0 text-[11px] font-bold tabular-nums ${
              weight.share > 0 ? "text-slate-700" : "text-rose-700"
            }`}
          >
            {weight.share > 0
              ? `${(weight.share * 100).toFixed(1)}% of your score`
              : "Not counted"}
          </span>
        </div>
        {weight.share > 0 && (
          <>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${weight.withinCategory * 100}%`,
                  backgroundColor: meta.accent,
                }}
              />
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
              {(weight.withinCategory * 100).toFixed(0)}% of the weight inside{" "}
              {meta.label}, which is itself{" "}
              {(weight.categoryShare * 100).toFixed(1)}% of your score · issue
              weight ×{weight.topicWeight}
              {ratingSet && ` · rated ${rating}`}. This is the
              full-question-bank share — leave whole categories blank and the
              remaining ones absorb their weight.
            </p>
          </>
        )}
        {weight.share === 0 && (
          <p className="mt-1.5 text-[10px] leading-relaxed text-rose-700">
            {IMPORTANCE.excludedNote}
          </p>
        )}
      </section>

      {/* Data context panel — only rendered when real data backs it. */}
      {benchmarked && local ? (
        <section className="mx-5 mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-1">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Data context
            </h3>
            <span className="text-[10px] text-slate-400">{topic.source}</span>
          </div>

          <div className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              National average
            </p>
            <p className="mt-1 flex items-end gap-2">
              <span className="text-2xl font-extrabold tabular-nums text-slate-900">
                {topic.nationalAvg}%
              </span>
              <span className="pb-0.5 text-xs leading-tight text-slate-500">
                {positionText}
              </span>
            </p>
          </div>

          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Demographic breakdown
            </p>
            {reportedBars.length > 0 ? (
              <>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {reportedBars.map((bar) => (
                    <MiniBar
                      key={bar.label}
                      label={bar.label}
                      value={bar.value}
                      color={bar.color}
                    />
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-slate-400">
                  Only the subgroups the cited survey reports are shown.
                </p>
              </>
            ) : (
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                The cited survey does not publish demographic crosstabs for
                this issue, so there is nothing to break the national figure
                down by.
              </p>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-teal-600" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-teal-700">
                Local benchmark · ZIP {zip}
              </p>
            </div>
            <p className="mt-2 flex items-end gap-2">
              <span className="text-2xl font-extrabold tabular-nums text-teal-900">
                {local.avg}%
              </span>
              <span className="pb-0.5 text-xs leading-tight text-teal-800/80">
                {localText}
              </span>
            </p>
            {label && cohortActive && (
              <p className="mt-1.5 text-[11px] font-medium text-teal-700/80">
                Cohort-tuned against: {label} — your local figure is blended
                toward their published leanings on this issue.
              </p>
            )}
          </div>
        </section>
      ) : (
        <section className="mx-5 mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Data context
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            No validated benchmark for this issue yet, so there is nothing to
            compare you against here. Your answer is still recorded and still
            counts toward your score — it just won't appear in the cohort
            comparison until real survey data is attached.
          </p>
        </section>
      )}

      {/* Stance slider */}
      <div className="px-5 pt-5">
        <div className="text-center">
          <div className="text-4xl font-extrabold tabular-nums text-slate-900">
            {value}
          </div>
          <div className="mt-1 text-xs font-medium text-slate-500">
            {touched
              ? position
              : "Neutral default · move the slider to record your stance"}
          </div>
        </div>

        <input
          type="range"
          min={SCORE.min}
          max={SCORE.max}
          step={1}
          value={value}
          aria-label={`Your position on ${topic.topicName}`}
          onChange={(e) => onStanceChange(Number(e.target.value))}
          className="dna-range mt-4"
          style={{
            background: `linear-gradient(to right, ${meta.accent} 0%, ${meta.accent} ${fill}%, #e2e8f0 ${fill}%, #e2e8f0 100%)`,
          }}
        />

        <div className="mt-1.5 flex items-start justify-between gap-2 text-[11px] leading-snug">
          <span className="w-24 font-medium text-slate-500">
            {SCORE.min} · {topic.leftAnchorLabel}
          </span>
          <span className="pt-0.5 text-center font-medium text-slate-400">
            {SCORE.neutral} · Neutral
          </span>
          <span className="w-24 text-right font-medium text-slate-500">
            {topic.rightAnchorLabel} · {SCORE.max}
          </span>
        </div>
      </div>

      {/* Importance rating — the second input, and the only one that changes
          how much the first one is worth. Sits directly under the slider so the
          effect on the "how much this counts" block above is obvious. */}
      {IMPORTANCE.enabled && (
        <div className="mx-5 mt-5 rounded-2xl border border-slate-200 bg-white p-3.5">
          <div className="flex items-baseline justify-between gap-2">
            <span
              id={`importance-label-${topic.id}`}
              className="text-[11px] font-semibold text-slate-700"
            >
              {IMPORTANCE.prompt}
            </span>
            {!ratingSet && (
              <span className="text-[10px] text-slate-400">
                default {IMPORTANCE.default}
              </span>
            )}
          </div>

          <div
            role="radiogroup"
            aria-labelledby={`importance-label-${topic.id}`}
            className="mt-2.5 grid grid-cols-6 gap-1.5"
          >
            {Array.from({ length: IMPORTANCE.max + 1 }, (_, r) => {
              const active = rating === r;
              return (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onRatingChange(r)}
                  className={`h-10 rounded-xl text-sm font-bold tabular-nums transition ${
                    active
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>

          <div className="mt-1.5 flex items-baseline justify-between text-[10px] text-slate-400">
            <span>0 · {IMPORTANCE.lowLabel}</span>
            <span>
              {IMPORTANCE.max} · {IMPORTANCE.highLabel}
            </span>
          </div>

          <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
            This scales how much the question counts — it does not change where
            you sit on the issue.
          </p>
        </div>
      )}

      <footer className="px-5 pb-6 pt-4">
        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] font-medium text-slate-400">
          Saved as you drag <span aria-hidden>↓</span> scroll for the next issue
        </p>
      </footer>
    </article>
  );
}