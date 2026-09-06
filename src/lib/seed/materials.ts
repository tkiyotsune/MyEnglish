import type { Material } from "@/lib/types";

export const MATERIALS_SEED: Material[] = [
  { id: "mat-evine", title: "Mr. Evineの中学英文法を修了するドリル", category: "grammar", status: "active", order: 1 },
  { id: "mat-egiu", title: "English Grammar in Use", category: "grammar", status: "future", note: "B1到達後", order: 2 },
  { id: "mat-daily1500", title: "Daily 1500", category: "vocabulary", status: "active", note: "日常会話語彙を優先", order: 3 },
  { id: "mat-basic2400", title: "Basic 2400", category: "vocabulary", status: "active", order: 4 },
  { id: "mat-duo", title: "DUO 3.0", category: "vocabulary", status: "sub", note: "現段階ではサブ教材", order: 5 },
  { id: "mat-instant", title: "瞬間英作文", category: "speaking", status: "active", order: 6 },
  { id: "mat-voa", title: "VOA Learning English", category: "listening", status: "active", order: 7 },
  { id: "mat-duo-audio", title: "DUO 3.0 音声", category: "listening", status: "active", order: 8 },
  { id: "mat-teded", title: "TED-Ed", category: "listening", status: "future", order: 9 },
  { id: "mat-bbc", title: "BBC", category: "listening", status: "future", order: 10 },
  { id: "mat-youtube", title: "YouTube", category: "listening", status: "future", order: 11 },
  { id: "mat-netflix", title: "Netflix", category: "listening", status: "future", order: 12 },
  { id: "mat-podcast", title: "Podcast", category: "listening", status: "future", order: 13 },
  { id: "mat-duolingo", title: "Duolingo", category: "support", status: "active", order: 14 },
];
