"use client";

import { useState } from "react";
import { Trash2, ChevronDown, ChevronUp, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { NativeSelect } from "@/components/shared/NativeSelect";
import { toLines, fromLines } from "@/components/shared/lines";
import { useApp } from "@/lib/store/AppProvider";
import type { GrammarStatus, GrammarTheme } from "@/lib/types";
import { cn } from "cn";

function ThemeCard({ g }: { g: GrammarTheme }) {
  const { actions } = useApp();
  const [open, setOpen] = useState(g.status === "in_progress");
  const custom = g.customSentences.length;
  return (
    <div className={cn("rounded-lg border bg-card", g.status === "done" && "border-emerald-500/40")}>
      <div className="flex items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="font-medium">{g.title}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <StatusBadge status={g.status} />
            <span>{g.source}</span>
            <span className={cn(custom >= 5 && "text-emerald-600 dark:text-emerald-400")}>自作文 {custom} / 5</span>
          </div>
        </div>
        <NativeSelect className="h-7 w-auto text-xs" value={g.status} onChange={(e) => {
          const status = e.target.value as GrammarStatus;
          if (status === "done") actions.completeGrammar(g.id);
          else actions.updateGrammar(g.id, { status });
        }}>
          <option value="todo">未着手</option>
          <option value="in_progress">学習中</option>
          <option value="done">完了</option>
        </NativeSelect>
        <Button variant="ghost" size="icon-sm" onClick={() => setOpen((v) => !v)} aria-label="展開">
          {open ? <ChevronUp /> : <ChevronDown />}
        </Button>
      </div>
      {open && (
        <div className="grid gap-3 border-t p-4">
          <div className="grid gap-1.5">
            <Label>例文（1行1文）</Label>
            <Textarea rows={3} defaultValue={fromLines(g.exampleSentences)} onBlur={(e) => actions.updateGrammar(g.id, { exampleSentences: toLines(e.target.value) })} />
          </div>
          <div className="grid gap-1.5">
            <Label>この文法を使った自作文（5文・1行1文）</Label>
            <Textarea rows={5} defaultValue={fromLines(g.customSentences)} onBlur={(e) => actions.updateGrammar(g.id, { customSentences: toLines(e.target.value) })} placeholder={"I've been in Bangkok for a week.\n..."} />
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={() => actions.removeGrammar(g.id)}>
              <Trash2 data-icon="inline-start" />
              削除
            </Button>
            {g.status !== "done" && (
              <Button size="sm" onClick={() => actions.completeGrammar(g.id)}>
                <Check data-icon="inline-start" />
                完了にする（文法 +1）
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GrammarPage() {
  const { data, actions } = useApp();
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("Mr. Evineの中学英文法を修了するドリル");
  const done = data.grammar.filter((g) => g.status === "done").length;
  const sorted = [...data.grammar].sort((a, b) => a.order - b.order);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    actions.addGrammar({ title: title.trim(), source, exampleSentences: [] });
    setTitle("");
  };
  return (
    <div>
      <PageHeader title="Grammar" description={`${done} / ${data.grammar.length} テーマ完了`} />
      <form onSubmit={submit} className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[2fr_2fr_auto] sm:items-end">
        <div className="grid gap-1.5">
          <Label htmlFor="g-title">テーマ</Label>
          <Input id="g-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="間接疑問文" required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="g-source">教材</Label>
          <Input id="g-source" value={source} onChange={(e) => setSource(e.target.value)} />
        </div>
        <Button type="submit">追加</Button>
      </form>
      <div className="mt-6 space-y-2">
        {sorted.map((g) => <ThemeCard key={g.id} g={g} />)}
      </div>
    </div>
  );
}
