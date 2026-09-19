import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Answers, Profile } from "../types";
import { migrateAppState } from "./migrations";
import { withConfidence, withPosition, withSalience } from "../lib/stance";

export type Screen = "welcome" | "quiz" | "results";

interface AppState {
  screen: Screen;
  zip: string;
  profile: Partial<Profile>;
  answers: Answers;
  /** Topics the user actually moved the slider on (vs. untouched = neutral default). */
  touched: Record<string, boolean>;
  setScreen: (screen: Screen) => void;
  setZip: (zip: string) => void;
  setProfile: (profile: Partial<Profile>) => void;
  setStance: (topicId: string, value: number) => void;
  /** Optional: how much this issue matters to the respondent (0..100). */
  setSalience: (topicId: string, value: number) => void;
  /** Optional: how certain the respondent is of their position (0..100). */
  setConfidence: (topicId: string, value: number) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      screen: "welcome",
      zip: "",
      profile: {},
      answers: {},
      touched: {},
      setScreen: (screen) => set({ screen }),
      setZip: (zip) => set({ zip }),
      setProfile: (profile) => set({ profile }),
      setStance: (topicId, value) =>
        set((s) => ({
          answers: {
            ...s.answers,
            [topicId]: withPosition(s.answers[topicId], value),
          },
          touched: { ...s.touched, [topicId]: true },
        })),
      setSalience: (topicId, value) =>
        set((s) => ({
          answers: {
            ...s.answers,
            [topicId]: withSalience(s.answers[topicId], value),
          },
        })),
      setConfidence: (topicId, value) =>
        set((s) => ({
          answers: {
            ...s.answers,
            [topicId]: withConfidence(s.answers[topicId], value),
          },
        })),
      reset: () =>
        set({ screen: "welcome", zip: "", profile: {}, answers: {}, touched: {} }),
    }),
    {
      name: "civicdna-store",
      version: 2,
      migrate: migrateAppState,
      // A stale `screen: "results"` from a previous session would otherwise
      // drop a returning user straight into a dashboard for answers they may
      // no longer have. Only resume mid-flow if the ZIP is still valid.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.screen !== "welcome" && !/^\d{5}$/.test(state.zip)) {
          state.screen = "welcome";
        }
      },
    },
  ),
);