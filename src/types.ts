export type Category = "market" | "social" | "welfare" | "global" | "governance";

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
  leftAnchorLabel: string;
  rightAnchorLabel: string;
  nationalAvg: number;
  demographicSplits: DemographicSplits;
  source: string;
  /** Optional salience weight used in the weighted fingerprint score (default 1). */
  weight?: number;
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

/** One locked stance: topic id -> 1..100 */
export type Answers = Record<string, number>;

/** Category name -> 0..100 basket average (radar axes). */
export type CategoryScores = Record<Category, number>;