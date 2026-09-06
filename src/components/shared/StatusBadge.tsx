import { Badge } from "@/components/ui/badge";

const LABELS: Record<string, string> = {
  new: "未習得",
  learning: "復習中",
  reviewing: "復習中",
  mastered: "習得済み",
  todo: "未着手",
  in_progress: "学習中",
  done: "完了",
  active: "使用中",
  sub: "サブ",
  future: "将来",
};

export function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "mastered" || status === "done" || status === "active"
      ? "default"
      : status === "new" || status === "todo" || status === "future"
        ? "outline"
        : "secondary";
  return <Badge variant={variant}>{LABELS[status] ?? status}</Badge>;
}
