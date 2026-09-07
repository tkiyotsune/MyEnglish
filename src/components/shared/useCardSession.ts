"use client";

import { useState } from "react";

/** Shared state machine for flashcard-style practice (speaking / vocabulary). */
export function useCardSession() {
  const [queue, setQueue] = useState<string[] | null>(null);
  const [revealed, setRevealed] = useState(false);

  const start = (ids: string[]) => {
    setQueue(ids);
    setRevealed(false);
  };
  const advance = () => {
    setQueue((q) => (q ? q.slice(1) : q));
    setRevealed(false);
  };
  const stop = () => setQueue(null);

  return {
    queue,
    currentId: queue && queue.length > 0 ? queue[0] : undefined,
    remaining: queue?.length ?? 0,
    started: queue !== null,
    revealed,
    reveal: () => setRevealed(true),
    start,
    advance,
    stop,
  };
}
