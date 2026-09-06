"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { toLines, fromLines } from "@/components/shared/lines";
import { useApp } from "@/lib/store/AppProvider";
import type { JournalEntry } from "@/lib/types";
import { formatDateJa } from "@/lib/date";

function countSentences(text: string): number {
  return text.split(/\n|(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean).length;
}

function Editor({ date, entry }: { date: string; entry: JournalEntry | undefined }) {
  const { actions } = useApp();
  const [text, setText] = useState(entry?.text ?? "");
  const [corrected, setCorrected] = useState(entry?.corrected ?? "");
  const [expressions, setExpressions] = useState(fromLines(entry?.newExpressions ?? []));
  const [memo, setMemo] = useState(entry?.memo ?? "");

  const save = () => {
    actions.saveJournal(date, {
      text,
      corrected: corrected || undefined,
      newExpressions: toLines(expressions),
      memo: memo || undefined,
    });
  };

  return (
    <div className="grid gap-3 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{formatDateJa(date)}</div>
        <div className="text-xs text-muted-foreground tabular-nums">{countSentences(text)} 文</div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="j-text">英文（1行1文）</Label>
        <Textarea
          id="j-text"
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={save}
          placeholder={"Today I worked at a cafe near my hotel.\nI went there because the Wi-Fi at my hotel wasn't very stable.\n..."}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="j-corrected">添削後英文</Label>
          <Textarea id="j-corrected" rows={4} value={corrected} onChange={(e) => setCorrected(e.target.value)} onBlur={save} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="j-expr">使用した新表現（1行1つ）</Label>
          <Textarea id="j-expr" rows={4} value={expressions} onChange={(e) => setExpressions(e.target.value)} onBlur={save} />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="j-memo">メモ</Label>
        <Input id="j-memo" value={memo} onChange={(e) => setMemo(e.target.value)} onBlur={save} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={entry?.spoken ?? false} onCheckedChange={(v) => actions.saveJournal(date, { text, spoken: v })} />
          この内容を声に出して説明した
        </label>
        <Button onClick={save}>保存</Button>
      </div>
    </div>
  );
}

export default function JournalPage() {
  const { data, actions, today } = useApp();
  const [date, setDate] = useState(today);
  const entry = data.journal.find((j) => j.date === date);
  const history = [...data.journal].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <PageHeader title="Journal" description="今日の出来事を英語で5文。書いたら声に出して説明する">
        <Input type="date" className="w-auto" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
      </PageHeader>

      <Editor key={`${date}:${entry?.id ?? "new"}`} date={date} entry={entry} />

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold">履歴</h2>
        {history.length === 0 ? (
          <EmptyState>まだ日記がありません。</EmptyState>
        ) : (
          <div className="divide-y rounded-lg border bg-card">
            {history.map((j) => (
              <div key={j.id} className="flex items-start gap-3 px-4 py-3">
                <button className="min-w-0 flex-1 text-left" onClick={() => setDate(j.date)}>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDateJa(j.date)}</span>
                    {j.spoken && <span className="text-emerald-600 dark:text-emerald-400">🗣 spoken</span>}
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-sm">{j.text || "（未入力）"}</div>
                </button>
                <Button variant="ghost" size="icon-sm" aria-label="削除" onClick={() => actions.removeJournal(j.id)}>
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
