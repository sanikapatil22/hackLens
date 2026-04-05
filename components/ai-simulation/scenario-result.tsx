'use client';

import { useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Scenario } from '@/lib/ai/scenario-types';
import { getUserStats } from '@/lib/ai/user-tracking';
import { AttackProgress } from '@/components/simulation/AttackProgress';
import { ReasoningPanel } from '@/components/simulation/ReasoningPanel';

interface ScenarioResultProps {
  scenario: Scenario;
  userAction: string;
}

function parseReasoningSection(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/[,;]|\band\b/gi)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 3);
}

function parseReasoning(text: string): {
  correctPoints: string[];
  missedPoints: string[];
  nextSteps: string[];
} {
  const match = text.match(/CORRECT:\s*(.*?)\s*\|\s*MISSED:\s*(.*?)\s*\|\s*NEXT:\s*(.*)/i);

  if (!match) {
    return {
      correctPoints: [],
      missedPoints: [],
      nextSteps: [],
    };
  }

  return {
    correctPoints: parseReasoningSection(match[1]),
    missedPoints: parseReasoningSection(match[2]),
    nextSteps: parseReasoningSection(match[3]),
  };
}

function parseStage(developerText: string): 'foothold' | 'privilege_escalation' | 'lateral_movement' | 'exfiltration' {
  const stageMatch = developerText.match(/STAGE:\s*(initial_access|privilege_escalation|lateral_movement|exfiltration)/i);
  const stage = stageMatch?.[1]?.toLowerCase();

  if (stage === 'privilege_escalation' || stage === 'lateral_movement' || stage === 'exfiltration') {
    return stage;
  }

  return 'foothold';
}

function deriveSystemStatus(progress: 'foothold' | 'privilege_escalation' | 'lateral_movement' | 'exfiltration') {
  if (progress === 'foothold') {
    return 'degraded';
  }

  if (progress === 'exfiltration') {
    return 'fully_compromised';
  }

  return 'compromised';
}

function getClassification(
  isCorrect: boolean,
  reasoning: {
    correctPoints: string[];
    missedPoints: string[];
    nextSteps: string[];
  }
): 'correct' | 'partial' | 'incorrect' {
  if (isCorrect && reasoning.missedPoints.length === 0) {
    return 'correct';
  }

  if (isCorrect || (reasoning.correctPoints.length > 0 && reasoning.missedPoints.length > 0)) {
    return 'partial';
  }

  return 'incorrect';
}

function getClassificationBadge(classification: 'correct' | 'partial' | 'incorrect') {
  if (classification === 'correct') {
    return {
      label: '🟢 Correct',
      className: 'border-emerald-500/40 bg-emerald-900/20 text-emerald-300',
    };
  }

  if (classification === 'partial') {
    return {
      label: '🟡 Partial',
      className: 'border-amber-500/40 bg-amber-900/20 text-amber-300',
    };
  }

  return {
    label: '🔴 Incorrect',
    className: 'border-red-500/40 bg-red-900/20 text-red-300',
  };
}

function getScoreMeaning(score: number): 'Excellent' | 'Good' | 'Needs Improvement' | 'Poor' {
  if (score > 80) {
    return 'Excellent';
  }

  if (score > 60) {
    return 'Good';
  }

  if (score > 40) {
    return 'Needs Improvement';
  }

  return 'Poor';
}

