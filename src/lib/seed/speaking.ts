import type { SpeakingSentence } from "@/lib/types";

type Row = [japanese: string, english: string, category: string, level: string];

const ROWS: Row[] = [
  ["これはあなたのですか？", "Are these yours?", "疑問文", "A2"],
  ["私はジムに行きました。", "I went to the gym.", "過去形", "A1"],
  ["このホテルが好きです。", "I like this hotel.", "SVO", "A1"],
  ["そこに行きたいです。", "I want to go there.", "SVO", "A1"],
  ["タイに行ったことはありますか？", "Have you ever been to Thailand?", "現在完了", "A2"],
  ["ここに2週間滞在する予定です。", "I'm going to stay here for two weeks.", "前置詞", "A2"],
  ["3年間日本語を勉強しています。", "I've been studying Japanese for three years.", "現在完了", "B1"],
  ["友達とそこに行きました。", "I went there with my friend.", "前置詞", "A1"],
  ["この部屋は空いていますか？", "Is this room available?", "疑問文", "A2"],
  ["明日は空いていますか？", "Are you available tomorrow?", "疑問文", "A2"],
  ["疲れているので早く寝ます。", "I'll go to bed early because I'm tired.", "接続詞", "A2"],
  ["Wi-Fiが不安定でした。", "The Wi-Fi wasn't very stable.", "SVC", "A2"],
  ["カフェで3時間くらい仕事しました。", "I worked at a cafe for about three hours.", "前置詞", "A2"],
  ["安いのでこちらを選びました。", "I chose this one because it's cheaper.", "接続詞", "A2"],
  ["仕事が終わったらジムに行きます。", "I'll go to the gym after I finish work.", "接続詞", "B1"],
  ["混んでいましたが、いいトレーニングができました。", "It was quite crowded, but I had a good workout.", "接続詞", "B1"],
  ["ここに来るのは初めてです。", "This is my first time here.", "SVC", "A1"],
  ["電車で行くべきですか？", "Should I take the train?", "助動詞", "A2"],
  ["今、夕食を待っています。", "I'm waiting for dinner now.", "現在形", "A1"],
  ["近くにいいレストランはありますか？", "Is there a good restaurant near here?", "日常会話", "A2"],
];

export function createSpeakingSeed(createdAt: string): SpeakingSentence[] {
  return ROWS.map(([japanese, english, category, level], i) => ({
    id: `seed-sp-${i + 1}`,
    japanese,
    english,
    category,
    level,
    successCount: 0,
    failureCount: 0,
    status: "learning",
    source: "seed",
    createdAt,
  }));
}
