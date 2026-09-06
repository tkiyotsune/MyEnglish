"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Stat } from "@/components/shared/Stat";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from "@/lib/store/AppProvider";
import { TASK_META, dayProgress, isStudyDay } from "@/lib/tasks";
import type { TaskType } from "@/lib/types";
import { addDays, formatShort } from "@/lib/date";
import { cn } from "cn";

type Range = "7" | "30" | "all";

export default function AnalyticsPage() {
  const { data, today } = useApp();
  const [range, setRange] = useState<Range>("7");
  const from = range === "all" ? "0000-00-00" : addDays(today, -(Number(range) - 1));
  const inRange = (date: string) => date >= from && date <= today;

  const tasks = data.dailyTasks.filter((t) => inRange(t.date));
  const sum = (type: TaskType) => tasks.filter((t) => t.type === type).reduce((a, t) => a + t.completed, 0);

  const masteredVocab = data.vocabulary.filter((v) => v.status === "mastered").length;
  const learnedVocabInRange = data.vocabulary.filter((v) => !v.id.startsWith("seed-") && inRange(v.createdAt.slice(0, 10))).length;
  const listeningDone = data.listening.filter((m) => m.completedAt && inRange(m.completedAt.slice(0, 10))).length;
  const grammarDone = data.grammar.filter((g) => g.completedAt && inRange(g.completedAt.slice(0, 10))).length;
  const journalDays = data.journal.filter((j) => inRange(j.date) && j.text.trim()).length;
  const mistakesResolved = data.mistakes.filter((m) => m.status === "mastered" && m.lastReviewedAt && inRange(m.lastReviewedAt.slice(0, 10))).length;

  const studyDays = new Set(data.dailyTasks.filter((t) => inRange(t.date) && t.completed > 0).map((t) => t.date)).size;

  // Last 14 days daily completion ratio
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, -(13 - i)));
  const daily = days.map((d) => {
    const ts = data.dailyTasks.filter((t) => t.date === d);
    return { date: d, ratio: dayProgress(ts).ratio, studied: isStudyDay(ts) };
  });

  return (
    <div>
      <PageHeader title="Analytics" description="時間ではなく「数」で学習量を見る">
        <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
          <TabsList>
            <TabsTrigger value="7">7日間</TabsTrigger>
            <TabsTrigger value="30">30日間</TabsTrigger>
            <TabsTrigger value="all">累計</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="瞬間英作文" value={sum("speaking")} hint="問" />
        <Stat label="新規単語" value={learnedVocabInRange} hint={`登録 · 習得済み累計 ${masteredVocab}`} />
        <Stat label="復習単語" value={sum("reviewVocab")} hint="語" />
        <Stat label="前置詞・接続詞" value={sum("chunks")} hint="表現" />
        <Stat label="Listening素材" value={Math.max(listeningDone, sum("listening"))} hint="素材" />
        <Stat label="Shadowing" value={sum("shadowing")} hint="周" />
        <Stat label="Grammar Unit" value={Math.max(grammarDone, sum("grammar"))} hint="テーマ" />
        <Stat label="Journal日数" value={journalDays} hint="日" />
        <Stat label="Mistake解消" value={mistakesResolved} hint={`習得済み · 未解消 ${data.mistakes.filter((m) => m.status !== "mastered").length}`} />
        <Stat label="学習日数" value={studyDays} hint="日" />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold">直近14日の達成率</h2>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex h-32 items-end gap-1.5">
            {daily.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1" title={`${d.date}: ${Math.round(d.ratio * 100)}%`}>
                <div className="flex h-24 w-full items-end rounded-sm bg-muted">
                  <div
                    className={cn("w-full rounded-sm", d.ratio >= 1 ? "bg-emerald-500" : d.studied ? "bg-primary" : "bg-transparent")}
                    style={{ height: `${Math.max(d.studied ? 4 : 0, d.ratio * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{formatShort(d.date)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold">タスク別合計</h2>
        <div className="divide-y rounded-lg border bg-card">
          {(Object.keys(TASK_META) as TaskType[]).map((type) => {
            const meta = TASK_META[type];
            const total = sum(type);
            const target = tasks.filter((t) => t.type === type).reduce((a, t) => a + t.target, 0);
            const ratio = target === 0 ? 0 : Math.min(1, total / target);
            return (
              <div key={type} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="w-32 shrink-0 truncate">{meta.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${ratio * 100}%` }} />
                </div>
                <span className="w-28 text-right tabular-nums text-muted-foreground">
                  {total} / {target}{meta.unit}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
