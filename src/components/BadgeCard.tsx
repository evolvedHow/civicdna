import { useState } from "react";
import type { Badge } from "../types";
import { BRAND, DECISIVENESS, SCORE } from "../lib/config";
import { GLYPHS } from "./icons";

interface BadgeCardProps {
  badge: Badge;
  score: number;
  /** 0..100 — mean distance from neutral as a share of the maximum possible. */
  decisive: number;
  /** Mean points off neutral that `decisive` corresponds to. */
  avgDistance: number;
  answered: number;
  total: number;
  /** Rendered explanation of the decisiveness number (already templated). */
  explanation: string;
}

export default function BadgeCard({
  badge,
  score,
  decisive,
  avgDistance,
  answered,
  total,
  explanation,
}: BadgeCardProps) {
  const [openExplainer, setOpenExplainer] = useState(false);

  const span = badge.max - badge.min + 1;
  const pos = Math.max(0, Math.min(1, (score - badge.min) / span));

  return (
    <section
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
      style={{ borderColor: `${badge.color}55` }}
    >
      <div
        className="flex items-center gap-4 p-5"
        style={{ backgroundColor: `${badge.color}0d` }}
      >
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
          style={{ backgroundColor: badge.color }}
        >
          {GLYPHS[badge.icon] ?? GLYPHS.fingerprint}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            {BRAND.badgeEyebrow}
          </p>
          <h2 className="text-xl font-extrabold leading-tight text-slate-900">
            {badge.name}
          </h2>
          <p className="mt-0.5 truncate text-xs text-slate-500">{badge.tagline}</p>
        </div>
      </div>

      <div className="p-5">
        <p className="text-xs leading-relaxed text-slate-600">{badge.description}</p>

        <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {SCORE.label}
            </p>
            <p className="text-3xl font-extrabold tabular-nums text-slate-900">
              {score}
              <span className="text-base font-semibold text-slate-400">
                {SCORE.suffix}
              </span>
            </p>
          </div>
          <p className="text-[11px] font-medium text-slate-400">
            band {badge.min}–{badge.max}
          </p>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full"
              style={{
                width: `${pos * 100}%`,
                backgroundColor: badge.color,
              }}
            />
          </div>
          <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
            {decisive}% {DECISIVENESS.label}
          </span>
        </div>

        {/* Plain-language explainer — the number is meaningless without it. */}
        {explanation && (
          <div className="mt-3 rounded-xl bg-slate-50 p-3">
            <button
              type="button"
              onClick={() => setOpenExplainer((v) => !v)}
              aria-expanded={openExplainer}
              className="flex w-full items-center justify-between gap-2 text-left"
            >
              <span className="text-[11px] font-semibold text-slate-700">
                What does {decisive}% {DECISIVENESS.label} mean?
              </span>
              <span
                aria-hidden
                className={`shrink-0 text-[10px] text-slate-400 transition-transform ${
                  openExplainer ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </button>

            {openExplainer && (
              <>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
                  {explanation}
                </p>

                {/* Visual: distance from neutral, both directions, no side implied. */}
                <div className="relative mt-3 h-6">
                  <div className="absolute inset-x-0 top-2.5 h-1 rounded-full bg-slate-200" />
                  <div
                    className="absolute top-2.5 h-1 rounded-full"
                    style={{
                      left: `${50 - decisive / 2}%`,
                      width: `${decisive}%`,
                      backgroundColor: `${badge.color}66`,
                    }}
                  />
                  <div className="absolute left-1/2 top-1 h-4 w-0.5 -translate-x-1/2 rounded bg-slate-400" />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>{SCORE.min}</span>
                  <span>neutral {SCORE.neutral}</span>
                  <span>{SCORE.max}</span>
                </div>

                <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
                  Averaged over the {answered} of {total} issue
                  {total === 1 ? "" : "s"} you answered · ±{avgDistance} pts
                  from neutral on average.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
