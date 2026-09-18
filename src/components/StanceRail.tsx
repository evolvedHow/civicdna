import type { Topic } from "../types";

interface StanceRailProps {
  topics: Topic[];
  touched: Record<string, boolean>;
  activeId: string;
  onSelect: (id: string) => void;
}

export default function StanceRail({
  topics,
  touched,
  activeId,
  onSelect,
}: StanceRailProps) {
  return (
    <nav
      aria-label="Jump to issue"
      className="fixed right-1.5 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-1.5 rounded-full bg-white/70 px-1.5 py-2.5 shadow-sm ring-1 ring-slate-200/60 backdrop-blur"
    >
      {topics.map((t) => {
        const active = activeId === t.id;
        return (
          <button
            key={t.id}
            type="button"
            title={t.topicName}
            aria-label={`Go to ${t.topicName}`}
            onClick={() => onSelect(t.id)}
            className={`block shrink-0 rounded-full transition-all ${
              active
                ? "h-4 w-4 bg-indigo-600 ring-2 ring-indigo-300 ring-offset-1"
                : touched[t.id]
                  ? "h-2.5 w-2.5 bg-indigo-400 hover:scale-125"
                  : "h-2.5 w-2.5 bg-slate-300 hover:scale-125"
            }`}
          />
        );
      })}
    </nav>
  );
}