import { useState } from "react";
import type { Spectrum } from "../lib/genome";
import { BANDS, bandShortLabel } from "../lib/spectrum";
import { SCORE, SPECTRUM } from "../lib/config";

interface Props {
  spectrum: Spectrum;
}

/**
 * The headline result: the same weighted answers the composite index is built
 * from, shown as a five-band distribution rather than one coordinate.
 *
 * "60/100 at 44% decisive" asks the reader to do two divisions and then trust
 * the result. Percentages that sum to 100, each attached to the issues that
 * produced it, can be checked by eye — which is the point, since the whole
 * questionnaire is weighted and the weighting is not neutral.
 *
 * Deliberately not collapsed to a single verdict: a moderate result and a
 * polarized one are different answers, and a single score hides that.
 */
export default function SpectrumPanel({ spectrum }: Props) {
  const [openBand, setOpenBand] = useState<number | null>(null);

  const { bands, dominant, tilt, tiltText, even, answered, total } = spectrum;
  const sub = even
    ? `As much of your weight sits at the ${SPECTRUM.lowLabel.toLowerCase()} end as at the ${SPECTRUM.highLabel.toLowerCase()} end.`
    : dominant.count > 0
      ? `The single largest share of what you weighed — ${dominant.pct}% across ${dominant.count} issue${dominant.count === 1 ? "" : "s"}.`
      : "Move a slider and the shape appears here.";

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="px-5 pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
          Your spectrum
        </p>
        <h2 className="mt-1.5 text-3xl font-extrabold leading-tight text-slate-900">
          {spectrum.headline}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{sub}</p>
      </div>

      {/* Five-segment distribution. Segments stay in place as answers change so
          the shape can be compared against a previous run. */}
      <div className="mt-5 px-5">
        <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
          {bands.map((b) => (
            <div
              key={b.band}
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${b.pct}%`,
                backgroundColor: BANDS[b.band].color,
                opacity: b.count > 0 ? 1 : 0.18,
              }}
            />
          ))}
        </div>

        <dl className="mt-2.5 grid grid-cols-5 gap-1">
          {bands.map((b) => (
            <div key={b.band} className="min-w-0 text-center">
              <dt className="truncate text-[9px] font-medium leading-tight text-slate-400">
                {bandShortLabel(b.band)}
              </dt>
              <dd
                className={`text-base font-extrabold tabular-nums ${BANDS[b.band].text}`}
              >
                {b.pct}%
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Signed single-number read-out, for anyone who does want one. */}
      <div className="mt-4 px-5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Net tilt
          </span>
          <span className="text-[11px] font-semibold text-slate-600">
            {tilt > 0 ? "+" : ""}
            {tilt} · {tiltText}
          </span>
        </div>
        <div className="relative mt-2 h-1.5 rounded-full bg-slate-200">
          <div className="absolute left-1/2 top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded bg-slate-400" />
          <div
            className="absolute top-0 h-1.5 rounded-full transition-all duration-500"
            style={{
              backgroundColor: tilt < 0 ? BANDS[1].color : BANDS[3].color,
              left: tilt < 0 ? `${50 - Math.abs(tilt) / 2}%` : "50%",
              width: `${Math.abs(tilt) / 2}%`,
            }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[9px] text-slate-400">
          <span>{SPECTRUM.lowLabel}</span>
          <span>
            neutral {SCORE.neutral}
          </span>
          <span>{SPECTRUM.highLabel}</span>
        </div>
      </div>

      {/* Per-band breakdown. Each row names the issues that produced it using
          their own anchor wording, so the generic band labels never have to do
          the work of describing a specific policy question. */}
      <div className="mt-5 border-t border-slate-100">
        {bands.map((b) => {
          const open = openBand === b.band;
          const meta = BANDS[b.band];
          return (
            <div key={b.band} className="border-b border-slate-100 last:border-0">
              <button
                type="button"
                onClick={() => setOpenBand(open ? null : b.band)}
                aria-expanded={open}
                className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-slate-50"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-900">
                    {b.label}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    {b.count} issue{b.count === 1 ? "" : "s"}
                    {b.count > 0 && ` · held ${b.intensity}% off neutral`}
                  </span>
                </span>
                <span
                  className={`shrink-0 text-lg font-extrabold tabular-nums ${meta.text}`}
                >
                  {b.pct}%
                </span>
                <span
                  aria-hidden
                  className={`shrink-0 text-[10px] text-slate-300 transition-transform ${open ? "rotate-180" : ""}`}
                >
                  ▼
                </span>
              </button>

              {open && (
                <ul className="space-y-2 px-5 pb-3.5">
                  {b.topics.length === 0 && (
                    <li className="text-[11px] text-slate-400">
                      Nothing here.
                    </li>
                  )}
                  {b.topics.map(({ topic, value }) => {
                    const low = value < SCORE.neutral;
                    return (
                      <li
                        key={topic.id}
                        className="rounded-xl bg-slate-50 p-2.5"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[11px] font-semibold text-slate-700">
                            {topic.topicName}
                          </span>
                          <span className="shrink-0 text-[11px] font-bold tabular-nums text-slate-800">
                            {value}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] leading-snug text-slate-500">
                          toward {low ? topic.leftAnchorLabel : topic.rightAnchorLabel}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <footer className="px-5 pb-5 pt-4">
        <p className="text-[10px] leading-relaxed text-slate-400">
          Percentages are shares of your weighted answers, not votes — an issue
          the model weights more heavily moves these numbers further, and so
          does an importance rating you set. Weighted over the {answered} of{" "}
          {total} issues you answered. This is the axis your sliders already
          span, from {SPECTRUM.lowLabel.toLowerCase()} at {SCORE.min} to{" "}
          {SPECTRUM.highLabel.toLowerCase()} at {SCORE.max}; it describes how
          much you favour individually-run versus collectively-run answers, not
          which party you would vote for.
        </p>
      </footer>
    </section>
  );
}
