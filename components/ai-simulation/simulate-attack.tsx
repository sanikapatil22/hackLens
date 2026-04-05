'use client';

import { useEffect, useState } from 'react';
import { SignInButton, SignUpButton, useUser } from '@clerk/nextjs';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getAdaptiveParams } from '@/lib/ai/adaptive-engine';
import type { Scenario } from '@/lib/ai/scenario-types';
import { getUserStats, logInteraction } from '@/lib/ai/user-tracking';

import { ScenarioControls } from './scenario-controls';
import { ScenarioDisplay } from './scenario-display';
import { ScenarioResult } from './scenario-result';

type ScenarioType = Scenario['type'];
type ScenarioDifficulty = Scenario['difficulty'];
type ScenarioMode = 'demo' | 'live';

const SIMULATION_COUNT_KEY = 'hacklens_simulation_count';
const UPGRADE_PROMPT_DISMISSED_KEY = 'hacklens_upgrade_prompt_dismissed';

type PersonalizationStats = {
  accuracy: number;
  totalAttempts: number;
  weakAreas: string[];
};

export default function SimulateAttack() {
  const { user, isLoaded, isSignedIn } = useUser();
  const isGuest = !user;

  const [type, setType] = useState<ScenarioType>('phishing');
  const [difficulty, setDifficulty] = useState<ScenarioDifficulty>('medium');
  const [mode, setMode] = useState<ScenarioMode>('demo');
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(false);
  const [userAction, setUserAction] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [adaptiveMode, setAdaptiveMode] = useState(false);
  const [simulationCount, setSimulationCount] = useState(0);
  const [upgradePromptDismissed, setUpgradePromptDismissed] = useState(false);
  const [sessionStats, setSessionStats] = useState<PersonalizationStats | null>(null);

  useEffect(() => {
    const existingUserId = window.localStorage.getItem('hacklens_user_id');
    if (!existingUserId) {
      window.localStorage.setItem('hacklens_user_id', crypto.randomUUID());
    }

    const existingCount = Number(window.localStorage.getItem(SIMULATION_COUNT_KEY) ?? '0');
    setSimulationCount(Number.isFinite(existingCount) ? existingCount : 0);

    const dismissed = window.localStorage.getItem(UPGRADE_PROMPT_DISMISSED_KEY) === 'true';
    setUpgradePromptDismissed(dismissed);
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const localUserId = typeof window !== 'undefined' ? window.localStorage.getItem('hacklens_user_id') : null;
    const endpoint = localUserId
      ? `/api/user?userId=${encodeURIComponent(localUserId)}`
      : '/api/user';

    fetch(endpoint)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('stats-unavailable');
        }

        const payload = await response.json() as {
          success?: boolean;
          stats?: {
            accuracy: number;
            totalAttempts: number;
            weakAreas: string[];
          } | null;
        };

        if (payload.stats) {
          setSessionStats({
            accuracy: payload.stats.accuracy,
            totalAttempts: payload.stats.totalAttempts,
            weakAreas: payload.stats.weakAreas ?? [],
          });
          return;
        }

        throw new Error('no-stats');
      })
      .catch(() => {
        const fallbackStats = getUserStats();
        setSessionStats({
          accuracy: fallbackStats.accuracy,
          totalAttempts: fallbackStats.totalAttempts,
          weakAreas: fallbackStats.weakAreas,
        });
      });
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isGuest && upgradePromptDismissed) {
      setUpgradePromptDismissed(false);
      window.localStorage.removeItem(UPGRADE_PROMPT_DISMISSED_KEY);
    }
  }, [isGuest, upgradePromptDismissed]);

  async function handleGenerate() {
    setLoading(true);
    setScenario(null);
    setUserAction(null);
    setShowResult(false);

    try {
      const params = adaptiveMode
        ? getAdaptiveParams()
        : { type, difficulty, selectionMode: 'manual' as const };
      if (adaptiveMode) {
        setType(params.type);
        setDifficulty(params.difficulty);
      }

      const response = await fetch('/api/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          adaptive: adaptiveMode,
          params,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate scenario');
      }

      const payload = (await response.json()) as { scenario: Scenario };
      setScenario(payload.scenario);
    } catch {
      setScenario(null);
    } finally {
      setLoading(false);
    }
  }

  function handleAction(option: string) {
    setUserAction(option);
    setShowResult(true);

    if (!scenario) {
      return;
    }

    const interaction = {
      scenarioType: scenario.type,
      difficulty: scenario.difficulty,
      isCorrect: option === scenario.correct_action,
      selectedAction: option,
      correctAction: scenario.correct_action,
      redFlags: scenario.red_flags,
      timestamp: Date.now(),
    };

    const nextCount = simulationCount + 1;
    setSimulationCount(nextCount);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SIMULATION_COUNT_KEY, String(nextCount));
    }

    const userId = typeof window !== 'undefined' ? window.localStorage.getItem('hacklens_user_id') : null;

    if (!userId) {
      logInteraction(interaction);
      return;
    }

    fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        ...interaction,
      }),
    }).catch(() => {
      logInteraction(interaction);
    });

    const localStats = getUserStats();
    setSessionStats({
      accuracy: localStats.accuracy,
      totalAttempts: localStats.totalAttempts,
      weakAreas: localStats.weakAreas,
    });
  }

  const greetingText = isGuest
    ? 'Continue your training'
    : `Welcome back, ${user?.firstName || user?.username || 'User'} 👋`;

  const performanceMessage =
    sessionStats === null
      ? null
      : sessionStats.accuracy > 70
        ? "🔥 You're doing great! Let's try harder scenarios"
        : sessionStats.accuracy >= 40
          ? "⚡ You're improving. Keep practicing"
          : "🧠 Let's focus on fundamentals";

  const focusArea = sessionStats?.weakAreas?.[0] ?? null;

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card/70">
        <CardContent className="space-y-3 py-5">
          <p className="text-sm font-medium text-foreground">{greetingText}</p>

          {performanceMessage && (
            <p className="text-xs text-muted-foreground">{performanceMessage}</p>
          )}

          {focusArea && (
            <p className="text-xs text-muted-foreground">Focus area: {focusArea} detection</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-foreground">Learning Intelligence</p>
            <Button
              type="button"
              variant={adaptiveMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAdaptiveMode((prev) => !prev)}
              disabled={loading}
            >
              {adaptiveMode ? 'Adaptive Mode On' : 'Adaptive Mode Off'}
            </Button>
          </div>

          {adaptiveMode && (
            <p className="text-xs text-muted-foreground">
              🧠 This scenario is tailored to your performance
            </p>
          )}
        </CardContent>
      </Card>

      <ScenarioControls
        type={type}
        setType={setType}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        mode={mode}
        setMode={setMode}
        onGenerate={handleGenerate}
        loading={loading}
      />

      {isGuest && simulationCount >= 2 && !upgradePromptDismissed && (
        <Card className="border-primary/30 bg-primary/10">
          <CardContent className="space-y-3 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-primary">🔐 Save your progress across devices</p>
                <p className="text-xs text-muted-foreground">
                  Sign in to track your learning and improve over time.
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => {
                  setUpgradePromptDismissed(true);
                  window.localStorage.setItem(UPGRADE_PROMPT_DISMISSED_KEY, 'true');
                }}
              >
                Dismiss
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <SignInButton mode="modal">
                <button className="px-3 py-1.5 text-xs font-mono rounded-md border border-border hover:bg-muted transition-colors">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-3 py-1.5 text-xs font-mono rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card className="border-border/60 bg-card/70">
          <CardContent className="flex items-center gap-3 py-6">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            <p className="text-sm font-medium text-foreground">🧠 Generating AI scenario...</p>
          </CardContent>
        </Card>
      )}

      {scenario && <ScenarioDisplay scenario={scenario} onAction={handleAction} />}

      {showResult && scenario && userAction && (
        <ScenarioResult scenario={scenario} userAction={userAction} />
      )}
    </div>
  );
}
