export type Category =
  | "market"
  | "social"
  | "welfare"
  | "global"
  | "governance"
  | "technology"
  | "environment";

/**
 * Topic lifecycle. Only `core`/`current`/`emerging` topics are scored;
 * `archived` topics are retained so historical answers stay interpretable
 * but are excluded from the active question set and the composite.
 */
export type TopicStatus = "core" | "current" | "emerging" | "archived";

/**
 * Splits are deliberately nullable: a `null` cell means the cited survey did
 * not publish that subgroup's figure, and the UI says "not reported" rather
 * than inventing one. A whole dimension (`gender`, `race`, ...) may also be
 * null when the source reports none of its subgroups. Only empirically
 * verified cells are populated (see topics.json).
 */
export type GenderSplit = { men: number | null; women: number | null };
export type RaceSplit = {
  white: number | null;
  black: number | null;
  hispanic: number | null;
  asian: number | null;
  native: number | null;
};
export type IncomeSplit = {
  lt40k: number | null;
  _40to80k: number | null;
  _80to150k: number | null;
  gt150k: number | null;
};
export type UrbanicitySplit = {
  urban: number | null;
  suburban: number | null;
  rural: number | null;
};

export interface DemographicSplits {
  gender: GenderSplit | null;
  race: RaceSplit | null;
  income: IncomeSplit | null;
  urbanicity: UrbanicitySplit | null;
}

export interface Topic {
  id: string;
  topicName: string;
  category: Category;
  description: string;
  /**
   * The two ends of THIS ISSUE'S policy spectrum — not political left/right.
   * "Private Market Healthcare -> Universal Public Coverage" is a policy axis,
   * not a party axis. Field names are retained for schema compatibility.
   *
   * Orientation is a scoring invariant: the right anchor is always the more
   * collective / regulated / publicly-coordinated pole.
   */
  leftAnchorLabel: string;
  rightAnchorLabel: string;
  /** null until empirically validated. Never fabricate. */
  nationalAvg: number | null;
  /** null until empirically validated. Never fabricate. */
  demographicSplits: DemographicSplits | null;
  /** null until a real citation exists. */
  source: string | null;
  /** Salience weight within the topic's category (default 1). */
  weight?: number;
  /** Defaults to "core" when absent. */
  topicStatus?: TopicStatus;
  /** ISO date; topic is inactive before this. */
  activeFrom?: string | null;
  /** ISO date; topic is inactive after this. */
  activeUntil?: string | null;
  /**
   * Documentation-only for now: sub-dimensions this topic really spans.
   * Present so a future multi-question model has somewhere to live; no
   * scoring logic reads this field.
   */
  dimensions?: string[];
}

export interface Badge {
  id: string;
  min: number;
  max: number;
  name: string;
  icon: string;
  color: string;
  tagline: string;
  description: string;
  /** Optional per-band override of decisiveness.explanation. */
  explanation?: string;
  /** Optional per-band override of share.text. */
  shareText?: string;
}

export interface BrandConfig {
  name?: string;
  wordmark?: string;
  shareUrl?: string;
  badgeCta?: string;
  badgeEyebrow?: string;
}

export interface ScoreConfig {
  label?: string;
  suffix?: string;
  min?: number;
  max?: number;
  neutral?: number;
}

export interface DecisivenessConfig {
  label?: string;
  caption?: string;
  explanation?: string;
}

export interface ScoringConfig {
  /** Relative pull of each radar axis on the composite index. Missing = 1. */
  categoryWeights?: Partial<Record<Category, number>>;
}

/**
 * Presentational banding of the stance scale, used to render the derived
 * results spectrum as a distribution instead of a single number.
 *
 * These labels name the axis that EVERY topic's anchors already sit on —
 * individual/market discretion at score.min, collective/regulated
 * coordination at score.max. They are deliberately not party labels, and per
 * change request §14 they must never surface as the primary response choices
 * on a question slider. The per-topic `leftAnchorLabel` / `rightAnchorLabel`
 * stay fluid and match the tone of the issue being asked.
 */
export interface SpectrumConfig {
  /** Far end of the scale, at score.min. */
  lowLabel?: string;
  /** Just off centre, toward lowLabel. */
  lowLeanLabel?: string;
  /** The centre band. */
  neutralLabel?: string;
  /** Just off centre, toward highLabel. */
  highLeanLabel?: string;
  /** Far end of the scale, at score.max. */
  highLabel?: string;
  /** Points off neutral that still count as the centre band. */
  neutralBand?: number;
  /** Points off neutral beyond which a stance is a full pole, not a lean. */
  strongThreshold?: number;
  /** Percentage points the two sides may differ by before the split reads even. */
  evenThreshold?: number;
}

/**
 * Per-question importance rating. A 0..`max` control ("how important is this
 * to you?") that scales the question's weight, rather than a 0..100 slider —
 * five taps is the right amount of effort for a modifier, and a fine-grained
 * score would imply a precision the respondents do not have.
 *
 * `default` is the multiplier's denominator, so rating a question `default`
 * is a no-op and the shipped default therefore leaves every historical score
 * untouched. Changing `default` is a scoring change.
 */
export interface ImportanceConfig {
  /** False falls back to a flat weight and hides the control. */
  enabled?: boolean;
  /** Pre-selected rating. Must be > 0; it is the multiplier denominator. */
  default?: number;
  /** Highest rating offered. */
  max?: number;
  prompt?: string;
  lowLabel?: string;
  highLabel?: string;
  /** Copy shown once a question is rated 0 and drops out of the score. */
  excludedNote?: string;
}

export interface AppConfig {
  schemaVersion?: number;
  brand?: BrandConfig;
  score?: ScoreConfig;
  decisiveness?: DecisivenessConfig;
  spectrum?: SpectrumConfig;
  importance?: ImportanceConfig;
  share?: { text?: string };
  scoring?: ScoringConfig;
  badges: Badge[];
}

export interface LocalBenchmark extends DemographicSplits {
  avg: number;
}

/**
 * Optional cohort tuners. Anything the user shares biases their local
 * benchmark toward that demographic split. More fields = more specific cohort.
 */
export interface Profile {
  gender?: keyof GenderSplit;
  race?: keyof RaceSplit;
  income?: keyof IncomeSplit;
}

/**
 * A respondent's answer to one topic.
 *
 * Historically this was a bare number (the position). The object form adds an
 * importance rating and a confidence rating without invalidating stored data,
 * so both shapes are accepted forever — read through the helpers in
 * lib/stance.ts rather than indexing `Answers` directly.
 */
export interface StanceRecord {
  /**
   * Where the respondent falls on the issue spectrum, 0..100.
   *
   * Optional because a rating can be set before a position: rating a question
   * must not be read as answering it at neutral. Absent means unanswered, and
   * `getPosition` reports that as undefined.
   */
  position?: number;
  /**
   * How much the issue matters to them. This is the field `importance.max` in
   * config.yaml bounds — 0..5 as shipped, NOT 0..100. It was originally
   * specced as 0..100 (change request §6) and no UI ever wrote it, so nothing
   * was stored on that scale; the store migration rescales any stray legacy
   * value anyway.
   */
  salience?: number;
  /** How certain they are of their position, 0..100. Optional. */
  confidence?: number;
}

export type StanceValue = number | StanceRecord;

/** One locked stance per topic id. Bare number = position only (legacy). */
export type Answers = Record<string, StanceValue>;

/** Category name -> 0..100 basket average (radar axes). */
export type CategoryScores = Record<Category, number>;