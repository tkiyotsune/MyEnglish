import type { DailyTask, TaskTargets, TaskType } from "@/lib/types";
import { TASK_TYPES } from "@/lib/types";
import { newId } from "@/lib/id";

export type TaskMeta = {
  type: TaskType;
  label: string;
  unit: string;
  href: string;
  description: string;
  steps: number[];
};

export const TASK_META: Record<TaskType, TaskMeta> = {
  speaking: { type: "speaking", label: "瞬間英作文", unit: "問", href: "/speaking/", description: "基礎英文・疑問文・時制・前置詞・接続詞・会話表現", steps: [1, 5, 10] },
  chunks: { type: "chunks", label: "前置詞・接続詞", unit: "表現", href: "/english_phrases_complete.html", description: "for / because などのチャンクを声に出す", steps: [1, 5] },
  newVocab: { type: "newVocab", label: "新規単語", unit: "語", href: "/vocabulary/", description: "単語 → チャンク → 例文で登録", steps: [1, 5] },
  reviewVocab: { type: "reviewVocab", label: "単語復習", unit: "語", href: "/vocabulary/?tab=review", description: "復習中心。カードをめくって判定", steps: [1, 10, 25] },
  listening: { type: "listening", label: "Listening", unit: "素材", href: "/listening/", description: "7ステップで1素材を仕上げる", steps: [1] },
  shadowing: { type: "shadowing", label: "Shadowing", unit: "周", href: "/listening/", description: "同じ素材を繰り返す", steps: [1] },
  grammar: { type: "grammar", label: "文法", unit: "テーマ", href: "/grammar/", description: "1テーマ + 自作文5文", steps: [1] },
  journal: { type: "journal", label: "今日の出来事", unit: "文", href: "/journal/", description: "出来事を英語で5文。声に出す", steps: [1] },
  mistakes: { type: "mistakes", label: "言えなかった表現", unit: "件", href: "/mistakes/", description: "記録した表現を復習して資産化", steps: [1] },
};

export function ensureTasksForDate(
  tasks: DailyTask[],
  date: string,
  targets: TaskTargets,
): { tasks: DailyTask[]; changed: boolean } {
  const existing = new Set(tasks.filter((t) => t.date === date).map((t) => t.type));
  const missing = TASK_TYPES.filter((t) => !existing.has(t));
  if (missing.length === 0) return { tasks, changed: false };
  const added: DailyTask[] = missing.map((type) => ({
    id: newId(),
    type,
    target: targets[type],
    completed: 0,
    date,
  }));
  return { tasks: [...tasks, ...added], changed: true };
}

export function tasksForDate(tasks: DailyTask[], date: string): DailyTask[] {
  const byType = new Map(tasks.filter((t) => t.date === date).map((t) => [t.type, t]));
  return TASK_TYPES.map((t) => byType.get(t)).filter((t): t is DailyTask => Boolean(t));
}

/** A task with target 0 is skipped for the day: not counted, not shown as remaining. */
export function isTaskSkipped(t: DailyTask): boolean {
  return t.target <= 0;
}

export function isTaskDone(t: DailyTask): boolean {
  return t.target > 0 && t.completed >= t.target;
}

export function activeTasks(tasks: DailyTask[]): DailyTask[] {
  return tasks.filter((t) => !isTaskSkipped(t));
}

export function dayProgress(tasks: DailyTask[]): { done: number; total: number; ratio: number } {
  const active = activeTasks(tasks);
  const total = active.length;
  const done = active.filter(isTaskDone).length;
  return { done, total, ratio: total === 0 ? 0 : done / total };
}

/** A day counts as studied when any task has progress. */
export function isStudyDay(tasks: DailyTask[]): boolean {
  return tasks.some((t) => t.completed > 0);
}

export function computeStreak(allTasks: DailyTask[], today: string, addDays: (d: string, n: number) => string): number {
  const byDate = new Map<string, DailyTask[]>();
  for (const t of allTasks) {
    const arr = byDate.get(t.date) ?? [];
    arr.push(t);
    byDate.set(t.date, arr);
  }
  let streak = 0;
  let cursor = today;
  // Today may be still in progress: don't break the streak if today has nothing yet.
  if (!isStudyDay(byDate.get(cursor) ?? [])) cursor = addDays(cursor, -1);
  while (isStudyDay(byDate.get(cursor) ?? [])) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
