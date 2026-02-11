"use client";

import { useEffect, useMemo, useState } from "react";

interface AnimatedKpiCard {
  key: string;
  label: string;
  unit: string;
  baselineValue: number;
  daValue: number;
  deltaText: string;
  daWins: boolean;
}

interface AnimatedKpiGridProps {
  cards: AnimatedKpiCard[];
}

function formatMetricValue(value: number, unit: string): string {
  if (unit === "%") {
    return `${(value * 100).toFixed(1)}${unit}`;
  }

  if (unit === "位") {
    return `${value.toFixed(2)}${unit}`;
  }

  return `${Math.round(value)}${unit}`;
}

export function AnimatedKpiGrid({ cards }: AnimatedKpiGridProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    let startTime = 0;
    const duration = 900;

    const step = (timestamp: number) => {
      if (!startTime) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const nextProgress = Math.min(1, elapsed / duration);
      setProgress(nextProgress);

      if (nextProgress < 1) {
        frame = requestAnimationFrame(step);
      }
    };

    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [cards]);

  const animatedCards = useMemo(
    () =>
      cards.map((card) => ({
        ...card,
        baselineDisplay: card.baselineValue * progress,
        daDisplay: card.daValue * progress,
      })),
    [cards, progress],
  );

  return (
    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {animatedCards.map((card) => (
        <article key={card.key} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-slate-500">{card.label}</p>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-500">Baseline</p>
              <p className="text-base font-semibold text-slate-900">
                {formatMetricValue(card.baselineDisplay, card.unit)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">DA</p>
              <p className="text-base font-semibold text-slate-900">
                {formatMetricValue(card.daDisplay, card.unit)}
              </p>
            </div>
          </div>
          <p className={`mt-2 text-xs font-semibold ${card.daWins ? "text-blue-700" : "text-slate-700"}`}>
            DA差分: {card.deltaText}
          </p>
        </article>
      ))}
    </div>
  );
}
