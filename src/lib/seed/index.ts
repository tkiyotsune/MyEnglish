import type { AppData, Settings, TaskTargets } from "@/lib/types";
import { nowIso, todayKey } from "@/lib/date";
import { MATERIALS_SEED } from "./materials";
import { createSpeakingSeed } from "./speaking";
import { createGrammarSeed } from "./grammar";
import { createVocabularySeed } from "./vocabulary";

export const DEFAULT_TARGETS: TaskTargets = {
  speaking: 50,
  chunks: 10,
  newVocab: 20,
  reviewVocab: 100,
  listening: 1,
  shadowing: 5,
  grammar: 1,
  journal: 5,
  mistakes: 5,
};

export const DEFAULT_SETTINGS: Settings = {
  targets: DEFAULT_TARGETS,
  startDate: todayKey(),
  phaseOverride: null,
  theme: "system",
};

export function createInitialData(): AppData {
  const createdAt = nowIso();
  return {
    settings: { ...DEFAULT_SETTINGS, startDate: todayKey() },
    dailyTasks: [],
    vocabulary: createVocabularySeed(createdAt),
    speaking: createSpeakingSeed(createdAt),
    mistakes: [],
    listening: [],
    grammar: createGrammarSeed(createdAt),
    journal: [],
    materials: MATERIALS_SEED,
  };
}

export { ROADMAP } from "./roadmap";
