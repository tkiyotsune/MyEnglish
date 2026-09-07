"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AppData,
  CollectionName,
  DailyTask,
  GrammarTheme,
  JournalEntry,
  ListeningMaterial,
  Material,
  Mistake,
  Settings,
  SpeakingSentence,
  TaskTargets,
  TaskType,
  Vocabulary,
} from "@/lib/types";
import { TASK_TYPES } from "@/lib/types";
import { getRepository } from "@/lib/repository";
import { createInitialData } from "@/lib/seed";
import { ensureTasksForDate } from "@/lib/tasks";
import { nowIso, todayKey } from "@/lib/date";
import { newId } from "@/lib/id";
import { countSentences } from "@/lib/text";

type Entity = { id: string };

type Actions = {
  incrementTask: (type: TaskType, delta: number) => void;
  setTaskCompleted: (type: TaskType, value: number) => void;
  completeTask: (type: TaskType) => void;
  updateSettings: (patch: Partial<Settings>) => void;

  addVocabulary: (v: Omit<Vocabulary, "id" | "createdAt" | "reviewCount">) => Vocabulary;
  updateVocabulary: (id: string, patch: Partial<Vocabulary>) => void;
  removeVocabulary: (id: string) => void;
  reviewVocabulary: (id: string, remembered: boolean) => void;

  addSpeaking: (s: Omit<SpeakingSentence, "id" | "createdAt" | "successCount" | "failureCount" | "status">) => SpeakingSentence;
  updateSpeaking: (id: string, patch: Partial<SpeakingSentence>) => void;
  removeSpeaking: (id: string) => void;
  practiceSpeaking: (id: string, success: boolean) => void;

  addMistake: (m: Omit<Mistake, "id" | "createdAt" | "reviewCount" | "status"> & { status?: Mistake["status"] }) => Mistake;
  updateMistake: (id: string, patch: Partial<Mistake>) => void;
  removeMistake: (id: string) => void;
  reviewMistake: (id: string, mastered: boolean) => void;
  queueMistakeForSpeaking: (id: string) => void;

  addListening: (m: Omit<ListeningMaterial, "id" | "createdAt" | "shadowingCount" | "completedSteps" | "unknownWords"> & Partial<Pick<ListeningMaterial, "unknownWords">>) => ListeningMaterial;
  updateListening: (id: string, patch: Partial<ListeningMaterial>) => void;
  removeListening: (id: string) => void;
  toggleListeningStep: (id: string, step: string) => void;
  addShadowing: (id: string, delta: number) => void;

  addGrammar: (g: Omit<GrammarTheme, "id" | "createdAt" | "order" | "customSentences" | "status">) => GrammarTheme;
  updateGrammar: (id: string, patch: Partial<GrammarTheme>) => void;
  removeGrammar: (id: string) => void;
  completeGrammar: (id: string) => void;

  saveJournal: (date: string, patch: Partial<Omit<JournalEntry, "id" | "date" | "updatedAt">>) => void;
  removeJournal: (id: string) => void;

  addMaterial: (m: Omit<Material, "id" | "order">) => void;
  updateMaterial: (id: string, patch: Partial<Material>) => void;
  removeMaterial: (id: string) => void;

  exportJson: () => string;
  importJson: (json: string) => Promise<void>;
  resetAll: () => Promise<void>;
};

type AppContextValue = {
  data: AppData;
  ready: boolean;
  today: string;
  /** Non-null when persistence failed; in-memory state may be ahead of storage. */
  storageError: string | null;
  actions: Actions;
};

const AppContext = createContext<AppContextValue | null>(null);

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function sameTargets(a: TaskTargets, b: TaskTargets): boolean {
  return TASK_TYPES.every((t) => a[t] === b[t]);
}

