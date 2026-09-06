import type { GrammarTheme } from "@/lib/types";

const EVINE = "Mr. Evineの中学英文法を修了するドリル";

const THEMES: [title: string, examples: string[]][] = [
  ["be動詞（現在・過去）", ["I'm a freelancer.", "It was hot yesterday."]],
  ["一般動詞（現在・過去）", ["I work at a cafe.", "I went to the gym."]],
  ["疑問文・否定文", ["Do you like coffee?", "I don't have a car."]],
  ["this / that / these / those", ["Are these yours?", "That's my bag."]],
  ["There is / There are", ["Is there a good restaurant near here?"]],
  ["進行形（現在・過去）", ["I'm staying at a hotel.", "I was working then."]],
  ["未来表現（will / be going to）", ["I'm going to stay here for two weeks.", "I'll call you later."]],
  ["助動詞（can / should / have to / must）", ["Should I take the train?", "I have to work tomorrow."]],
  ["現在完了", ["Have you ever been to Thailand?", "I've been here for a week."]],
  ["前置詞（for / in / at / on / with / to）", ["I'm here for work.", "I went there with my friend."]],
  ["接続詞（and / but / so / because）", ["I chose this one because it's cheaper."]],
  ["接続詞（if / when / before / after / while / although）", ["I'll go to the gym after I finish work."]],
  ["比較（比較級・最上級）", ["This hotel is cheaper than that one."]],
  ["不定詞・動名詞", ["I want to go there.", "I like working at cafes."]],
  ["受動態", ["This room was cleaned this morning."]],
  ["関係代名詞", ["This is the cafe that I told you about."]],
];

export function createGrammarSeed(createdAt: string): GrammarTheme[] {
  return THEMES.map(([title, exampleSentences], i) => ({
    id: `seed-gr-${i + 1}`,
    title,
    source: EVINE,
    status: "todo",
    exampleSentences,
    customSentences: [],
    order: i + 1,
    createdAt,
  }));
}
