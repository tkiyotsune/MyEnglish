"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { NativeSelect } from "@/components/shared/NativeSelect";
import { useApp } from "@/lib/store/AppProvider";
import type { MaterialCategory, MaterialStatus } from "@/lib/types";

const CATEGORY_LABEL: Record<MaterialCategory, string> = {
  grammar: "文法",
  vocabulary: "単語",
  speaking: "発話",
  listening: "Listening",
  support: "補助",
};

export default function MaterialsPage() {
  const { data, actions } = useApp();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<MaterialCategory>("listening");
  const [status, setStatus] = useState<MaterialStatus>("active");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    actions.addMaterial({ title: title.trim(), category, status });
    setTitle("");
  };

  const groups = (Object.keys(CATEGORY_LABEL) as MaterialCategory[]).map((c) => ({
    category: c,
    items: data.materials.filter((m) => m.category === c).sort((a, b) => a.order - b.order),
  }));

  return (
    <div>
      <PageHeader title="Materials" description="使用教材の管理。日常会話で使える語彙を優先" />
      <form onSubmit={submit} className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
        <div className="grid gap-1.5">
          <Label htmlFor="mt-title">教材名</Label>
          <Input id="mt-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="grid gap-1.5">
          <Label>分類</Label>
          <NativeSelect value={category} onChange={(e) => setCategory(e.target.value as MaterialCategory)}>
            {(Object.keys(CATEGORY_LABEL) as MaterialCategory[]).map((c) => (
              <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label>状態</Label>
          <NativeSelect value={status} onChange={(e) => setStatus(e.target.value as MaterialStatus)}>
            <option value="active">使用中</option>
            <option value="sub">サブ</option>
            <option value="future">将来</option>
            <option value="done">完了</option>
          </NativeSelect>
        </div>
        <Button type="submit">追加</Button>
      </form>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {groups.map((g) => (
          <section key={g.category}>
            <h2 className="mb-2 text-sm font-semibold">{CATEGORY_LABEL[g.category]}</h2>
            <div className="divide-y rounded-lg border bg-card">
              {g.items.length === 0 && <div className="px-4 py-3 text-xs text-muted-foreground">なし</div>}
              {g.items.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">{m.title}</div>
                    {m.note && <div className="text-xs text-muted-foreground">{m.note}</div>}
                  </div>
                  <StatusBadge status={m.status} />
                  <NativeSelect className="h-7 w-auto text-xs" value={m.status} onChange={(e) => actions.updateMaterial(m.id, { status: e.target.value as MaterialStatus })}>
                    <option value="active">使用中</option>
                    <option value="sub">サブ</option>
                    <option value="future">将来</option>
                    <option value="done">完了</option>
                  </NativeSelect>
                  <Button variant="ghost" size="icon-sm" aria-label="削除" onClick={() => actions.removeMaterial(m.id)}>
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
