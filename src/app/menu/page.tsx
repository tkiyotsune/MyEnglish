"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { NAV_ITEMS } from "@/components/layout/nav";
import { PageHeader } from "@/components/shared/PageHeader";
import { withBasePath } from "@/lib/basePath";

export default function MenuPage() {
  return (
    <div>
      <PageHeader title="Menu" />
      <div className="divide-y rounded-lg border bg-card">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted">
            <Icon className="size-4 text-muted-foreground" />
            {label}
            <ChevronRight className="ml-auto size-4 text-muted-foreground" />
          </Link>
        ))}
        <a href={withBasePath("/english_phrases_complete.html")} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted">
          📘 フレーズ・前置詞・接続詞ノート
        </a>
        <a href={withBasePath("/english_vocab_notebook.html")} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted">
          📗 英単語帳ノート
        </a>
      </div>
    </div>
  );
}
