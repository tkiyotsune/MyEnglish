"use client";

import Link from "next/link";
import { Check, Minus, ArrowUpRight } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import type { DailyTask } from "@/lib/types";
import { TASK_META, isTaskDone, isTaskSkipped } from "@/lib/tasks";
import { useApp } from "@/lib/store/AppProvider";
import { withBasePath } from "@/lib/basePath";

export function TaskCard({ task, compact = false }: { task: DailyTask; compact?: boolean }) {
  const { actions } = useApp();
  const meta = TASK_META[task.type];
  const done = isTaskDone(task);
  const skipped = isTaskSkipped(task);
  const ratio = task.target === 0 ? 0 : Math.min(1, task.completed / task.target);
  const external = meta.href.endsWith(".html");

  return (
    <div className={cn("rounded-lg border bg-card p-4", done && "border-emerald-500/40 bg-emerald-500/5", skipped && "opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {external ? (
            <a href={withBasePath(meta.href)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium hover:underline">
              {meta.label}
              <ArrowUpRight className="size-3.5 text-muted-foreground" />
            </a>
          ) : (
            <Link href={meta.href} className="inline-flex items-center gap-1 font-medium hover:underline">
              {meta.label}
              <ArrowUpRight className="size-3.5 text-muted-foreground" />
            </Link>
          )}
          {!compact && <p className="mt-0.5 text-xs text-muted-foreground">{meta.description}</p>}
        </div>
        <div className="shrink-0 text-right tabular-nums">
          <span className={cn("text-2xl font-semibold", done && "text-emerald-600 dark:text-emerald-400")}>{task.completed}</span>
          <span className="text-sm text-muted-foreground">{skipped ? " 目標なし" : ` / ${task.target}${meta.unit}`}</span>
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full bg-primary transition-all", done && "bg-emerald-500")}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Button variant="outline" size="icon-sm" aria-label="-1" onClick={() => actions.incrementTask(task.type, -1)} disabled={task.completed === 0}>
          <Minus />
        </Button>
        {meta.steps.map((n) => (
          <Button key={n} variant="secondary" size="sm" className="min-w-12" onClick={() => actions.incrementTask(task.type, n)}>
            +{n}
          </Button>
        ))}
        <Button
          variant={done ? "outline" : "default"}
          size="sm"
          className="ml-auto"
          onClick={() => actions.completeTask(task.type)}
          disabled={done || skipped}
        >
          <Check data-icon="inline-start" />
          完了
        </Button>
      </div>
    </div>
  );
}
