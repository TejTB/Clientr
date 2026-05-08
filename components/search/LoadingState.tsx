"use client";

import { useEffect, useRef, useState } from "react";

const MESSAGES = [
  "Scanning the web for matching businesses...",
  "Analysing Instagram presence and follower counts...",
  "Evaluating website quality and opportunities...",
  "Calculating fit scores for each prospect...",
  "Writing personalised outreach messages...",
  "Almost ready..."
];

const PROGRESS_DURATION_MS = 25_000;
const PROGRESS_CAP = 95;
const MESSAGE_INTERVAL_MS = 4_000;
const TICK_MS = 100;

export function LoadingState() {
  const startRef = useRef<number>(Date.now());
  const [progress, setProgress] = useState(0);
  const [messageIdx, setMessageIdx] = useState(0);

  useEffect(() => {
    startRef.current = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(
        PROGRESS_CAP,
        (elapsed / PROGRESS_DURATION_MS) * PROGRESS_CAP
      );
      setProgress(pct);
      const idx = Math.min(
        MESSAGES.length - 1,
        Math.floor(elapsed / MESSAGE_INTERVAL_MS)
      );
      setMessageIdx(idx);
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="wordmark-glow animate-wordmark-pulse text-[24px] font-semibold tracking-[0.15em] text-accent">
        CLIENTR
      </div>

      <div className="mt-10 w-80">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
            Searching
          </span>
          <span className="text-[11px] tabular-nums text-faint">
            {Math.round(progress)}%
          </span>
        </div>
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-accent-gradient"
            style={{ width: `${progress}%`, transition: "width 500ms linear" }}
          />
        </div>
      </div>

      <p
        key={messageIdx}
        className="mt-8 min-h-[24px] text-center text-[14px] text-muted"
        aria-live="polite"
      >
        <span className="inline-block animate-fade-in">{MESSAGES[messageIdx]}</span>
      </p>
    </div>
  );
}
