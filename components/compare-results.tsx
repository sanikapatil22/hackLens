'use client';

import { Card } from '@/components/ui/card';
import { Trophy, TrendingDown, AlertTriangle } from 'lucide-react';

interface ComparisonMetrics {
  url: string;
  riskScore: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

interface CompareResultsProps {
  site1: ComparisonMetrics;
  site2: ComparisonMetrics;
}

export function CompareResults({ site1, site2 }: CompareResultsProps) {
  const isSite1Better = site1.riskScore < site2.riskScore;
  const riskDifference = Math.abs(site1.riskScore - site2.riskScore);

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-destructive';
    if (score >= 50) return 'text-accent';
    if (score >= 25) return 'text-yellow-500';
    return 'text-green-500';
  };

  const winner = isSite1Better ? site1.url : site2.url;

  return (
    <div className="w-full space-y-6">
      {/* Winner Badge */}
      <Card className="bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 p-6">
        <div className="flex items-start gap-4">
          <Trophy className="w-8 h-8 text-primary flex-shrink-0" />
          <div>
            <h2 className="text-xl font-bold mb-1">Security Champion</h2>
            <p className="text-foreground font-semibold">{winner}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {riskDifference}% safer than the other site
            </p>
          </div>
        </div>
      </Card>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Site 1 */}
        <Card className={`border p-6 ${isSite1Better ? 'border-green-500/50 bg-green-950/20' : 'border-border bg-card'}`}>
          <h3 className="text-lg font-semibold mb-4 break-all text-sm">{site1.url}</h3>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Risk Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(site1.riskScore)}`}>
                {site1.riskScore}%
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Critical Issues</span>
                <span className="font-semibold text-destructive">{site1.criticalCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">High Issues</span>
                <span className="font-semibold text-red-400">{site1.highCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Medium Issues</span>
                <span className="font-semibold text-yellow-500">{site1.mediumCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Low Issues</span>
                <span className="font-semibold text-blue-400">{site1.lowCount}</span>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Total Issues</p>
              <p className="text-2xl font-bold">
                {site1.criticalCount + site1.highCount + site1.mediumCount + site1.lowCount}
              </p>
            </div>
          </div>
        </Card>

        {/* Site 2 */}
        <Card className={`border p-6 ${!isSite1Better ? 'border-green-500/50 bg-green-950/20' : 'border-border bg-card'}`}>
          <h3 className="text-lg font-semibold mb-4 break-all text-sm">{site2.url}</h3>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Risk Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(site2.riskScore)}`}>
                {site2.riskScore}%
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Critical Issues</span>
                <span className="font-semibold text-destructive">{site2.criticalCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">High Issues</span>
                <span className="font-semibold text-red-400">{site2.highCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Medium Issues</span>
                <span className="font-semibold text-yellow-500">{site2.mediumCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Low Issues</span>
                <span className="font-semibold text-blue-400">{site2.lowCount}</span>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Total Issues</p>
              <p className="text-2xl font-bold">
                {site2.criticalCount + site2.highCount + site2.mediumCount + site2.lowCount}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Insights */}
      <Card className="bg-card border border-border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-accent" />
          Comparison Insights
        </h3>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span>
              {isSite1Better ? site1.url : site2.url} has a{' '}
              <span className="font-semibold text-foreground">{riskDifference}% lower</span> risk
              score
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span>
              The safer site has{' '}
              <span className="font-semibold text-foreground">
                {Math.abs(
                  site1.criticalCount +
                    site1.highCount +
                    site1.mediumCount +
                    site1.lowCount -
                    (site2.criticalCount + site2.highCount + site2.mediumCount + site2.lowCount)
                )}
              </span>{' '}
              fewer total issues
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span>
              Focus on fixing{' '}
              <span className="font-semibold text-foreground">critical and high severity</span> issues
              first for maximum impact
            </span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
