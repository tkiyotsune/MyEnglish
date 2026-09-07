"use client";

import { Suspense, useMemo, useState } from "react";
import { useCardSession } from "@/components/shared/useCardSession";
import { shuffle } from "@/lib/text";
import { useSearchParams } from "next/navigation";
import { Trash2, Eye, Check, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { NativeSelect } from "@/components/shared/NativeSelect";
import { toLines } from "@/components/shared/lines";
import { useApp } from "@/lib/store/AppProvider";
import type { VocabStatus, Vocabulary } from "@/lib/types";
import { tasksForDate } from "@/lib/tasks";

const SOURCES = ["Daily1500", "Basic2400", "DUO", "conversation", "VOA", "custom"];
const CATEGORIES = ["名詞", "動詞", "形容詞", "副詞", "前置詞", "接続詞", "チャンク", "その他"];

function Review() {
  const { data, actions, today } = useApp();
  const [status, setStatus] = useState<VocabStatus | "all">("all");
  const card = useCardSession();
  const task = tasksForDate(data.dailyTasks, today).find((t) => t.type === "reviewVocab");
  const byId = useMemo(() => new Map(data.vocabulary.map((v) => [v.id, v])), [data.vocabulary]);

  const start = () => {
    const pool = data.vocabulary.filter((v) => status === "all" ? v.status !== "mastered" : v.status === status);
    // Oldest reviewed first, then shuffle lightly within.
    const sorted = [...pool].sort((a, b) => (a.lastReviewedAt ?? "").localeCompare(b.lastReviewedAt ?? ""));
    card.start(shuffle(sorted.slice(0, 100)).map((v) => v.id));
  };

  const current: Vocabulary | undefined = card.currentId ? byId.get(card.currentId) : undefined;
  const answer = (remembered: boolean) => {
    if (!current) return;
    actions.reviewVocabulary(current.id, remembered);
    card.advance();
  };

  if (!card.started) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid gap-1.5">
            <Label>対象</Label>
            <NativeSelect value={status} onChange={(e) => setStatus(e.target.value as VocabStatus | "all")}>
              <option value="all">未習得＋復習中</option>
              <option value="new">未習得のみ</option>
              <option value="learning">復習中のみ</option>
              <option value="mastered">習得済み（確認）</option>
            </NativeSelect>
          </div>
          <Button onClick={start}>復習を始める</Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">今日の目標 {task?.target ?? 0}語 · 完了 {task?.completed ?? 0}語</p>
      </div>
    );
  }
  if (!current) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <div className="text-sm text-muted-foreground">復習完了</div>
        <Button className="mt-4" variant="outline" onClick={card.stop}>
          <RotateCcw data-icon="inline-start" />
          もう一度
        </Button>
      </div>
    );
  }
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>残り {card.remaining} 語</span>
        <span className="tabular-nums">今日 {task?.completed ?? 0} / {task?.target ?? 0}</span>
      </div>
      <div className="my-8 text-center">
        <div className="text-3xl font-semibold tracking-tight">{current.word}</div>
        {card.revealed ? (
          <div className="mt-4 space-y-2">
            <div className="text-lg">{current.meaning}</div>
            {current.chunks.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5">
                {current.chunks.map((c) => (
                  <span key={c} className="rounded-md bg-muted px-2 py-0.5 text-xs">{c}</span>
                ))}
              </div>
            )}
            {current.examples.map((ex) => (
              <div key={ex} className="text-sm text-muted-foreground">{ex}</div>
            ))}
          </div>
        ) : (
          <div className="mt-4 text-sm text-muted-foreground">意味と例文を思い出してから</div>
        )}
      </div>
      {!card.revealed ? (
        <Button className="h-12 w-full text-base" onClick={card.reveal}>
          <Eye data-icon="inline-start" />
          答えを見る
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Button className="h-12 text-base" variant="outline" onClick={() => answer(false)}>
            <X data-icon="inline-start" />
            まだ
          </Button>
          <Button className="h-12 text-base" onClick={() => answer(true)}>
            <Check data-icon="inline-start" />
            覚えた
          </Button>
        </div>
      )}
      <button className="mt-4 w-full text-center text-xs text-muted-foreground hover:underline" onClick={card.stop}>
        終了する
      </button>
    </div>
  );
}

