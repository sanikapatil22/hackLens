'use client';

import { AttackStep } from '@/types/security';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface AttackTimelineProps {
  steps: AttackStep[];
}

export function AttackTimeline({ steps }: AttackTimelineProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-accent">How an Attack Could Unfold</h3>
      <div className="relative space-y-3">
        {steps.map((step, index) => (
          <div key={step.step} className="flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                {step.step}
              </div>
              {index < steps.length - 1 && (
                <div className="w-0.5 h-12 bg-border mt-2" />
              )}
            </div>

            {/* Step content */}
            <div className="flex-1 pb-4">
              <button
                onClick={() => setExpandedStep(expandedStep === step.step ? null : step.step)}
                className="w-full text-left"
              >
                <div className="bg-secondary/50 hover:bg-secondary/70 rounded-lg p-3 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">{step.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 transition-transform text-muted-foreground ${
                        expandedStep === step.step ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>
              </button>

              {expandedStep === step.step && (
                <div className="mt-3 space-y-2 pl-4 border-l-2 border-accent">
                  <div>
                    <p className="text-xs font-semibold text-accent uppercase">Hacker Action:</p>
                    <p className="text-sm text-foreground bg-background/50 p-2 rounded mt-1">
                      {step.action}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-destructive uppercase">Result:</p>
                    <p className="text-sm text-foreground bg-destructive/10 p-2 rounded mt-1">
                      {step.result}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
