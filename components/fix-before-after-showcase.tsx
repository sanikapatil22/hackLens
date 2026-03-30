'use client';

import { Card } from '@/components/ui/card';
import { ChevronDown, CheckCircle2, AlertCircle, Code2 } from 'lucide-react';
import { useState } from 'react';

interface FixShowcaseProps {
  beforeCode: string;
  afterCode: string;
  improvements: Array<{
    aspect: string;
    before: string;
    after: string;
  }>;
}

export function FixBeforeAfterShowcase({
  beforeCode,
  afterCode,
  improvements,
}: FixShowcaseProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-4">
      <Card className="bg-card border border-border overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-4 hover:bg-secondary/20 transition-colors text-left flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">Compare Before vs After Fix</h4>
          </div>
          <ChevronDown
            className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>

        {expanded && (
          <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
            {/* Code Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Before */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <p className="text-sm font-semibold text-destructive">Vulnerable</p>
                </div>
                <pre className="bg-background/50 rounded-lg p-3 text-xs overflow-x-auto border border-border/50">
                  <code className="text-red-300">{beforeCode}</code>
                </pre>
              </div>

              {/* After */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <p className="text-sm font-semibold text-green-500">Secure</p>
                </div>
                <pre className="bg-background/50 rounded-lg p-3 text-xs overflow-x-auto border border-border/50">
                  <code className="text-green-300">{afterCode}</code>
                </pre>
              </div>
            </div>

            {/* Improvements Table */}
            <div className="mt-6">
              <p className="text-sm font-semibold mb-3">What Changed</p>
              <div className="space-y-2">
                {improvements.map((improvement, idx) => (
                  <div key={idx} className="bg-background/30 rounded-lg p-3 text-sm">
                    <p className="text-muted-foreground mb-2 font-medium">
                      {improvement.aspect}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-red-400 mb-1">Before:</p>
                        <p className="text-xs">{improvement.before}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-400 mb-1">After:</p>
                        <p className="text-xs">{improvement.after}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
