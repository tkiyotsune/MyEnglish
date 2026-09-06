"use client";

import { useState } from "react";
import { Trash2, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { NativeSelect } from "@/components/shared/NativeSelect";
import { MistakeForm, MISTAKE_CATEGORIES } from "@/components/mistakes/MistakeForm";
import { useApp } from "@/lib/store/AppProvider";
import type { MistakeStatus } from "@/lib/types";
import { formatShort } from "@/lib/date";

const STATUS_OPTIONS: { value: MistakeStatus | "all"; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "new", label: "未習得" },
  { value: "reviewing", label: "復習中" },
  { value: "mastered", label: "習得済み" },
];

export default function MistakesPage() {
  const { data, actions, today } = useApp();
  const [status, setStatus] = useState<MistakeStatus | "all">("all");
  const [category, setCategory] = useState<string>("all");
  const [showForm, setShowForm] = useState(true);

  const list = data.mistakes.filter(
    (m) => (status === "all" || m.status === status) && (category === "all" || m.category === category),
  );
  const queuedIds = new Set(data.speaking.filter((s) => s.queuedDate === today && s.mistakeId).map((s) => s.mistakeId));

  return (
    <div>
      <PageHeader title="Mistakes" description="言えなかった・間違えた表現を資産化する">
        <Button variant="outline" onClick={() => setShowForm((v) => !v)}>{showForm ? "フォームを閉じる" : "＋ 記録する"}</Button>
      </PageHeader>

      {showForm && <MistakeForm />}

      <div className="mt-6 flex flex-wrap gap-2">
        <NativeSelect className="w-auto" value={status} onChange={(e) => setStatus(e.target.value as MistakeStatus | "all")}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </NativeSelect>
        <NativeSelect className="w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">全カテゴリ</option>
          {MISTAKE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </NativeSelect>
        <span className="self-center text-xs text-muted-foreground">{list.length} 件</span>
      </div>

      {list.length === 0 ? (
        <div className="mt-3"><EmptyState>まだ記録がありません。</EmptyState></div>
      ) : (
        <div className="mt-3 divide-y rounded-lg border bg-card">
          {list.map((m) => (
            <div key={m.id} className="px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  {m.japanese && <div className="text-xs text-muted-foreground">{m.japanese}</div>}
                  <div className="font-medium">{m.correctEnglish}</div>
                  {m.attemptedEnglish && <div className="text-xs text-muted-foreground line-through">{m.attemptedEnglish}</div>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <StatusBadge status={m.status} />
                    <span>{m.category}</span>
                    <span>{formatShort(m.createdAt.slice(0, 10))} 記録</span>
                    <span>復習 {m.reviewCount}回</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label="削除" onClick={() => actions.removeMistake(m.id)}>
                  <Trash2 />
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Button
                  size="sm"
                  variant={queuedIds.has(m.id) ? "outline" : "secondary"}
                  disabled={queuedIds.has(m.id)}
                  onClick={() => actions.queueMistakeForSpeaking(m.id)}
                >
                  <MessageSquarePlus data-icon="inline-start" />
                  {queuedIds.has(m.id) ? "今日の瞬間英作文に追加済み" : "今日の瞬間英作文に追加"}
                </Button>
                <NativeSelect
                  className="h-7 w-auto text-xs"
                  value={m.status}
                  onChange={(e) => actions.updateMistake(m.id, { status: e.target.value as MistakeStatus })}
                >
                  <option value="new">未習得</option>
                  <option value="reviewing">復習中</option>
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
