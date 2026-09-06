"use client";

import Link from "next/link";
import { Flame, ArrowRight } from "lucide-react";
import { useApp } from "@/lib/store/AppProvider";
import { PageHeader } from "@/components/shared/PageHeader";
import { Stat } from "@/components/shared/Stat";
import { buttonVariants } from "@/components/ui/button";
import { TaskCard } from "@/components/today/TaskCard";
import { TASK_META, computeStreak, dayProgress, isTaskDone, tasksForDate } from "@/lib/tasks";
import { addDays, formatDateJa } from "@/lib/date";
import { currentPhase } from "@/lib/roadmap";
import { cn } from "cn";

export default function DashboardPage() {
  const { data, today } = useApp();
  const tasks = tasksForDate(data.dailyTasks, today);
  const progress = dayProgress(tasks);
  const streak = computeStreak(data.dailyTasks, today, addDays);
  const { phase, dayInPhase } = currentPhase(data.settings, today);
  const remaining = tasks.filter((t) => !isTaskDone(t));
  const openMistakes = data.mistakes.filter((m) => m.status !== "mastered").length;

  return (
    <div>
      <PageHeader title={formatDateJa(today)} description="Today's Progress">
        <Link href="/today/" className={buttonVariants()}>
          学習を始める
          <ArrowRight data-icon="inline-end" />
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Tasks completed" value={`${progress.done} / ${progress.total}`} hint={`${Math.round(progress.ratio * 100)}%`} />
        <Stat
          label="Streak"
          value={
            <span className="inline-flex items-center gap-1">
              <Flame className={cn("size-5", streak > 0 ? "text-orange-500" : "text-muted-foreground")} />
              {streak}
              <span className="text-sm font-normal text-muted-foreground">days</span>
            </span>
          }
        />
        <Stat label="Phase" value={phase.label} hint={phase.durationDays ? `Day ${dayInPhase + 1} / ${phase.durationDays} · ${phase.title}` : phase.title} />
        <Stat label="Open mistakes" value={openMistakes} hint="未習得・復習中の表現" />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">今日残っているタスク</h2>
          <span className="text-xs text-muted-foreground">{remaining.length} 件</span>
        </div>
        {remaining.length === 0 ? (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 px-4 py-6 text-center text-sm">
            今日のタスクはすべて完了しました 🎉
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {remaining.map((t) => (
              <TaskCard key={t.id} task={t} compact />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold">今日のタスク一覧</h2>
        <div className="divide-y rounded-lg border bg-card">
          {tasks.map((t) => {
            const meta = TASK_META[t.type];
            const done = isTaskDone(t);
            const ratio = t.target === 0 ? 0 : Math.min(1, t.completed / t.target);
            return (
              <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className={cn("size-2 rounded-full", done ? "bg-emerald-500" : t.completed > 0 ? "bg-amber-500" : "bg-muted-foreground/30")} />
                <span className="w-32 shrink-0 truncate">{meta.label}</span>
                <div className="hidden h-1 flex-1 overflow-hidden rounded-full bg-muted sm:block">
                  <div className={cn("h-full bg-primary", done && "bg-emerald-500")} style={{ width: `${ratio * 100}%` }} />
                </div>
                <span className="ml-auto tabular-nums text-muted-foreground">
                  {t.completed} / {t.target}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