function withTodayTasks(data: AppData, today: string): AppData {
  const ensured = ensureTasksForDate(data.dailyTasks, today, data.settings.targets);
  return ensured.changed ? { ...data, dailyTasks: ensured.tasks } : data;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const repo = useMemo(() => getRepository(), []);
  const [data, setData] = useState<AppData>(() => createInitialData());
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState(() => todayKey());
  const [storageError, setStorageError] = useState<string | null>(null);
  const dataRef = useRef(data);
  const todayRef = useRef(today);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  /** Returns the current local date key and rolls `today` over if the day changed. */
  const reportWrite = useCallback((p: Promise<void>) => {
    p.then(() => setStorageError(null)).catch((e: unknown) => setStorageError(errorMessage(e)));
  }, []);

  /** Returns the current local date key; on a day change, rolls `today` over and creates the new day's tasks. */
  const resolveToday = useCallback((): string => {
    const key = todayKey();
    if (key !== todayRef.current) {
      todayRef.current = key;
      setToday(key);
      setData((prev) => {
        const next = withTodayTasks(prev, key);
        if (next !== prev) reportWrite(repo.saveCollection("dailyTasks", next.dailyTasks));
        return next;
      });
    }
    return key;
  }, [repo, reportWrite]);

  // Load persisted data once. Never leave the app stuck on "Loading" if storage is unavailable.
  useEffect(() => {
    let cancelled = false;
    repo
      .loadAll()
      .catch((e: unknown) => {
        setStorageError(errorMessage(e));
        return createInitialData();
      })
      .then((loaded) => {
        if (cancelled) return;
        const date = resolveToday();
        const next = withTodayTasks(loaded, date);
        setData(next);
        setReady(true);
        if (next !== loaded) reportWrite(repo.saveCollection("dailyTasks", next.dailyTasks));
      });
    return () => {
      cancelled = true;
    };
  }, [repo, resolveToday, reportWrite]);

  // Roll over to a new day when the date changes while the app is open.
  useEffect(() => {
    const check = () => resolveToday();
    const id = window.setInterval(check, 60_000);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", check);
    };
  }, [resolveToday]);

  const persistCollection = useCallback(
    <K extends CollectionName>(name: K, updater: (items: AppData[K]) => AppData[K]) => {
      setData((prev) => {
        const items = updater(prev[name]);
        reportWrite(repo.saveCollection(name, items));
        return { ...prev, [name]: items };
      });
    },
    [repo, reportWrite],
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      const date = resolveToday();
      setData((prev) => {
        const settings: Settings = {
          ...prev.settings,
          ...patch,
          targets: { ...prev.settings.targets, ...(patch.targets ?? {}) },
        };
        reportWrite(repo.saveSettings(settings));
        let dailyTasks = prev.dailyTasks;
        if (!sameTargets(prev.settings.targets, settings.targets)) {
          // Apply new targets to today's tasks only; history keeps its own targets.
          dailyTasks = prev.dailyTasks.map((t) => (t.date === date ? { ...t, target: settings.targets[t.type] } : t));
          reportWrite(repo.saveCollection("dailyTasks", dailyTasks));
        }
        return { ...prev, settings, dailyTasks };
      });
    },
    [repo, reportWrite, resolveToday],
  );

  const patchTask = useCallback(
    (type: TaskType, fn: (t: DailyTask) => DailyTask) => {
      const date = resolveToday();
      setData((prev) => {
        const ensured = ensureTasksForDate(prev.dailyTasks, date, prev.settings.targets).tasks;
        const dailyTasks = ensured.map((t) => (t.date === date && t.type === type ? fn(t) : t));
        reportWrite(repo.saveCollection("dailyTasks", dailyTasks));
        return { ...prev, dailyTasks };
      });
    },
    [repo, reportWrite, resolveToday],
  );

  const incrementTask = useCallback(
    (type: TaskType, delta: number) => patchTask(type, (t) => ({ ...t, completed: Math.max(0, t.completed + delta) })),
    [patchTask],
  );
  const setTaskCompleted = useCallback(
    (type: TaskType, value: number) => patchTask(type, (t) => ({ ...t, completed: Math.max(0, value) })),
    [patchTask],
  );
  const completeTask = useCallback(
    (type: TaskType) => patchTask(type, (t) => ({ ...t, completed: Math.max(t.completed, t.target) })),
    [patchTask],
  );

  const upsert = <T extends Entity>(items: T[], id: string, patch: Partial<T>): T[] =>
    items.map((it) => (it.id === id ? { ...it, ...patch } : it));
  const remove = <T extends Entity>(items: T[], id: string): T[] => items.filter((it) => it.id !== id);

  const actions = useMemo<Actions>(() => {
    return {
      incrementTask,
      setTaskCompleted,
      completeTask,
      updateSettings,

      addVocabulary: (v) => {
        const item: Vocabulary = { ...v, id: newId(), createdAt: nowIso(), reviewCount: 0 };
        persistCollection("vocabulary", (items) => [item, ...items]);
        incrementTask("newVocab", 1);
        return item;
      },
      updateVocabulary: (id, patch) => persistCollection("vocabulary", (items) => upsert(items, id, patch)),
      removeVocabulary: (id) => persistCollection("vocabulary", (items) => remove(items, id)),
      reviewVocabulary: (id, remembered) => {
        persistCollection("vocabulary", (items) =>
          items.map((v) => {
            if (v.id !== id) return v;
            const reviewCount = v.reviewCount + 1;
            let status = v.status;
            if (remembered && v.status === "new") status = "learning";
            else if (remembered && v.status === "learning" && reviewCount >= 3) status = "mastered";
            else if (!remembered && v.status === "mastered") status = "learning";
            return { ...v, reviewCount, status, lastReviewedAt: nowIso() };
          }),
        );
        incrementTask("reviewVocab", 1);
      },

      addSpeaking: (s) => {
        const item: SpeakingSentence = { ...s, id: newId(), createdAt: nowIso(), successCount: 0, failureCount: 0, status: "learning" };
        persistCollection("speaking", (items) => [item, ...items]);
        return item;
      },
      updateSpeaking: (id, patch) => persistCollection("speaking", (items) => upsert(items, id, patch)),
      removeSpeaking: (id) => persistCollection("speaking", (items) => remove(items, id)),
      practiceSpeaking: (id, success) => {
        persistCollection("speaking", (items) =>
          items.map((s) => {
            if (s.id !== id) return s;
            const successCount = s.successCount + (success ? 1 : 0);
            const failureCount = s.failureCount + (success ? 0 : 1);
            const status: SpeakingSentence["status"] = success && successCount >= 3 && successCount > failureCount ? "mastered" : "learning";
            return { ...s, successCount, failureCount, status, lastPracticedAt: nowIso(), queuedDate: undefined };
          }),
        );
        incrementTask("speaking", 1);
      },

      addMistake: (m) => {
        const item: Mistake = { status: "new", ...m, id: newId(), createdAt: nowIso(), reviewCount: 0 };
        persistCollection("mistakes", (items) => [item, ...items]);
        return item;
      },
      updateMistake: (id, patch) => persistCollection("mistakes", (items) => upsert(items, id, patch)),
      removeMistake: (id) => persistCollection("mistakes", (items) => remove(items, id)),
      reviewMistake: (id, mastered) => {
        persistCollection("mistakes", (items) =>
          items.map((m) =>
            m.id === id
              ? { ...m, reviewCount: m.reviewCount + 1, status: mastered ? "mastered" : "reviewing", lastReviewedAt: nowIso() }
              : m,
          ),
        );
        incrementTask("mistakes", 1);
      },
      queueMistakeForSpeaking: (id) => {
        const m = dataRef.current.mistakes.find((x) => x.id === id);
        if (!m) return;
        const date = resolveToday();
        const existing = dataRef.current.speaking.find((s) => s.mistakeId === id);
        if (existing) {
          persistCollection("speaking", (items) => upsert(items, existing.id, { queuedDate: date }));
        } else {
          const item: SpeakingSentence = {
            id: newId(),
            japanese: m.japanese ?? "",
            english: m.correctEnglish,
            category: m.category,
            level: "custom",
            successCount: 0,
            failureCount: 0,
            status: "learning",
            source: "mistake",
            mistakeId: id,
            queuedDate: date,
            createdAt: nowIso(),
          };
          persistCollection("speaking", (items) => [item, ...items]);
        }
        if (m.status === "new") persistCollection("mistakes", (items) => upsert(items, id, { status: "reviewing" }));
      },

      addListening: (m) => {
        const item: ListeningMaterial = { unknownWords: [], ...m, id: newId(), createdAt: nowIso(), shadowingCount: 0, completedSteps: [] };
        persistCollection("listening", (items) => [item, ...items]);
        return item;
      },
      updateListening: (id, patch) => persistCollection("listening", (items) => upsert(items, id, patch)),
      removeListening: (id) => persistCollection("listening", (items) => remove(items, id)),
      toggleListeningStep: (id, step) => {
        const m = dataRef.current.listening.find((x) => x.id === id);
        if (!m) return;
        const has = m.completedSteps.includes(step);
        const completedSteps = has ? m.completedSteps.filter((s) => s !== step) : [...m.completedSteps, step];
        const patch: Partial<ListeningMaterial> = { completedSteps };
        if (completedSteps.length >= 7 && !m.completedAt) {
          patch.completedAt = nowIso();
          incrementTask("listening", 1);
        }
        persistCollection("listening", (items) => upsert(items, id, patch));
      },
      addShadowing: (id, delta) => {
        persistCollection("listening", (items) =>
          items.map((m) => (m.id === id ? { ...m, shadowingCount: Math.max(0, m.shadowingCount + delta) } : m)),
        );
        incrementTask("shadowing", delta);
      },

      addGrammar: (g) => {
        const order = dataRef.current.grammar.reduce((max, x) => Math.max(max, x.order), 0) + 1;
        const item: GrammarTheme = { ...g, id: newId(), createdAt: nowIso(), order, customSentences: [], status: "todo" };
        persistCollection("grammar", (items) => [...items, item]);
        return item;
      },
      // completedAt records the FIRST completion and is never cleared, so reverting and
      // re-completing a theme cannot inflate the daily count. Analytics filter on status.
      updateGrammar: (id, patch) => persistCollection("grammar", (items) => upsert(items, id, patch)),
      removeGrammar: (id) => persistCollection("grammar", (items) => remove(items, id)),
      completeGrammar: (id) => {
        const g = dataRef.current.grammar.find((x) => x.id === id);
        if (!g || g.status === "done") return;
        // Only the first completion counts toward the daily task; re-completing a reverted theme does not.
        const firstTime = !g.completedAt;
        persistCollection("grammar", (items) => upsert(items, id, { status: "done", completedAt: g.completedAt ?? nowIso() }));
        if (firstTime) incrementTask("grammar", 1);
      },

      saveJournal: (date, patch) => {
        const isToday = date === resolveToday();
        setData((prev) => {
          const existing = prev.journal.find((j) => j.date === date);
          const base: JournalEntry = existing ?? { id: newId(), date, text: "", newExpressions: [], spoken: false, updatedAt: nowIso() };
          const next: JournalEntry = { ...base, ...patch, updatedAt: nowIso() };
          const journal = existing ? prev.journal.map((j) => (j.id === existing.id ? next : j)) : [next, ...prev.journal];
          reportWrite(repo.saveCollection("journal", journal));
          let dailyTasks = prev.dailyTasks;
          if (isToday) {
            const sentences = countSentences(next.text);
            dailyTasks = ensureTasksForDate(prev.dailyTasks, date, prev.settings.targets).tasks.map((t) =>
              t.date === date && t.type === "journal" ? { ...t, completed: sentences } : t,
            );
            reportWrite(repo.saveCollection("dailyTasks", dailyTasks));
          }
          return { ...prev, journal, dailyTasks };
        });
      },
      removeJournal: (id) => persistCollection("journal", (items) => remove(items, id)),

      addMaterial: (m) => {
        const order = dataRef.current.materials.reduce((max, x) => Math.max(max, x.order), 0) + 1;
        persistCollection("materials", (items) => [...items, { ...m, id: newId(), order }]);
      },
      updateMaterial: (id, patch) => persistCollection("materials", (items) => upsert(items, id, patch)),
      removeMaterial: (id) => persistCollection("materials", (items) => remove(items, id)),

      exportJson: () => JSON.stringify({ exportedAt: nowIso(), version: 1, data: dataRef.current }, null, 2),
      importJson: async (json) => {
        const parsed: unknown = JSON.parse(json);
        if (typeof parsed !== "object" || parsed === null) throw new Error("形式が正しくありません");
        const wrapped = parsed as { data?: unknown };
        const incoming = (typeof wrapped.data === "object" && wrapped.data !== null ? wrapped.data : parsed) as Partial<AppData>;
        if (typeof incoming.settings !== "object" || incoming.settings === null || !Array.isArray(incoming.dailyTasks)) {
          throw new Error("形式が正しくありません");
        }
        const base = createInitialData();
        const merged: AppData = {
          ...base,
          ...incoming,
          settings: {
            ...base.settings,
            ...incoming.settings,
            targets: { ...base.settings.targets, ...(incoming.settings.targets ?? {}) },
          },
        };
        const next = withTodayTasks(merged, resolveToday());
        await repo.replaceAll(next);
        setData(next);
        setStorageError(null);
      },
      resetAll: async () => {
        const next = withTodayTasks(createInitialData(), resolveToday());
        await repo.replaceAll(next);
        setData(next);
        setStorageError(null);
      },
    };
  }, [incrementTask, setTaskCompleted, completeTask, updateSettings, persistCollection, repo, reportWrite, resolveToday]);

  const value = useMemo<AppContextValue>(
    () => ({ data, ready, today, storageError, actions }),
    [data, ready, today, storageError, actions],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
