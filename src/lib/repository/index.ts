import { LocalStorageRepository } from "./localStorageRepository";
import type { Repository } from "./types";

let instance: Repository | null = null;

export function getRepository(): Repository {
  if (!instance) instance = new LocalStorageRepository();
  return instance;
}

export type { Repository };
