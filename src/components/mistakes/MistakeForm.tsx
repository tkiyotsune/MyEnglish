"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/shared/NativeSelect";
import { useApp } from "@/lib/store/AppProvider";

export const MISTAKE_CATEGORIES = ["単語", "文法", "前置詞", "接続詞", "疑問文", "時制", "その他"] as const;

export function MistakeForm({ onSaved }: { onSaved?: () => void }) {
  const { actions } = useApp();
  const [japanese, setJapanese] = useState("");
  const [attempted, setAttempted] = useState("");
  const [correct, setCorrect] = useState("");
  const [category, setCategory] = useState<string>("その他");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correct.trim()) return;
    actions.addMistake({
      japanese: japanese.trim() || undefined,
      attemptedEnglish: attempted.trim() || undefined,
      correctEnglish: correct.trim(),
      category,
    });
    setJapanese("");
    setAttempted("");
    setCorrect("");
    onSaved?.();
  };

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-lg border bg-card p-4">
      <div className="grid gap-1.5">
        <Label htmlFor="m-ja">日本語（言いたかったこと）</Label>
        <Input id="m-ja" value={japanese} onChange={(e) => setJapanese(e.target.value)} placeholder="Wi-Fiが不安定だった" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="m-en">正しい英語 *</Label>
        <Input id="m-en" value={correct} onChange={(e) => setCorrect(e.target.value)} placeholder="The Wi-Fi wasn't very stable." required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="m-try">言おうとした英語（任意）</Label>
          <Input id="m-try" value={attempted} onChange={(e) => setAttempted(e.target.value)} placeholder="Wi-Fi is not good..." />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="m-cat">カテゴリ</Label>
          <NativeSelect id="m-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
            {MISTAKE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit">記録する</Button>
      </div>
    </form>
  );
}
