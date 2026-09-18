import topicsJson from "../data/topics.json";
import { BRAND } from "../lib/config";
import type { Profile, Topic } from "../types";
import { useAppStore } from "../store/useAppStore";
import {
  GENDER_OPTIONS,
  RACE_OPTIONS,
  INCOME_OPTIONS,
} from "../lib/profile";

const TOPIC_COUNT = (topicsJson.topics as Topic[]).length;

const selectCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

function CohortSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-800">{label}</label>
      <select
        className={`${selectCls} mt-1.5`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      >
        <option value="">Prefer not to say</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function Onboarding() {
  const zip = useAppStore((s) => s.zip);
  const profile = useAppStore((s) => s.profile);
  const setZip = useAppStore((s) => s.setZip);
  const setProfile = useAppStore((s) => s.setProfile);
  const setScreen = useAppStore((s) => s.setScreen);

  const zipValid = /^\d{5}$/.test(zip);

  const setDim = <K extends keyof Profile,>(dim: K, raw: string) => {
    const next = { ...profile };
    if (raw === "") delete next[dim];
    else next[dim] = raw as NonNullable<Profile[K]>;
    setProfile(next);
  };

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 py-8">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600">
        {BRAND.name}
      </p>
      <h1 className="mt-4 text-2xl font-bold leading-tight text-slate-900">
        Find where you actually stand.
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Compare your views on {TOPIC_COUNT} national issue
        {TOPIC_COUNT === 1 ? "" : "s"} against national benchmarks and against
        the community around your ZIP code.
      </p>

      {/* ZIP — required */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <label htmlFor="zip" className="text-sm font-semibold text-slate-800">
          Your ZIP code
        </label>
        <p className="mt-0.5 text-xs text-slate-500">
          Required — drives your hyper-local benchmarks.
        </p>
        <input
          id="zip"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={5}
          placeholder="e.g. 30305"
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
          className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-lg font-semibold tabular-nums tracking-[0.25em] text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        {!zipValid && zip !== "" && (
          <p className="mt-1.5 text-xs text-amber-600">
            Enter a 5-digit U.S. ZIP code.
          </p>
        )}
      </div>

      {/* Optional cohort fine-tuning */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="rounded-xl bg-indigo-50 px-3 py-3">
          <p className="text-sm font-semibold text-indigo-900">
            Fine-tune your cohort (optional)
          </p>
          <p className="mt-1 text-xs leading-relaxed text-indigo-800/80">
            The more you share, the sharper your comparisons. We blend your
            ZIP's local data toward the demographic groups that match you, so
            every figure is tuned to people like you. Zip alone works; race,
            gender and income each make the cohort more specific.
          </p>
        </div>

        <div className="mt-4 space-y-3.5">
          <CohortSelect
            label="Gender"
            value={profile.gender ?? ""}
            options={GENDER_OPTIONS}
            onChange={(v) => setDim("gender", v)}
          />
          <CohortSelect
            label="Race / ethnicity"
            value={profile.race ?? ""}
            options={RACE_OPTIONS}
            onChange={(v) => setDim("race", v)}
          />
          <CohortSelect
            label="Household income"
            value={profile.income ?? ""}
            options={INCOME_OPTIONS}
            onChange={(v) => setDim("income", v)}
          />
        </div>
      </div>

      <button
        type="button"
        disabled={!zipValid}
        onClick={() => setScreen("quiz")}
        className="mt-6 h-14 w-full rounded-2xl bg-indigo-600 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Begin the diagnostic
      </button>
      <p className="mt-3 text-center text-[11px] text-slate-400">
        ~{Math.max(1, Math.round(TOPIC_COUNT / 5))} minutes · no account ·
        nothing identifies you
      </p>
    </div>
  );
}