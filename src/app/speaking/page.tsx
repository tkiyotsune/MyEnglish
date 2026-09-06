"use client";

import { useMemo, useState } from "react";
import { Trash2, Eye, Check, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { NativeSelect } from "@/components/shared/NativeSelect";
import { useApp } from "@/lib/store/AppProvider";
import type { SpeakingSentence } from "@/lib/types";
import { tasksForDate } from "@/lib/tasks";

export const SPEAKING_CATEGORIES = ["SVO", "SVC", "疑問文", "現在形", "過去形", "現在完了", "前置詞", "接続詞", "助動詞", "日常会話", "単語", "文法", "時制", "その他"];
const LEVELS = ["A1", "A2", "B1", "B2", "custom"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Practice() {
  const { data, actions, today } = useApp();
  const [category, setCategory] = useState("all");
  const [onlyLearning, setOnlyLearning] = useState(true);
  const [queue, setQueue] = useState<string[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [session, setSession] = useState({ ok: 0, ng: 0 });

  const task = tasksForDate(data.dailyTasks, today).find((t) => t.type === "speaking");
  const byId = useMemo(() => new Map(data.speaking.map((s) => [s.id, s])), [data.speaking]);

  const start = () => {
    const queued = data.speaking.filter((s) => s.queuedDate === today);
    const pool = data.speaking.filter(
      (s) => s.queuedDate !== today && (category === "all" || s.category === category) && (!onlyLearning || s.status === "learning"),
    );
    setQueue([...queued.map((s) => s.id), ...shuffle(pool).map((s) => s.id)]);
    setRevealed(false);
    setSession({ ok: 0, ng: 0 });
  };

  const current: SpeakingSentence | undefined = queue && queue.length > 0 ? byId.get(queue[0]) : undefined;

  const answer = (success: boolean) => {
    if (!current) return;
    actions.practiceSpeaking(current.id, success);
    setSession((s) => ({ ok: s.ok + (success ? 1 : 0), ng: s.ng + (success ? 0 : 1) }));
    setQueue((q) => (q ? q.slice(1) : q));
    setRevealed(false);
  };

  if (!queue) {
    const queuedCount = data.speaking.filter((s) => s.queuedDate === today).length;
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div className="grid gap-1.5">
            <Label>カテゴリ</Label>
            <NativeSelect value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">すべて</option>
              {SPEAKING_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </NativeSelect>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyLearning} onChange={(e) => setOnlyLearning(e.target.checked)} />
            未習得のみ
          </label>
          <Button onClick={start}>練習を始める</Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          今日の目標 {task?.target ?? 0}問 · 完了 {task?.completed ?? 0}問
          {queuedCount > 0 && ` · Mistakes から ${queuedCount} 文が先頭に入ります`}
        </p>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <div className="text-sm text-muted-foreground">セッション終了</div>
        <div className="mt-2 text-2xl font-semibold tabular-nums">
          {session.ok} <span className="text-sm text-muted-foreground">正解</span> / {session.ng} <span className="text-sm text-muted-foreground">不正解</span>
        </div>
        <Button className="mt-4" variant="outline" onClick={() => setQueue(null)}>
          <RotateCcw data-icon="inline-start" />
          もう一度
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>残り {queue.length} 問 · {current.category} · {current.level}</span>
        <span className="tabular-nums">今日 {task?.completed ?? 0} / {task?.target ?? 0}</span>
      </div>
      <div className="my-8 min-h-24 text-center">
        <div className="text-xl font-medium leading-relaxed">{current.japanese || "（日本語なし）"}</div>
        {revealed ? (
          <div className="mt-4 text-lg text-emerald-600 dark:text-emerald-400">{current.english}</div>
        ) : (
          <div className="mt-4 text-sm text-muted-foreground">声に出してから答えを見る</div>
        )}
      </div>
      {!revealed ? (
        <Button className="h-12 w-full text-base" onClick={() => setRevealed(true)}>
          <Eye data-icon="inline-start" />
          答えを見る
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Button className="h-12 text-base" variant="outline" onClick={() => answer(false)}>
            <X data-icon="inline-start" />
            言えなかった
          </Button>
          <Button className="h-12 text-base" onClick={() => answer(true)}>
            <Check data-icon="inline-start" />
            言えた
          </Button>
        </div>
      )}
      <button className="mt-4 w-full text-center text-xs text-muted-foreground hover:underline" onClick={() => setQueue(null)}>
        終了する
      </button>
    </div>
  );
}

function AddForm() {
  const { actions } = useApp();
  const [japanese, setJapanese] = useState("");
  const [english, setEnglish] = useState("");
  const [category, setCategory] = useState("日常会話");
  const [level, setLevel] = useState("A2");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!japanese.trim() || !english.trim()) return;
    actions.addSpeaking({ japanese: japanese.trim(), english: english.trim(), category, level, source: "custom" });
    setJapanese("");
    setEnglish("");
  };

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-lg border bg-card p-4">
      <div className="grid gap-1.5">
        <Label htmlFor="sp-ja">日本語</Label>
        <Input id="sp-ja" value={japanese} onChange={(e) => setJapanese(e.target.value)} required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="sp-en">英語</Label>
        <Input id="sp-en" value={english} onChange={(e) => setEnglish(e.target.value)} required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>カテゴリ</Label>
          <NativeSelect value={category} onChange={(e) => setCategory(e.target.value)}>
            {SPEAKING_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label>難易度</Label>
          <NativeSelect value={level} onChange={(e) => setLevel(e.target.value)}>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit">追加</Button>
      </div>
    </form>
  );
}

function List() {
  const { data, actions } = useApp();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const list = data.speaking.filter(
    (s) =>
      (category === "all" || s.category === category) &&
      (q === "" || s.japanese.includes(q) || s.english.toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Input className="w-full sm:w-64" placeholder="検索" value={q} onChange={(e) => setQ(e.target.value)} />
        <NativeSelect className="w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">全カテゴリ</option>
          {SPEAKING_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </NativeSelect>
        <span className="self-center text-xs text-muted-foreground">{list.length} 問</span>
      </div>
      {list.length === 0 ? (
        <div className="mt-3"><EmptyState>該当する文がありません。</EmptyState></div>
      ) : (
        <div className="mt-3 divide-y rounded-lg border bg-card">
          {list.map((s) => (
            <div key={s.id} className="flex items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground">{s.japanese}</div>
                <div className="font-medium">{s.english}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <StatusBadge status={s.status} />
                  <span>{s.category}</span>
                  <span>{s.level}</span>
                  <span className="tabular-nums">○{s.successCount} ×{s.failureCount}</span>
                  {s.lastPracticedAt && <span>最終 {s.lastPracticedAt.slice(0, 10)}</span>}
                  {s.source === "mistake" && <span>from Mistakes</span>}
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" aria-label="削除" onClick={() => actions.removeSpeaking(s.id)}>
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SpeakingPage() {
  const { data } = useApp();
  const mastered = data.speaking.filter((s) => s.status === "mastered").length;
  return (
    <div>
      <PageHeader title="Speaking" description={`瞬間英作文 · ${data.speaking.length} 文 · 習得 ${mastered}`} />
      <Tabs defaultValue="practice">
        <TabsList>
          <TabsTrigger value="practice">練習</TabsTrigger>
          <TabsTrigger value="list">一覧</TabsTrigger>
          <TabsTrigger value="add">追加</TabsTrigger>
        </TabsList>
        <TabsContent value="practice" className="mt-4"><Practice /></TabsContent>
        <TabsContent value="list" className="mt-4"><List /></TabsContent>
        <TabsContent value="add" className="mt-4"><AddForm /></TabsContent>
      </Tabs>
    </div>
  );
}
