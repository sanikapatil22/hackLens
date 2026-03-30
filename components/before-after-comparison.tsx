'use client';

import { Check, X } from 'lucide-react';
import { useState } from 'react';

interface BeforeAfterComparisonProps {
  before: {
    code: string;
    vulnerabilityCount: number;
    attackSurfaceArea: string;
  };
  after: {
    code: string;
    vulnerabilityCount: number;
    attackSurfaceArea: string;
  };
}

export function BeforeAfterComparison({ before, after }: BeforeAfterComparisonProps) {
  const [showCode, setShowCode] = useState(false);

  const vulnerabilityReduction = Math.round(
    ((before.vulnerabilityCount - after.vulnerabilityCount) / before.vulnerabilityCount) * 100
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Impact of Applying the Fix</h3>

      {/* Impact Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Vulnerability Reduction */}
        <div className="bg-background/50 border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Vulnerabilities Reduced
            </p>
            <span className="text-2xl font-bold text-green-500">-{vulnerabilityReduction}%</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <X className="w-4 h-4 text-destructive" />
              <span className="text-sm text-foreground">
                Before: <span className="font-semibold">{before.vulnerabilityCount}</span> vulnerabilities
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm text-foreground">
                After: <span className="font-semibold">{after.vulnerabilityCount}</span> vulnerabilities
              </span>
            </div>
          </div>
        </div>

        {/* Attack Surface - Before */}
        <div className="bg-destructive/5 border border-destructive/30 rounded-lg p-4">
          <p className="text-xs font-semibold text-destructive uppercase mb-2">
            Before (Exposed)
          </p>
          <p className="text-sm text-foreground font-semibold">{before.attackSurfaceArea}</p>
          <div className="mt-2 h-2 bg-destructive/20 rounded-full overflow-hidden">
            <div className="h-full w-4/5 bg-destructive rounded-full"></div>
          </div>
        </div>

        {/* Attack Surface - After */}
        <div className="bg-green-500/5 border border-green-500/30 rounded-lg p-4">
          <p className="text-xs font-semibold text-green-500 uppercase mb-2">
            After (Protected)
          </p>
          <p className="text-sm text-foreground font-semibold">{after.attackSurfaceArea}</p>
          <div className="mt-2 h-2 bg-green-500/20 rounded-full overflow-hidden">
            <div className="h-full w-1/5 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Code Comparison */}
      {showCode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-destructive flex items-center gap-2">
              <X className="w-4 h-4" />
              Before
            </h4>
            <div className="bg-destructive/5 border border-destructive/30 rounded-lg p-3 max-h-64 overflow-y-auto">
              <pre className="text-xs font-mono text-foreground">
                <code>{before.code}</code>
              </pre>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-green-500 flex items-center gap-2">
              <Check className="w-4 h-4" />
              After
            </h4>
            <div className="bg-green-500/5 border border-green-500/30 rounded-lg p-3 max-h-64 overflow-y-auto">
              <pre className="text-xs font-mono text-foreground">
                <code>{after.code}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowCode(!showCode)}
        className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        {showCode ? 'Hide' : 'Show'} Code Comparison
      </button>
    </div>
  );
}
