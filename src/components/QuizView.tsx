import { useEffect, useMemo, useState } from "react";
import topicsJson from "../data/topics.json";
import type { Topic } from "../types";
import { BRAND } from "../lib/config";
import { useAppStore } from "../store/useAppStore";
import IssueCard from "./IssueCard";
import StanceRail from "./StanceRail";
import StanceSummarySheet from "./StanceSummarySheet";

const topics = topicsJson.topics as Topic[];

export default function QuizView() {
  const zip = useAppStore((s) => s.zip);
  const profile = useAppStore((s) => s.profile);
  const answers = useAppStore((s) => s.answers);
  const touched = useAppStore((s) => s.touched);
  const setStance = useAppStore((s) => s.setStance);
  const setScreen = useAppStore((s) => s.setScreen);
  const reset = useAppStore((s) => s.reset);

  const [activeId, setActiveId] = useState<string>(topics[0]?.id ?? "");
  const [showSummary, setShowSummary] = useState(false);

  const answeredCount = useMemo(
    () => topics.filter((t) => touched[t.id]).length,
    [touched],
  );
  const remaining = topics.length - answeredCount;

  useEffect(() => {
    const els = topics
      .map((t) => document.getElementById(`issue-${t.id}`))
      .filter((el): el is HTMLElement => Boolean(el));
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestId: string | null = null;
        let best = -1;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (entry.intersectionRatio > best) {
            best = entry.intersectionRatio;
            bestId = (entry.target as HTMLElement).id.slice("issue-".length);
          }
        }
        if (bestId) setActiveId(bestId);
      },
      { rootMargin: "-30% 0px -55% 0px" },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const jumpTo = (id: string) => {
    document
      .getElementById(`issue-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-slate-100/85 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-2.5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
            {BRAND.name}{" "}
            <span className="ml-1 font-medium tracking-normal text-slate-400 normal-case">
              {answeredCount} of {topics.length} stances set
            </span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSummary((v) => !v)}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:text-indigo-700"
            >
              My stances
            </button>
            <button
              type="button"
              onClick={() => setScreen("results")}
              className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              my {BRAND.name}
            </button>
          </div>
        </div>
      </header>

      <StanceRail
        topics={topics}
        touched={touched}
        activeId={activeId}
        onSelect={jumpTo}
      />

      {topics.map((t, i) => (
        <section
          key={t.id}
          id={`issue-${t.id}`}
          className="scroll-mt-16 px-4 pb-2 pt-4 first:pt-6"
        >
          <div
            className={`mx-auto max-w-md transition-opacity duration-300 ${
              activeId === t.id ? "opacity-100" : "opacity-60"
            }`}
          >
            <IssueCard
              topic={t}
              zip={zip}
              profile={profile}
              value={answers[t.id] ?? 50}
              touched={Boolean(touched[t.id])}
              index={i}
              total={topics.length}
              onStanceChange={(v) => setStance(t.id, v)}
            />
          </div>
        </section>
      ))}

      <section className="px-4 pb-20 pt-6">
        <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-900">
            {remaining === 0
              ? "All topics recorded"
              : `${remaining} issue${remaining === 1 ? "" : "s"} still at neutral default`}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Slide any bar to adjust your stance.
          </p>
          <button
            type="button"
            onClick={() => setScreen("results")}
            className="mt-4 h-12 w-full rounded-xl bg-indigo-600 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            Reveal my Genome
          </button>
          <button
            type="button"
            onClick={reset}
            className="mt-2 w-full rounded-xl py-2 text-sm font-medium text-slate-400 transition hover:text-slate-600"
          >
            Reset and redo
          </button>
        </div>
      </section>

      <StanceSummarySheet
        open={showSummary}
        topics={topics}
        answers={answers}
        touched={touched}
        onClose={() => setShowSummary(false)}
        onJump={(id) => {
          setShowSummary(false);
          jumpTo(id);
        }}
      />
    </div>
  );
}