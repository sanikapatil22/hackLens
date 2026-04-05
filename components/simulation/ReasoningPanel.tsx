"use client";

import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReasoningPanelProps {
  correctPoints: string[];
  missedPoints: string[];
  nextSteps: string[];
}

function SectionList({
  title,
  items,
  emptyLabel,
  bulletClassName,
  containerClassName,
}: {
  title: string;
  items: string[];
  emptyLabel: string;
  bulletClassName: string;
  containerClassName: string;
}) {
  return (
    <section className={containerClassName}>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm text-foreground/90">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className={bulletClassName}>•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </section>
  );
}

export function ReasoningPanel({ correctPoints, missedPoints, nextSteps }: ReasoningPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border-border/60 bg-card/60 transition-all duration-300 ease-out">
      <CardHeader className="pb-2 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold">Analysis</CardTitle>
          <button
            type="button"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
          >
            {isOpen ? 'Hide Analysis ▲' : 'Show Analysis ▼'}
          </button>
        </div>
      </CardHeader>
      <CardContent
        className={[
          'space-y-3 overflow-hidden transition-all duration-300 ease-out',
          isOpen ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0 p-0',
        ].join(' ')}
      >
        <SectionList
          title="✅ What you did well"
          items={correctPoints}
          emptyLabel="No strong positives were detected in this step."
          bulletClassName="text-emerald-400"
          containerClassName="rounded-md border border-emerald-500/30 bg-emerald-900/10 p-3"
        />

        <SectionList
          title="❌ What you missed"
          items={missedPoints}
          emptyLabel="No critical misses flagged for this step."
          bulletClassName="text-red-400"
          containerClassName="rounded-md border border-red-500/30 bg-red-900/10 p-3"
        />

        <SectionList
          title="➡️ What to do next"
          items={nextSteps}
          emptyLabel="No next steps suggested yet."
          bulletClassName="text-sky-400"
          containerClassName="rounded-md border border-sky-500/30 bg-sky-900/10 p-3"
        />
      </CardContent>
    </Card>
  );
}
