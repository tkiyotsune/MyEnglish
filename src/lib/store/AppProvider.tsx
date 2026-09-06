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
  TaskType,
  Vocabulary,
} from "@/lib/types";
import { getRepository } from "@/lib/repository";
import { createInitialData } from "@/lib/seed";
import { ensureTasksForDate } from "@/lib/tasks";
import { nowIso, todayKey } from "@/lib/date";
import { newId } from "@/lib/id";

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
  actions: Actions;
};

const AppContext = createContext<AppContextValue | null>(null);

function countSentences(text: string): number {
  return text
    .split(/\n|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0).length;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const repo = useMemo(() => getRepository(), []);
  const [data, setData] = useState<AppData>(() => createInitialData());
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState(() => todayKey());
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Load persisted data once.
  useEffect(() => {
    let cancelled = false;
    repo.loadAll().then((loaded) => {
      if (cancelled) return;
      const date = todayKey();
      const ensured = ensureTasksForDate(loaded.dailyTasks, date, loaded.settings.targets);
      const next = { ...loaded, dailyTasks: ensured.tasks };
      setData(next);
      setToday(date);
      setReady(true);
      if (ensured.changed) void repo.saveCollection("dailyTasks", ensured.tasks);
    });
    return () => {
      cancelled = true;
    };
  }, [repo]);

  // Roll over to a new day when the date changes while the app is open.
  useEffect(() => {
    const check = () => {
      const date = todayKey();
      if (date !== today) setToday(date);
    };
    const id = window.setInterval(check, 60_000);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", check);
    };
  }, [today]);

  const persistCollection = useCallback(
    <K extends CollectionName>(name: K, updater: (items: AppData[K]) => AppData[K]) => {
      setData((prev) => {
        const items = updater(prev[name]);
        void repo.saveCollection(name, items);
        return { ...prev, [name]: items };
      });
    },
    [repo],
  );

  useEffect(() => {
    if (!ready) return;
    persistCollection("dailyTasks", (tasks) => ensureTasksForDate(tasks, today, dataRef.current.settings.targets).tasks);
  }, [ready, today, persistCollection]);

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      setData((prev) => {
        const settings = { ...prev.settings, ...patch, targets: { ...prev.settings.targets, ...(patch.targets ?? {}) } };
        void repo.saveSettings(settings);
        // Apply new targets to today's tasks that haven't been touched yet.
        let dailyTasks = prev.dailyTasks;
        if (patch.targets) {
          dailyTasks = prev.dailyTasks.map((t) =>
            t.date === todayKey() ? { ...t, target: settings.targets[t.type] } : t,
          );
          void repo.saveCollection("dailyTasks", dailyTasks);
        }
        return { ...prev, settings, dailyTasks };
      });
    },
    [repo],
  );

  const patchTask = useCallback(
    (type: TaskType, fn: (t: DailyTask) => DailyTask) => {
      const date = todayKey();
      persistCollection("dailyTasks", (tasks) => {
        const ensured = ensureTasksForDate(tasks, date, dataRef.current.settings.targets).tasks;
        return ensured.map((t) => (t.date === date && t.type === type ? fn(t) : t));
      });
    },
    [persistCollection],
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
        const date = todayKey();
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
        const allDone = completedSteps.length >= 7;
        if (allDone && !m.completedAt) {
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
      updateGrammar: (id, patch) => persistCollection("grammar", (items) => upsert(items, id, patch)),
      removeGrammar: (id) => persistCollection("grammar", (items) => remove(items, id)),
      completeGrammar: (id) => {
        const g = dataRef.current.grammar.find((x) => x.id === id);
        if (!g || g.status === "done") return;
        persistCollection("grammar", (items) => upsert(items, id, { status: "done", completedAt: nowIso() }));
        incrementTask("grammar", 1);
      },

      saveJournal: (date, patch) => {
        let sentences = 0;
        persistCollection("journal", (items) => {
          const existing = items.find((j) => j.date === date);
          const base: JournalEntry = existing ?? {
            id: newId(),
            date,
            text: "",
            newExpressions: [],
            spoken: false,
            updatedAt: nowIso(),
          };
          const next = { ...base, ...patch, updatedAt: nowIso() };
          sentences = countSentences(next.text);
          return existing ? items.map((j) => (j.id === existing.id ? next : j)) : [next, ...items];
        });
        if (date === todayKey()) setTaskCompleted("journal", sentences);
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
        const parsed = JSON.parse(json) as { data?: AppData } | AppData;
        const incoming = "data" in parsed && parsed.data ? parsed.data : (parsed as AppData);
        if (!incoming.settings || !Array.isArray(incoming.dailyTasks)) throw new Error("形式が正しくありません");
        const base = createInitialData();
        const merged: AppData = { ...base, ...incoming, settings: { ...base.settings, ...incoming.settings } };
        await repo.replaceAll(merged);
        setData(merged);
      },
      resetAll: async () => {
        const fresh = createInitialData();
        await repo.replaceAll(fresh);
        setData(fresh);
      },
    };
  }, [incrementTask, setTaskCompleted, completeTask, updateSettings, persistCollection, repo]);

  const value = useMemo<AppContextValue>(() => ({ data, ready, today, actions }), [data, ready, today, actions]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
