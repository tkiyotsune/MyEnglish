"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { NativeSelect } from "@/components/shared/NativeSelect";
import { useApp } from "@/lib/store/AppProvider";
import { TASK_META } from "@/lib/tasks";
import { ROADMAP } from "@/lib/seed/roadmap";
import { TASK_TYPES, type RoadmapPhaseId, type ThemeMode } from "@/lib/types";
import { currentPhase } from "@/lib/roadmap";

export default function SettingsPage() {
  const { data, actions, today } = useApp();
  const { autoId } = currentPhase(data.settings, today);
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const download = () => {
    const blob = new Blob([actions.exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `myenglish-backup-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      await actions.importJson(await file.text());
      setMessage("インポートしました。");
    } catch (e) {
      setMessage(`インポート失敗: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" />

      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold">1日の目標数</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">変更は今日以降のタスクに反映されます。</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {TASK_TYPES.map((type) => (
            <div key={type} className="grid gap-1.5">
              <Label htmlFor={`t-${type}`}>{TASK_META[type].label}（{TASK_META[type].unit}）</Label>
              <Input
                id={`t-${type}`}
                type="number"
                min={0}
                inputMode="numeric"
                value={data.settings.targets[type]}
                onChange={(e) => actions.updateSettings({ targets: { ...data.settings.targets, [type]: Math.max(0, Number(e.target.value) || 0) } })}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="s-start">ロードマップ開始日</Label>
          <Input id="s-start" type="date" value={data.settings.startDate} onChange={(e) => e.target.value && actions.updateSettings({ startDate: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label>現在のフェーズ</Label>
          <NativeSelect
            value={data.settings.phaseOverride ?? "auto"}
            onChange={(e) => actions.updateSettings({ phaseOverride: e.target.value === "auto" ? null : (e.target.value as RoadmapPhaseId) })}
          >
            <option value="auto">自動（{ROADMAP.find((p) => p.id === autoId)?.label}）</option>
            {ROADMAP.map((p) => (
              <option key={p.id} value={p.id}>{p.label} · {p.title}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label>テーマ</Label>
          <NativeSelect value={data.settings.theme} onChange={(e) => actions.updateSettings({ theme: e.target.value as ThemeMode })}>
            <option value="system">システム</option>
            <option value="light">ライト</option>
            <option value="dark">ダーク</option>
          </NativeSelect>
        </div>
      </section>

      <section className="mt-4 rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold">バックアップ</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          データはこの端末のブラウザ内（LocalStorage）に保存されます。PC・スマホ間で共有するには JSON を書き出して取り込んでください。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" onClick={download}>
            <Download data-icon="inline-start" />
            JSONを書き出す
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload data-icon="inline-start" />
            JSONを取り込む
          </Button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => onImport(e.target.files?.[0])} />
        </div>
        {message && <p className="mt-2 text-xs text-muted-foreground">{message}</p>}
      </section>

      <section className="mt-4 rounded-lg border border-destructive/30 bg-card p-4">
        <h2 className="text-sm font-semibold">初期化</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">すべての記録を削除して初期データに戻します。事前に JSON を書き出してください。</p>
        <div className="mt-3 flex gap-2">
          {!confirmReset ? (
            <Button variant="destructive" onClick={() => setConfirmReset(true)}>初期化する</Button>
          ) : (
            <>
              <Button variant="destructive" onClick={() => { void actions.resetAll(); setConfirmReset(false); }}>本当に初期化する</Button>
              <Button variant="outline" onClick={() => setConfirmReset(false)}>キャンセル</Button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
