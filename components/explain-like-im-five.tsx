'use client';

import { ELI5Explanation } from '@/types/security';
import { ChevronDown, Lightbulb } from 'lucide-react';
import { useState } from 'react';

interface ExplainLikeImFiveProps {
  explanation: ELI5Explanation;
  isOpen?: boolean;
}

export function ExplainLikeImFive({ explanation, isOpen = false }: ExplainLikeImFiveProps) {
  const [open, setOpen] = useState(isOpen);

  return (
    <div className="bg-primary/5 border border-primary/30 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-primary/10 transition-colors"
      >
        <div className="flex items-center gap-2 text-left">
          <Lightbulb className="w-5 h-5 text-primary flex-shrink-0" />
          <span className="font-semibold text-foreground">Explain Like I&apos;m 5</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="px-4 py-3 space-y-3 bg-background/50 border-t border-primary/30">
          {/* Simple Explanation */}
          <div>
            <p className="text-xs font-semibold text-primary uppercase mb-1">The Simple Version:</p>
            <p className="text-sm text-foreground">{explanation.simple}</p>
          </div>

          {/* Analogy */}
          <div>
            <p className="text-xs font-semibold text-primary uppercase mb-1">Think of It Like This:</p>
            <p className="text-sm text-foreground italic">{explanation.analogy}</p>
          </div>

          {/* Real World Example */}
          <div>
            <p className="text-xs font-semibold text-primary uppercase mb-1">Real Example:</p>
            <p className="text-sm text-foreground">{explanation.example}</p>
          </div>

          {/* Memorable Takeaway */}
          <div className="mt-3 p-3 bg-primary/10 rounded border border-primary/30">
            <p className="text-sm font-semibold text-primary">Remember: Always validate and escape user input!</p>
          </div>
        </div>
      )}
    </div>
  );
}
