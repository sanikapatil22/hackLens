'use client';

import { HackerConfidenceMetrics } from '@/types/security';
import { AlertTriangle, Lock, Zap } from 'lucide-react';

interface HackerConfidenceMeterProps {
  metrics: HackerConfidenceMetrics;
}

export function HackerConfidenceMeter({ metrics }: HackerConfidenceMeterProps) {
  const getConfidenceColor = (percentage: number) => {
    if (percentage >= 75) return 'text-destructive';
    if (percentage >= 50) return 'text-accent';
    if (percentage >= 25) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getConfidenceLabel = (percentage: number) => {
    if (percentage >= 75) return 'Very Easy to Exploit';
    if (percentage >= 50) return 'Easy to Exploit';
    if (percentage >= 25) return 'Moderate Difficulty';
    return 'Hard to Exploit';
  };

  const getBarColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-destructive';
    if (percentage >= 50) return 'bg-accent';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Zap className="w-5 h-5 text-accent" />
        Hacker Confidence Meter
      </h3>

      {/* Main Confidence Score */}
      <div className="bg-background/50 border border-border rounded-lg p-4 space-y-3">
        <div>
          <div className="flex items-end justify-between mb-2">
            <span className="text-sm font-semibold text-foreground">Overall Success Rate</span>
            <span className={`text-3xl font-bold ${getConfidenceColor(metrics.estimatedSuccessRate)}`}>
              {metrics.estimatedSuccessRate}%
            </span>
          </div>
          <div className="h-3 bg-secondary/50 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor(metrics.estimatedSuccessRate)} transition-all`}
              style={{ width: `${metrics.estimatedSuccessRate}%` }}
            />
          </div>
          <p className={`text-sm font-semibold mt-2 ${getConfidenceColor(metrics.estimatedSuccessRate)}`}>
            {getConfidenceLabel(metrics.estimatedSuccessRate)}
          </p>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Exploit Difficulty */}
        <div className="bg-secondary/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Exploit Difficulty</p>
            <AlertTriangle className="w-4 h-4 text-accent" />
          </div>
          <div className="space-y-2">
            <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${metrics.exploitDifficulty}%` }}
              />
            </div>
            <p className="text-xs text-foreground">
              {metrics.exploitDifficulty >= 70
                ? 'Hard (requires skills)'
                : metrics.exploitDifficulty >= 40
                  ? 'Moderate'
                  : 'Easy (script kiddies can do it)'}
            </p>
          </div>
        </div>

        {/* Common Attack Vector */}
        <div className="bg-secondary/30 rounded-lg p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Common Attack Vector</p>
          <div className="flex items-center gap-2">
            {metrics.commonAttackVector ? (
              <>
                <span className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-sm text-foreground">Yes - frequently exploited</span>
              </>
            ) : (
              <>
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-foreground">No - uncommon attack path</span>
              </>
            )}
          </div>
        </div>

        {/* User Interaction */}
        <div className="bg-secondary/30 rounded-lg p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Requires User Action</p>
          <div className="flex items-center gap-2">
            {metrics.requiresUserInteraction ? (
              <>
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm text-foreground">Yes - user must click/interact</span>
              </>
            ) : (
              <>
                <span className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-sm text-foreground">No - automatic exploitation</span>
              </>
            )}
          </div>
        </div>

        {/* Authentication */}
        <div className="bg-secondary/30 rounded-lg p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Requires Auth</p>
          <div className="flex items-center gap-2">
            {metrics.requiresAuthentication ? (
              <>
                <Lock className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-foreground">Yes - must be logged in</span>
              </>
            ) : (
              <>
                <span className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-sm text-foreground">No - accessible to anyone</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Risk Summary */}
      <div className={`p-3 rounded-lg border ${
        metrics.estimatedSuccessRate >= 75
          ? 'bg-destructive/10 border-destructive/30'
          : metrics.estimatedSuccessRate >= 50
            ? 'bg-accent/10 border-accent/30'
            : 'bg-green-500/10 border-green-500/30'
      }`}>
        <p className="text-xs font-semibold text-foreground mb-1">
          {metrics.estimatedSuccessRate >= 75
            ? '🚨 CRITICAL RISK'
            : metrics.estimatedSuccessRate >= 50
              ? '⚠️ HIGH RISK'
              : '✅ MANAGEABLE RISK'}
        </p>
        <p className="text-sm text-foreground">
          {metrics.estimatedSuccessRate >= 75
            ? 'This vulnerability is extremely easy to exploit and should be fixed immediately.'
            : metrics.estimatedSuccessRate >= 50
              ? 'This vulnerability is relatively easy to exploit. Prioritize fixing it.'
              : 'While this vulnerability exists, exploitation requires significant effort or preconditions.'}
        </p>
      </div>
    </div>
  );
}
