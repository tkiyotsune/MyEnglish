"use client";

import { useState } from "react";
import { Trash2, Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { NativeSelect } from "@/components/shared/NativeSelect";
import { toLines, fromLines } from "@/components/shared/lines";
import { useApp } from "@/lib/store/AppProvider";
import { LISTENING_STEPS, type ListeningMaterial } from "@/lib/types";
import { cn } from "cn";

const SOURCES = ["VOA", "DUO", "TED-Ed", "BBC", "YouTube", "Netflix", "Podcast", "other"];

function AddForm() {
  const { actions } = useApp();
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("VOA");
  const [url, setUrl] = useState("");
  const [level, setLevel] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    actions.addListening({ title: title.trim(), source, url: url.trim() || undefined, level: level.trim() || undefined });
    setTitle("");
    setUrl("");
  };
  return (
    <form onSubmit={submit} className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[2fr_1fr_2fr_1fr_auto] sm:items-end">
      <div className="grid gap-1.5">
        <Label htmlFor="l-title">title *</Label>
        <Input id="l-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
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
        <Label htmlFor="l-url">URL</Label>
        <Input id="l-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="l-level">level</Label>
        <Input id="l-level" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="A2" />
      </div>
      <Button type="submit">追加</Button>
    </form>
  );
}

function MaterialCard({ m }: { m: ListeningMaterial }) {
  const { actions } = useApp();
  const [open, setOpen] = useState(false);
  const done = m.completedSteps.length >= LISTENING_STEPS.length;
  return (
    <div className={cn("rounded-lg border bg-card", done && "border-emerald-500/40")}>
      <div className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="font-medium">
            {m.url ? (
              <a href={m.url} target="_blank" rel="noreferrer" className="hover:underline">{m.title}</a>
            ) : (
              m.title
            )}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {m.source} {m.level && `· ${m.level}`} · {m.completedSteps.length} / {LISTENING_STEPS.length} steps · shadowing {m.shadowingCount}周
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" aria-label="shadowing -1" disabled={m.shadowingCount === 0} onClick={() => actions.addShadowing(m.id, -1)}>
            <Minus />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => actions.addShadowing(m.id, 1)}>
            <Plus data-icon="inline-start" />
            Shadowing
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setOpen((v) => !v)} aria-label="展開">
            {open ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 px-4 pb-4">
        {LISTENING_STEPS.map((step, i) => {
          const checked = m.completedSteps.includes(step);
          return (
            <button
              key={step}
              onClick={() => actions.toggleListeningStep(m.id, step)}
              className={cn(
                "rounded-md border px-2 py-1 text-xs transition-colors",
                checked ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "hover:bg-muted",
              )}
            >
              {i + 1}. {step}
            </button>
          );
        })}
      </div>
      {open && (
        <div className="grid gap-3 border-t p-4">
          <div className="grid gap-1.5">
            <Label>script</Label>
            <Textarea rows={5} defaultValue={m.script ?? ""} onBlur={(e) => actions.updateListening(m.id, { script: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>unknown words（1行1語）</Label>
              <Textarea rows={4} defaultValue={fromLines(m.unknownWords)} onBlur={(e) => actions.updateListening(m.id, { unknownWords: toLines(e.target.value) })} />
            </div>
            <div className="grid gap-1.5">
              <Label>summary（英語で要約）</Label>
              <Textarea rows={4} defaultValue={m.summary ?? ""} onBlur={(e) => actions.updateListening(m.id, { summary: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => actions.removeListening(m.id)}>
              <Trash2 data-icon="inline-start" />
              削除
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ListeningPage() {
  const { data } = useApp();
  const active = data.listening.filter((m) => m.completedSteps.length < LISTENING_STEPS.length);
  const finished = data.listening.filter((m) => m.completedSteps.length >= LISTENING_STEPS.length);
  return (
    <div>
      <PageHeader title="Listening" description="1素材を7ステップで仕上げる。全ステップ完了で Listening +1、Shadowing はボタンでカウント" />
      <AddForm />
      <section className="mt-6 space-y-3">
        <h2 className="text-sm font-semibold">進行中 ({active.length})</h2>
        {active.length === 0 ? <EmptyState>素材を追加してください。</EmptyState> : active.map((m) => <MaterialCard key={m.id} m={m} />)}
      </section>
      {finished.length > 0 && (
        <section className="mt-6 space-y-3">
          <h2 className="text-sm font-semibold">完了 ({finished.length})</h2>
          {finished.map((m) => <MaterialCard key={m.id} m={m} />)}
        </section>
      )}
    </div>
  );
}
