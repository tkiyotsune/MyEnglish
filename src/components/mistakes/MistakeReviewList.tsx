"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useApp } from "@/lib/store/AppProvider";
import { todayKey } from "@/lib/date";

/** Mistakes recorded before today and not yet mastered re-appear here as a review queue. */
export function MistakeReviewList() {
  const { data, actions } = useApp();
  const today = todayKey();
  const queue = data.mistakes.filter((m) => m.status !== "mastered" && m.createdAt.slice(0, 10) < today && (m.lastReviewedAt ?? "").slice(0, 10) !== today);

  if (queue.length === 0) return <EmptyState>復習待ちの表現はありません。会話で言えなかった表現は Mistakes に記録しましょう。</EmptyState>;

  return (
    <div className="divide-y rounded-lg border bg-card">
      {queue.map((m) => (
        <div key={m.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            {m.japanese && <div className="text-xs text-muted-foreground">{m.japanese}</div>}
            <div className="font-medium">{m.correctEnglish}</div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <StatusBadge status={m.status} />
              <span>{m.category}</span>
              <span>復習 {m.reviewCount}回</span>
            </div>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Button size="sm" variant="secondary" onClick={() => actions.reviewMistake(m.id, false)}>言えた（復習継続）</Button>
            <Button size="sm" onClick={() => actions.reviewMistake(m.id, true)}>習得済み</Button>
          </div>
        </div>
      ))}
    </div>
  );
}