function AddForm() {
  const { actions } = useApp();
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [examples, setExamples] = useState("");
  const [chunks, setChunks] = useState("");
  const [category, setCategory] = useState("その他");
  const [source, setSource] = useState("Daily1500");
  const [level, setLevel] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !meaning.trim()) return;
    actions.addVocabulary({
      word: word.trim(),
      meaning: meaning.trim(),
      examples: toLines(examples),
      chunks: toLines(chunks),
      category,
      source,
      level: level.trim() || undefined,
      status: "new",
    });
    setWord("");
    setMeaning("");
    setExamples("");
    setChunks("");
  };

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-lg border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="v-word">word *</Label>
          <Input id="v-word" value={word} onChange={(e) => setWord(e.target.value)} placeholder="available" required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="v-meaning">日本語 *</Label>
          <Input id="v-meaning" value={meaning} onChange={(e) => setMeaning(e.target.value)} placeholder="利用できる・空いている" required />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="v-chunks">chunk（1行1つ）</Label>
        <Textarea id="v-chunks" rows={2} value={chunks} onChange={(e) => setChunks(e.target.value)} placeholder={"available tomorrow\nnot available"} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="v-examples">example（1行1文）</Label>
        <Textarea id="v-examples" rows={3} value={examples} onChange={(e) => setExamples(e.target.value)} placeholder={"Is this room available?\nAre you available tomorrow?"} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label>category</Label>
          <NativeSelect value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label>source</Label>
          <NativeSelect value={source} onChange={(e) => setSource(e.target.value)}>
            {SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="v-level">level</Label>
          <Input id="v-level" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="A2 / B1" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit">追加（新規単語 +1）</Button>
      </div>
    </form>
  );
}

function List() {
  const { data, actions } = useApp();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<VocabStatus | "all">("all");
  const [source, setSource] = useState("all");
  const list = data.vocabulary.filter(
    (v) =>
      (status === "all" || v.status === status) &&
      (source === "all" || v.source === source) &&
      (q === "" || v.word.toLowerCase().includes(q.toLowerCase()) || v.meaning.includes(q)),
  );
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Input className="w-full sm:w-56" placeholder="検索" value={q} onChange={(e) => setQ(e.target.value)} />
        <NativeSelect className="w-auto" value={status} onChange={(e) => setStatus(e.target.value as VocabStatus | "all")}>
          <option value="all">全ステータス</option>
          <option value="new">未習得</option>
          <option value="learning">復習中</option>
          <option value="mastered">習得済み</option>
        </NativeSelect>
        <NativeSelect className="w-auto" value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="all">全source</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </NativeSelect>
        <span className="self-center text-xs text-muted-foreground">{list.length} 語</span>
      </div>
      {list.length === 0 ? (
        <div className="mt-3"><EmptyState>単語がありません。</EmptyState></div>
      ) : (
        <div className="mt-3 divide-y rounded-lg border bg-card">
          {list.map((v) => (
            <div key={v.id} className="flex items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium">{v.word}</span>
                  <span className="text-sm text-muted-foreground">{v.meaning}</span>
                </div>
                {v.chunks.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {v.chunks.map((c) => (
                      <span key={c} className="rounded bg-muted px-1.5 py-0.5 text-xs">{c}</span>
                    ))}
                  </div>
                )}
                {v.examples.map((ex) => (
                  <div key={ex} className="mt-0.5 text-xs text-muted-foreground">{ex}</div>
                ))}
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <StatusBadge status={v.status} />
                  {v.category && <span>{v.category}</span>}
                  <span>{v.source}</span>
                  {v.level && <span>{v.level}</span>}
                  <span>復習 {v.reviewCount}回</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Button variant="ghost" size="icon-sm" aria-label="削除" onClick={() => actions.removeVocabulary(v.id)}>
                  <Trash2 />
                </Button>
                <NativeSelect className="h-7 w-auto text-xs" value={v.status} onChange={(e) => actions.updateVocabulary(v.id, { status: e.target.value as VocabStatus })}>
                  <option value="new">未習得</option>
                  <option value="learning">復習中</option>
                  <option value="mastered">習得済み</option>
                </NativeSelect>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VocabularyTabs() {
  const params = useSearchParams();
  const initial = params.get("tab") ?? "list";
  return (
    <Tabs defaultValue={initial}>
      <TabsList>
        <TabsTrigger value="list">一覧</TabsTrigger>
        <TabsTrigger value="review">復習</TabsTrigger>
        <TabsTrigger value="add">追加</TabsTrigger>
      </TabsList>
      <TabsContent value="list" className="mt-4"><List /></TabsContent>
      <TabsContent value="review" className="mt-4"><Review /></TabsContent>
      <TabsContent value="add" className="mt-4"><AddForm /></TabsContent>
    </Tabs>
  );
}

export default function VocabularyPage() {
  const { data } = useApp();
  const mastered = data.vocabulary.filter((v) => v.status === "mastered").length;
  return (
    <div>
      <PageHeader title="Vocabulary" description={`${data.vocabulary.length} 語 · 習得 ${mastered}`} />
      <Suspense fallback={null}>
        <VocabularyTabs />
      </Suspense>
    </div>
  );
}
