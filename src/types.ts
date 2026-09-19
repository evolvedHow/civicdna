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

export type GenderSplit = { men: number; women: number };
export type RaceSplit = {
  white: number;
  black: number;
  hispanic: number;
  asian: number;
  native: number;
};
export type IncomeSplit = {
  lt40k: number;
  _40to80k: number;
  _80to150k: number;
  gt150k: number;
};
export type UrbanicitySplit = { urban: number; suburban: number; rural: number };

export interface DemographicSplits {
  gender: GenderSplit;
  race: RaceSplit;
  income: IncomeSplit;
  urbanicity: UrbanicitySplit;
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
  /** Weight topics by respondent-declared salience. Default false. */
  useSalience?: boolean;
}

export interface AppConfig {
  schemaVersion?: number;
  brand?: BrandConfig;
  score?: ScoreConfig;
  decisiveness?: DecisivenessConfig;
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
 * Historically this was a bare number (the position). The object form adds
 * salience and confidence without invalidating stored data, so both shapes
 * are accepted forever — read through the helpers in lib/stance.ts rather
 * than indexing `Answers` directly.
 */
export interface StanceRecord {
  /** Where the respondent falls on the issue spectrum, 0..100. */
  position: number;
  /** How much the issue matters to them, 0..100. Optional. */
  salience?: number;
  /** How certain they are of their position, 0..100. Optional. */
  confidence?: number;
}

export type StanceValue = number | StanceRecord;

/** One locked stance per topic id. Bare number = position only (legacy). */
export type Answers = Record<string, StanceValue>;

/** Category name -> 0..100 basket average (radar axes). */
export type CategoryScores = Record<Category, number>;