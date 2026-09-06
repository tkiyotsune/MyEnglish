import type { AppData, CollectionName, Settings } from "@/lib/types";

/**
 * Data access boundary. The UI never touches storage directly.
 * Swapping LocalStorage for Supabase means implementing this interface.
 */
export interface Repository {
  loadAll(): Promise<AppData>;
  saveCollection<K extends CollectionName>(
    name: K,
    items: AppData[K],
  ): Promise<void>;
  saveSettings(settings: Settings): Promise<void>;
  /** Replace the whole dataset (used by import). */
  replaceAll(data: AppData): Promise<void>;
}
