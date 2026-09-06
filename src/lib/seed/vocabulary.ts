import type { Vocabulary } from "@/lib/types";

type Row = [word: string, meaning: string, examples: string[], chunks: string[], category: string];

const ROWS: Row[] = [
  ["available", "利用できる・空いている", ["Is this room available?", "Are you available tomorrow?", "It's not available right now."], ["available tomorrow", "not available"], "形容詞"],
  ["stable", "安定した", ["The Wi-Fi wasn't very stable."], ["a stable connection"], "形容詞"],
  ["convenient", "便利な", ["The location isn't very convenient."], ["convenient for", "a convenient place"], "形容詞"],
  ["crowded", "混んでいる", ["It was quite crowded."], ["get crowded", "a crowded train"], "形容詞"],
  ["for", "〜のために・〜の間", ["I'm here for work.", "I'm staying here for two weeks.", "Wait for me."], ["for two weeks", "for work", "for dinner", "wait for me", "looking for"], "前置詞"],
  ["because", "〜なので", ["I'll go to bed early because I'm tired.", "I chose this one because it's cheaper."], ["because I'm tired", "because it's cheaper", "because I have to work", "because I've never been there"], "接続詞"],
];

export function createVocabularySeed(createdAt: string): Vocabulary[] {
  return ROWS.map(([word, meaning, examples, chunks, category], i) => ({
    id: `seed-vo-${i + 1}`,
    word,
    meaning,
    examples,
    chunks,
    category,
    source: "conversation",
    status: "learning",
    reviewCount: 0,
    createdAt,
  }));
}
