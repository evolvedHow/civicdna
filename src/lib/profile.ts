import type { Profile } from "../types";

const GENDER_LABELS: Record<NonNullable<Profile["gender"]>, string> = {
  men: "Men",
  women: "Women",
};

const RACE_LABELS: Record<NonNullable<Profile["race"]>, string> = {
  white: "White",
  black: "Black",
  hispanic: "Hispanic",
  asian: "Asian",
  native: "Native American",
};

const INCOME_LABELS: Record<NonNullable<Profile["income"]>, string> = {
  lt40k: "Under $40K",
  _40to80k: "$40K–$80K",
  _80to150k: "$80K–$150K",
  gt150k: "$150K+",
};

export const GENDER_OPTIONS = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
] as const;

export const RACE_OPTIONS = [
  { value: "white", label: "White" },
  { value: "black", label: "Black" },
  { value: "hispanic", label: "Hispanic or Latino" },
  { value: "asian", label: "Asian" },
  { value: "native", label: "American Indian / Alaska Native" },
] as const;

export const INCOME_OPTIONS = [
  { value: "lt40k", label: "Under $40,000" },
  { value: "_40to80k", label: "$40,000 – $80,000" },
  { value: "_80to150k", label: "$80,000 – $150,000" },
  { value: "gt150k", label: "Over $150,000" },
] as const;

export function cohortLabel(profile: Profile): string {
  const parts: string[] = [];
  if (profile.gender) parts.push(GENDER_LABELS[profile.gender]);
  if (profile.race) parts.push(RACE_LABELS[profile.race]);
  if (profile.income) parts.push(INCOME_LABELS[profile.income]);
  return parts.join(" · ");
}

/** 0..3 — how many cohort dims the user opted into. */
export function cohortCount(profile: Profile): number {
  return (profile.gender ? 1 : 0) + (profile.race ? 1 : 0) + (profile.income ? 1 : 0);
}