'use client';

import { useEffect, useMemo, useState } from 'react';

import { getUserStats } from '@/lib/ai/user-tracking';
import { generateAISummary } from '@/lib/services/ai-summary';
import { generateLearningPath } from '@/lib/services/learning-path';
import { Card } from '@/components/ui/card';

type UserApiPayload = {
  stats?: {
    accuracy?: number;
    totalAttempts?: number;
    weakAreas?: string[];
    byType?: Record<string, { accuracy: number; attempts: number; correct: number }>;
  } | null;
};

type AnalyticsPayload = {
  success?: boolean;
  data?: {
    recentTrend?: string;
  };
};

function getOrCreateLocalUserId(): string {
  const existing = window.localStorage.getItem('hacklens_user_id');
  if (existing) {
    return existing;
  }

  const generated = crypto.randomUUID();
  window.localStorage.setItem('hacklens_user_id', generated);
  return generated;
}

function deriveStrengths(byType: Record<string, { accuracy: number; attempts: number }> | undefined): string[] {
  if (!byType) {
    return [];
  }

  return Object.entries(byType)
    .filter(([, value]) => value.attempts >= 2 && value.accuracy >= 70)
    .sort((a, b) => b[1].accuracy - a[1].accuracy)
    .map(([key]) => key)
    .slice(0, 3);
}

export function GlobalIntelligencePanel() {
  const [summary, setSummary] = useState('Loading your personalized summary...');
  const [learningPath, setLearningPath] = useState<string[]>([]);

  const [stats, setStats] = useState<{
    accuracy: number;
    totalAttempts: number;
    weakAreas: string[];
    byType: Record<string, { accuracy: number; attempts: number }>;
    recentTrend?: string;
  }>({
    accuracy: 0,
    totalAttempts: 0,
    weakAreas: [],
    byType: {},
  });

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      const localStats = getUserStats();
      let merged = {
        accuracy: localStats.accuracy,
        totalAttempts: localStats.totalAttempts,
        weakAreas: localStats.weakAreas,
        byType: localStats.byType,
        recentTrend: undefined as string | undefined,
      };

      try {
        const userId = getOrCreateLocalUserId();
        const response = await fetch(`/api/user?userId=${encodeURIComponent(userId)}`);
        if (response.ok) {
          const payload = (await response.json()) as UserApiPayload;
          if (payload.stats) {
            merged = {
              ...merged,
              accuracy: payload.stats.accuracy ?? merged.accuracy,
              totalAttempts: payload.stats.totalAttempts ?? merged.totalAttempts,
              weakAreas: payload.stats.weakAreas ?? merged.weakAreas,
              byType: payload.stats.byType ?? merged.byType,
            };
          }
        }
      } catch {
        // Keep local fallback.
      }

      try {
        const analyticsResponse = await fetch('/api/analytics');
        if (analyticsResponse.ok) {
          const analytics = (await analyticsResponse.json()) as AnalyticsPayload;
          if (analytics.success && analytics.data?.recentTrend) {
            merged = {
              ...merged,
              recentTrend: analytics.data.recentTrend,
            };
          }
        }
      } catch {
        // Keep local fallback.
      }

      if (!cancelled) {
        setStats(merged);
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const strengths = useMemo(() => deriveStrengths(stats.byType), [stats.byType]);

  useEffect(() => {
    let cancelled = false;

    async function buildIntelligence() {
      const strategyInsights = (() => {
        try {
          const raw = window.localStorage.getItem('hacklens_strategy_insights');
          if (!raw) {
            return [] as string[];
          }

          const parsed = JSON.parse(raw) as unknown;
          if (!Array.isArray(parsed)) {
            return [];
          }

          return parsed.filter((item): item is string => typeof item === 'string').slice(0, 5);
        } catch {
          return [];
        }
      })();

      const recentSimulationPerformance = (() => {
        try {
          const raw = window.localStorage.getItem('hacklens_simulation_recent_accuracy');
          return raw ?? undefined;
        } catch {
          return undefined;
        }
      })();

      const profile = {
        weak_areas: stats.weakAreas,
        strengths,
        behavior_pattern: stats.accuracy >= 60 ? 'proactive' : 'reactive',
        avg_score: stats.accuracy,
        accuracy: stats.accuracy,
        total_attempts: stats.totalAttempts,
        recent_trend: stats.recentTrend,
      };

      const [nextSummary, nextPath] = await Promise.all([
        generateAISummary(profile, strategyInsights, recentSimulationPerformance, 'ai'),
        generateLearningPath(profile, 'ai'),
      ]);

      if (!cancelled) {
        setSummary(nextSummary);
        setLearningPath(nextPath);
      }
    }

    void buildIntelligence();

    return () => {
      cancelled = true;
    };
  }, [stats, strengths]);

  return (
    <Card className="border-border/60 bg-card/70 p-4">
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">🧠 AI Summary</p>
          <p className="mt-1 text-sm text-foreground">{summary}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">🎯 Recommended Next Steps</p>
          <ol className="mt-1 space-y-1 text-sm text-muted-foreground">
            {learningPath.slice(0, 3).map((step, index) => (
              <li key={`${index}-${step}`} className="flex gap-2">
                <span className="text-primary">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Card>
  );
}
