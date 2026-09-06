"use client";

import { useApp } from "@/lib/store/AppProvider";
import { PageHeader } from "@/components/shared/PageHeader";
import { TaskCard } from "@/components/today/TaskCard";
import { dayProgress, tasksForDate } from "@/lib/tasks";
import { formatDateJa } from "@/lib/date";
import { MistakeReviewList } from "@/components/mistakes/MistakeReviewList";

export default function TodayPage() {
  const { data, today } = useApp();
  const tasks = tasksForDate(data.dailyTasks, today);
  const progress = dayProgress(tasks);

  return (
    <div>
      <PageHeader title="Today" description={`${formatDateJa(today)} · ${progress.done} / ${progress.total} tasks`} />
      <div className="grid gap-3 md:grid-cols-2">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} />
        ))}
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold">復習キュー：言えなかった表現</h2>
        <MistakeReviewList />
      </section>
    </div>
  );
}
