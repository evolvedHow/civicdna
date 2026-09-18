import type { Answers, Topic } from "../types";

interface StanceSummarySheetProps {
  open: boolean;
  topics: Topic[];
  answers: Answers;
  touched: Record<string, boolean>;
  onClose: () => void;
  onJump: (id: string) => void;
}

export default function StanceSummarySheet({
  open,
  topics,
  answers,
  touched,
  onClose,
  onJump,
}: StanceSummarySheetProps) {
  if (!open) return null;
  const setCount = topics.filter((t) => touched[t.id]).length;

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        aria-label="Close stance summary"
        onClick={onClose}
        className="absolute inset-0 w-full bg-slate-900/40"
      />
      <div className="absolute inset-x-0 top-0 mx-auto max-w-md overflow-hidden rounded-b-3xl border-b border-slate-200 bg-white shadow-xl">
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-bold text-slate-900">Your stances</p>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-slate-400">
              {setCount} of {topics.length} set
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="h-8 w-8 rounded-full bg-slate-100 text-sm text-slate-500 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
        </header>

        <ul className="max-h-[62vh] overflow-y-auto py-1.5">
          {topics.map((t, i) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onJump(t.id)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50"
              >
                <span className="w-6 shrink-0 text-[11px] font-medium tabular-nums text-slate-400">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                  {t.topicName}
                </span>
                {touched[t.id] ? (
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="h-1 w-14 overflow-hidden rounded-full bg-slate-200">
                      <span
                        className="block h-full rounded-full bg-indigo-500"
                        style={{ width: `${answers[t.id] ?? 50}%` }}
                      />
                    </span>
                    <span className="w-7 text-right text-xs font-bold tabular-nums text-slate-800">
                      {answers[t.id]}
                    </span>
                  </span>
                ) : (
                  <span className="shrink-0 text-[11px] text-slate-400">
                    neutral · not set
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}