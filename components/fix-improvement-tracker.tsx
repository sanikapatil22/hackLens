'use client';

import { Card } from '@/components/ui/card';
import { ArrowRight, BarChart3, TrendingUp } from 'lucide-react';

interface Improvement {
  metric: string;
  before: {
    value: string | number;
    icon?: string;
  };
  after: {
    value: string | number;
    icon?: string;
  };
  percentChange: number;
}

interface FixImprovementTrackerProps {
  title?: string;
  improvements: Improvement[];
}

export function FixImprovementTracker({
  title = 'Impact of This Fix',
  improvements,
}: FixImprovementTrackerProps) {
  return (
    <Card className="bg-gradient-to-br from-green-950/30 to-green-900/10 border border-green-500/30 p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-green-500" />
        <h4 className="font-semibold text-foreground">{title}</h4>
      </div>

      <div className="space-y-4">
        {improvements.map((improvement, idx) => (
          <div key={idx} className="bg-background/40 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-3 font-medium">
              {improvement.metric}
            </p>

            <div className="flex items-center justify-between gap-3">
              {/* Before */}
              <div className="flex-1 text-center">
                <p className="text-xs text-muted-foreground mb-1">Before</p>
                <p className="text-xl font-bold text-red-400">{improvement.before.value}</p>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center gap-1">
                <ArrowRight className="w-4 h-4 text-primary" />
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>

              {/* After */}
              <div className="flex-1 text-center">
                <p className="text-xs text-muted-foreground mb-1">After</p>
                <p className="text-xl font-bold text-green-400">{improvement.after.value}</p>
              </div>
            </div>

            {/* Percentage Badge */}
            <div className="mt-3 flex justify-center">
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">
                {improvement.percentChange > 0 ? '+' : ''}{improvement.percentChange}% reduction
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
