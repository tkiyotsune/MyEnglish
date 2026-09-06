export const TASK_TYPES = [
  "speaking",
  "chunks",
  "newVocab",
  "reviewVocab",
  "listening",
  "shadowing",
  "grammar",
  "journal",
  "mistakes",
] as const;

export type TaskType = (typeof TASK_TYPES)[number];

export type DailyTask = {
  id: string;
  type: TaskType;
  target: number;
  completed: number;
  date: string; // YYYY-MM-DD (local)
};

export type TaskTargets = Record<TaskType, number>;

export type ThemeMode = "system" | "light" | "dark";

export type Settings = {
  targets: TaskTargets;
  startDate: string; // roadmap start (YYYY-MM-DD)
  phaseOverride: RoadmapPhaseId | null;
  theme: ThemeMode;
};

export type VocabStatus = "new" | "learning" | "mastered";

export type Vocabulary = {
  id: string;
  word: string;
  meaning: string;
  examples: string[];
  chunks: string[];
  category?: string;
  source: string;
  level?: string;
  status: VocabStatus;
  reviewCount: number;
  lastReviewedAt?: string;
  createdAt: string;
};

export type SpeakingStatus = "learning" | "mastered";

export type SpeakingSentence = {
  id: string;
  japanese: string;
  english: string;
  category: string;
  level: string;
  successCount: number;
  failureCount: number;
  status: SpeakingStatus;
  source: "seed" | "custom" | "mistake";
  mistakeId?: string;
  queuedDate?: string; // date on which this sentence is queued for practice
  lastPracticedAt?: string;
  createdAt: string;
};

export type MistakeStatus = "new" | "reviewing" | "mastered";

export type Mistake = {
  id: string;
  japanese?: string;
  attemptedEnglish?: string;
  correctEnglish: string;
  category: string;
  status: MistakeStatus;
  reviewCount: number;
  lastReviewedAt?: string;
  createdAt: string;
};

export const LISTENING_STEPS = [
  "字幕なしで聞く",
  "スクリプト確認",
  "不明単語・文法確認",
  "音声＋スクリプト",
  "オーバーラッピング",
  "シャドーイング",
  "内容を英語で要約",
] as const;

export type ListeningMaterial = {
  id: string;
  title: string;
  source: string;
  url?: string;
  level?: string;
  script?: string;
  unknownWords: string[];
  summary?: string;
  shadowingCount: number;
  completedSteps: string[];
  completedAt?: string;
  createdAt: string;
};

export type GrammarStatus = "todo" | "in_progress" | "done";

export type GrammarTheme = {
  id: string;
  title: string;
  source: string;
  status: GrammarStatus;
  exampleSentences: string[];
  customSentences: string[];
  order: number;
  completedAt?: string;
  createdAt: string;
};

export type JournalEntry = {
  id: string;
  date: string;
  text: string;
  corrected?: string;
  newExpressions: string[];
  spoken: boolean;
  memo?: string;
  updatedAt: string;
};

export type MaterialCategory =
  | "grammar"
  | "vocabulary"
  | "speaking"
  | "listening"
  | "support";

export type MaterialStatus = "active" | "sub" | "future" | "done";

export type Material = {
  id: string;
  title: string;
  category: MaterialCategory;
  status: MaterialStatus;
  note?: string;
  order: number;
};

export type RoadmapPhaseId = "m1" | "m2" | "m3" | "b1-b2" | "b2-c1";

export type RoadmapPhase = {
  id: RoadmapPhaseId;
  label: string;
  title: string;
  theme: string;
  focus: string[];
  examples: string[];
  goal: string;
  durationDays: number | null;
};

export type AppData = {
  settings: Settings;
  dailyTasks: DailyTask[];
  vocabulary: Vocabulary[];
  speaking: SpeakingSentence[];
  mistakes: Mistake[];
  listening: ListeningMaterial[];
  grammar: GrammarTheme[];
  journal: JournalEntry[];
  materials: Material[];
};

export type CollectionName = Exclude<keyof AppData, "settings">;
