import type { RoadmapPhase, RoadmapPhaseId, Settings } from "@/lib/types";
import { ROADMAP } from "@/lib/seed/roadmap";
import { daysBetween } from "@/lib/date";

export function currentPhase(settings: Settings, today: string): { phase: RoadmapPhase; dayInPhase: number; autoId: RoadmapPhaseId } {
  const elapsed = Math.max(0, daysBetween(settings.startDate, today));
  let autoId: RoadmapPhaseId = "b1-b2";
  let dayInPhase = elapsed;
  let acc = 0;
  for (const p of ROADMAP) {
    if (p.durationDays === null) {
      autoId = p.id;
      dayInPhase = elapsed - acc;
      break;
    }
    if (elapsed < acc + p.durationDays) {
      autoId = p.id;
      dayInPhase = elapsed - acc;
      break;
    }
    acc += p.durationDays;
  }
  const id = settings.phaseOverride ?? autoId;
  const phase = ROADMAP.find((p) => p.id === id) ?? ROADMAP[0];
  return { phase, dayInPhase: id === autoId ? dayInPhase : 0, autoId };
}
