'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp, ArrowRight } from 'lucide-react';

export interface Metric {
  name: string;
  before: string | number;
  after: string | number;
  unit?: string;
  improvement: number;
}

interface BeforeAfterMetricsProps {
  metrics: Metric[];
  title?: string;
  description?: string;
}

export function BeforeAfterMetrics({
  metrics,
  title = 'Security Improvements',
  description = 'See the impact of implementing security fixes',
}: BeforeAfterMetricsProps) {
  return (
    <div className="w-full space-y-4">
      <Card className="bg-card border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        {description && <p className="text-sm text-muted-foreground mb-6">{description}</p>}

        <div className="space-y-4">
          {metrics.map((metric, idx) => (
            <div key={idx} className="bg-background/50 rounded-lg p-4">
              <p className="text-sm font-medium text-foreground mb-3">{metric.name}</p>

              <div className="flex items-center justify-between gap-4">
                {/* Before */}
                <div className="flex-1 flex flex-col items-center">
                  <p className="text-xs text-muted-foreground mb-1">Before</p>
                  <p className="text-2xl font-bold text-destructive">
                    {metric.before}
                    {metric.unit && <span className="text-sm ml-1">{metric.unit}</span>}
                  </p>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />

                {/* After */}
                <div className="flex-1 flex flex-col items-center">
                  <p className="text-xs text-muted-foreground mb-1">After</p>
                  <p className="text-2xl font-bold text-green-500">
                    {metric.after}
                    {metric.unit && <span className="text-sm ml-1">{metric.unit}</span>}
                  </p>
                </div>
              </div>

              {/* Improvement Badge */}
              <div className="mt-3 flex justify-center">
                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
                  {metric.improvement > 0 ? '+' : ''}{metric.improvement}% improvement
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