export function ScenarioResult({ scenario, userAction }: ScenarioResultProps) {
  const isCorrect = userAction === scenario.correct_action;
  const stats = useMemo(() => getUserStats(), [scenario.id, userAction]);
  const topMistake = stats.commonMistakes[0] ?? null;
  const reasoning = useMemo(() => parseReasoning(scenario.explanation.user), [scenario.explanation.user]);
  const hasReasoning =
    reasoning.correctPoints.length > 0 ||
    reasoning.missedPoints.length > 0 ||
    reasoning.nextSteps.length > 0;
  const subtleHint = reasoning.nextSteps[0] ?? null;
  const attackerProgress = useMemo(
    () => parseStage(scenario.explanation.developer),
    [scenario.explanation.developer]
  );
  const systemStatus = useMemo(() => deriveSystemStatus(attackerProgress), [attackerProgress]);
  const classification = useMemo(() => getClassification(isCorrect, reasoning), [isCorrect, reasoning]);
  const classificationBadge = useMemo(() => getClassificationBadge(classification), [classification]);
  const scoreLabel = useMemo(() => getScoreMeaning(stats.accuracy), [stats.accuracy]);
  const transitionReason = reasoning.missedPoints[0] ?? scenario.explanation.hacker;

  return (
    <Card
      className={isCorrect ? 'border-green-500/40 bg-green-900/10' : 'border-destructive/40 bg-destructive/10'}
    >
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold">
            {isCorrect ? '✅ Correct decision' : '❌ Incorrect decision'}
          </CardTitle>
          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${classificationBadge.className}`}>
            {classificationBadge.label}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <AttackProgress attackerProgress={attackerProgress} />

        <p className="rounded-md border border-border/60 bg-background/40 px-3 py-2 text-xs text-muted-foreground">
          Attacker moved to <span className="font-medium text-foreground">{attackerProgress.replace('_', ' ')}</span>
          {' '}due to{' '}
          <span className="font-medium text-foreground">{transitionReason}</span>
        </p>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-border/60 bg-background/40 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Attacker Progress</p>
            <p className="mt-1 text-sm font-medium text-foreground">{attackerProgress.replace('_', ' ')}</p>
          </div>
          <div className="rounded-md border border-border/60 bg-background/40 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">System Status</p>
            <p className="mt-1 text-sm font-medium text-foreground">{systemStatus.replace('_', ' ')}</p>
          </div>
          <div className="rounded-md border border-border/60 bg-background/40 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Session Score</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              Score: {stats.accuracy} ({scoreLabel})
            </p>
          </div>
        </div>

        <div className="space-y-2 rounded-md border border-border/60 bg-background/40 p-3">
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                scenario.meta.source === 'ai'
                  ? 'bg-blue-900/30 text-blue-300 border border-blue-500/30'
                  : 'bg-amber-900/30 text-amber-300 border border-amber-500/30'
              }`}
            >
              {scenario.meta.source === 'ai' ? '🧠 AI Generated' : '⚡ Cached Scenario'}
            </span>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium border ${
                scenario.meta.mode === 'adaptive'
                  ? 'bg-primary/20 text-primary border-primary/30'
                  : 'bg-secondary/30 text-muted-foreground border-border/50'
              }`}
            >
              {scenario.meta.mode === 'adaptive' ? '🎯 Adaptive Mode' : 'Manual Mode'}
            </span>
          </div>

          {scenario.meta.difficulty_reason && (
            <p className="text-xs text-muted-foreground">{scenario.meta.difficulty_reason}</p>
          )}
        </div>

        <div
          className={`rounded-md border p-3 ${
            isCorrect
              ? 'border-green-500/30 bg-green-900/20 text-green-300'
              : 'border-destructive/40 bg-destructive/20 text-destructive'
          }`}
        >
          <p className="text-sm font-semibold">
            {isCorrect
              ? "✅ Good job! Here's why your choice was correct"
              : '⚠️ You selected an unsafe action'}
          </p>
        </div>

        <div className="space-y-2 rounded-md border border-border/60 bg-background/40 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your action</p>
          <p className="text-sm text-foreground">{userAction}</p>
        </div>

        <div className="space-y-2 rounded-md border border-border/60 bg-background/40 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recommended action</p>
          <p className="text-sm font-medium text-foreground">{scenario.correct_action}</p>
        </div>

        <div className="space-y-3 rounded-md border border-border/60 bg-background/40 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Red flags missed</p>
          <ul className="space-y-1 text-sm text-foreground/90">
            {scenario.red_flags.map((flag) => (
              <li key={flag} className="flex gap-2">
                <span className="text-destructive">•</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-border/60 bg-background/40 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Hacker perspective</p>
            <p className="mt-2 text-sm text-foreground/90">{scenario.explanation.hacker}</p>
          </div>

          <div className="rounded-md border border-border/60 bg-background/40 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">User perspective</p>
            <p className="mt-2 text-sm text-foreground/90">{scenario.explanation.user}</p>
          </div>

          <div className="rounded-md border border-border/60 bg-background/40 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Developer perspective</p>
            <p className="mt-2 text-sm text-foreground/90">{scenario.explanation.developer}</p>
          </div>
        </div>

        {hasReasoning && (
          <div className="transition-all duration-300 ease-out">
            <ReasoningPanel
              correctPoints={reasoning.correctPoints}
              missedPoints={reasoning.missedPoints}
              nextSteps={reasoning.nextSteps}
            />
          </div>
        )}

        {subtleHint && (
          <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200 transition-all duration-300 ease-out">
            <p className="font-semibold">⚠️ Hint (based on your recent actions):</p>
            <p className="mt-1">{subtleHint}</p>
          </div>
        )}

        <div className="space-y-4 rounded-md border border-primary/30 bg-primary/10 p-4">
          <p className="text-sm font-semibold text-primary">🛠️ How to Handle This</p>

          <div className={`rounded-md border p-3 ${isCorrect ? 'border-primary/30 bg-background/50' : 'border-destructive/40 bg-destructive/10'}`}>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Immediate Action</p>
            <p className={`mt-1 text-sm font-medium ${isCorrect ? 'text-foreground' : 'text-destructive'}`}>
              {scenario.solution.immediate_action}
            </p>
          </div>

          <div className="rounded-md border border-border/60 bg-background/40 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Prevention Tips</p>
            <ul className="mt-2 space-y-1 text-sm text-foreground/90">
              {scenario.solution.prevention_tips.map((tip) => (
                <li key={tip} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-md border border-border/60 bg-background/40 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Best Practices</p>
            <ul className="mt-2 space-y-1 text-sm text-foreground/90">
              {scenario.solution.best_practices.map((practice) => (
                <li key={practice} className="flex gap-2">
                  <span className="text-accent">•</span>
                  <span>{practice}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-3 rounded-md border border-border/60 bg-background/40 p-4">
          <p className="text-sm font-semibold text-foreground">🧠 Your Weak Areas</p>
          <p className="text-sm text-muted-foreground">
            Overall accuracy: <span className="font-medium text-foreground">{stats.accuracy}%</span>
            {' '}
            ({stats.correctAttempts}/{stats.totalAttempts})
          </p>

          {stats.weakAreas.length > 0 ? (
            <ul className="space-y-1 text-sm text-foreground/90">
              {stats.weakAreas.map((area) => (
                <li key={area} className="flex gap-2">
                  <span className="text-amber-400">•</span>
                  <span>
                    You struggle with {area} attacks ({stats.byType[area]?.accuracy ?? 0}% accuracy)
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-foreground/80">
              No major weak area detected yet. Keep practicing to improve consistency.
            </p>
          )}

          {topMistake && (
            <p className="text-sm text-foreground/90">
              Most common mistake: <span className="font-medium">{topMistake}</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
