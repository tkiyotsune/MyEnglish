"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { useApp } from "@/lib/store/AppProvider";
import { ROADMAP } from "@/lib/seed/roadmap";
import { currentPhase } from "@/lib/roadmap";
import { addDays, formatShort } from "@/lib/date";
import { cn } from "cn";

export default function RoadmapPage() {
  const { data, today } = useApp();
  const { phase: current, dayInPhase } = currentPhase(data.settings, today);
  const currentIdx = ROADMAP.findIndex((p) => p.id === current.id);

  const ranges = ROADMAP.reduce<{ start: string; end: string | null }[]>((acc, p) => {
    const prev = acc[acc.length - 1];
    const start = prev?.end ? addDays(prev.end, 1) : data.settings.startDate;
    const end = p.durationDays ? addDays(start, p.durationDays - 1) : null;
    return [...acc, { start, end }];
  }, []);

  return (
    <div>
      <PageHeader title="Roadmap" description={`開始日 ${data.settings.startDate} · 最終目標 CEFR C1 / IELTS 7.0`} />
      <ol className="relative space-y-4 border-l pl-6">
        {ROADMAP.map((p, i) => {
          const state = i < currentIdx ? "done" : i === currentIdx ? "current" : "upcoming";
          const r = ranges[i];
          return (
            <li key={p.id} className="relative">
              <span
                className={cn(
                  "absolute -left-[31px] top-4 size-3 rounded-full border-2 bg-background",
                  state === "done" && "border-emerald-500 bg-emerald-500",
                  state === "current" && "border-primary bg-primary",
                  state === "upcoming" && "border-muted-foreground/40",
                )}
              />
              <div className={cn("rounded-lg border bg-card p-4", state === "current" && "border-primary", state === "upcoming" && "opacity-70")}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{p.label}</span>
                    <h2 className="text-base font-semibold">{p.title}</h2>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {state === "current" && <span className="mr-2 rounded bg-primary px-1.5 py-0.5 text-primary-foreground">現在 · Day {dayInPhase + 1}</span>}
                    {r.end ? `${formatShort(r.start)} – ${formatShort(r.end)}` : `${formatShort(r.start)} –`}
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{p.theme}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">重点</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {p.focus.map((f) => (
                        <span key={f} className="rounded bg-muted px-1.5 py-0.5 text-xs">{f}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">例</div>
                    <ul className="mt-1 space-y-0.5 text-sm">
                      {p.examples.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-3 border-t pt-2 text-sm">
                  <span className="text-xs font-medium text-muted-foreground">目標：</span>
                  {p.goal}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
