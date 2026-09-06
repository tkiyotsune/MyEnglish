import type { AppData, CollectionName, Settings } from "@/lib/types";
import { createInitialData, DEFAULT_SETTINGS } from "@/lib/seed";
import type { Repository } from "./types";

const PREFIX = "myenglish:v1:";
const SEEDED_KEY = `${PREFIX}seeded`;

const COLLECTIONS: CollectionName[] = [
  "dailyTasks",
  "vocabulary",
  "speaking",
  "mistakes",
  "listening",
  "grammar",
  "journal",
  "materials",
];

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export class LocalStorageRepository implements Repository {
  async loadAll(): Promise<AppData> {
    if (typeof window === "undefined") return createInitialData();

    const seeded = window.localStorage.getItem(SEEDED_KEY) === "1";
    if (!seeded) {
      const data = createInitialData();
      await this.replaceAll(data);
      return data;
    }

    const empty = createInitialData();
    const settings = { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>("settings", {}) };
    settings.targets = { ...DEFAULT_SETTINGS.targets, ...settings.targets };

    const data: AppData = { ...empty, settings };
    for (const name of COLLECTIONS) {
      // Cast is safe: each key stores its own collection array.
      (data as Record<CollectionName, unknown[]>)[name] = read<unknown[]>(name, []);
    }
    return data;
  }

  async saveCollection<K extends CollectionName>(name: K, items: AppData[K]): Promise<void> {
    write(name, items);
  }

  async saveSettings(settings: Settings): Promise<void> {
    write("settings", settings);
  }

  async replaceAll(data: AppData): Promise<void> {
    write("settings", data.settings);
    for (const name of COLLECTIONS) write(name, data[name]);
    window.localStorage.setItem(SEEDED_KEY, "1");
  }
}
