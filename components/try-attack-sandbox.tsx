'use client';

import { InteractiveDemo } from '@/types/security';
import { AlertCircle, Copy, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getUserStats } from '@/lib/ai/user-tracking';
import { computeStrategyScore, type StrategyHistoryEntry } from '@/lib/services/strategy-scoring';
import { buildReplayTimeline, replayDelay, type ReplaySpeed, type ReplayTimelineEntry } from '@/lib/services/replay-timeline';

interface TryAttackSandboxProps {
  demo: InteractiveDemo;
}

type EvaluationClassification = 'correct' | 'partial' | 'incorrect';

type EvaluationReasoning = {
  correct_points: string[];
  missed_points: string[];
  next_steps: string[];
};

type DerivedCoach = {
  hint: string;
  mistake: string;
  next: string;
};

type UserProfilePayload = {
  stats?: {
    weakAreas?: string[];
  } | null;
};

function getClassificationBadge(classification: EvaluationClassification): {
  label: string;
  className: string;
} {
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

function isNonEmpty(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function getCachedAttackCoach(action: string, classification: EvaluationClassification): DerivedCoach {
  const normalizedAction = action.toLowerCase();

  if (normalizedAction.includes('login') && classification === 'incorrect') {
    return {
      hint: 'Try checking authentication endpoints.',
      mistake: 'You may have ignored input validation.',
      next: 'Look for injection points in login flows.',
    };
  }

  if (normalizedAction.includes('input')) {
    return {
      hint: 'Validate user inputs carefully.',
      mistake: 'Input sanitization may be missing.',
      next: 'Test for injection vulnerabilities on input fields.',
    };
  }

  return {
    hint: 'Think about common attack vectors.',
    mistake: 'Your approach may be incomplete.',
    next: 'Try analyzing inputs and endpoints step by step.',
  };
}

function deriveCoachFromReasoning(reasoning: EvaluationReasoning): DerivedCoach {
  const nextStep = reasoning.next_steps[0] ?? '';
  const hintCandidate = nextStep || reasoning.correct_points[0] || 'Review the attack path and test incrementally.';
  const mistakeCandidate = reasoning.missed_points[0] ?? 'No major mistake detected in this step.';
  const nextCandidate = nextStep || 'Try the next likely injection point.';

  const hint = hintCandidate === nextCandidate
    ? (reasoning.correct_points[0] || hintCandidate)
    : hintCandidate;

  return {
    hint,
    mistake: mistakeCandidate,
    next: nextCandidate,
  };
}

function deriveAttackCoach(
  action: string,
  classification: EvaluationClassification,
  reasoning?: EvaluationReasoning
): DerivedCoach {
  const hasReasoning =
    reasoning &&
    (reasoning.correct_points.length > 0 ||
      reasoning.missed_points.length > 0 ||
      reasoning.next_steps.length > 0);

  if (hasReasoning) {
    return deriveCoachFromReasoning(reasoning);
  }

  return getCachedAttackCoach(action, classification);
}

function getOrCreateLocalUserId(): string {
  const existing = window.localStorage.getItem('hacklens_user_id');
  if (existing) {
    return existing;
  }

  const created = crypto.randomUUID();
  window.localStorage.setItem('hacklens_user_id', created);
  return created;
}

function normalizeTopic(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, '_');
}

function getDemoFocusTopic(demoType: InteractiveDemo['type']): string {
  if (demoType === 'sql-injection' || demoType === 'xss' || demoType === 'command-injection') {
    return 'input_validation';
  }

  return 'request_integrity';
}

function applyWeakAreaHintBias(
  coach: DerivedCoach,
  weakAreas: string[],
  demoType: InteractiveDemo['type']
): DerivedCoach {
  const topic = getDemoFocusTopic(demoType);
  const normalizedAreas = weakAreas.map(normalizeTopic);

  const isFocusTopic =
    normalizedAreas.includes(topic) ||
    (topic === 'input_validation' && normalizedAreas.some((area) => area.includes('inject') || area.includes('input')));

  if (!isFocusTopic) {
    return coach;
  }

  if (coach.hint.toLowerCase().includes('input')) {
    return coach;
  }

  return {
    ...coach,
    hint: 'Pay attention to how inputs are handled. Validate and sanitize before execution.',
  };
}

export function TryAttackSandbox({ demo }: TryAttackSandboxProps) {
  const [input, setInput] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [userWeakAreas, setUserWeakAreas] = useState<string[]>([]);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data?: string;
    evaluation?: {
      classification: EvaluationClassification;
      reasoning?: EvaluationReasoning;
    };
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [strategyHistory, setStrategyHistory] = useState<StrategyHistoryEntry[]>([]);
  const [strategyFeedback, setStrategyFeedback] = useState<{ score: number; insights: string[] } | null>(null);
  const [replayHistory, setReplayHistory] = useState<ReplayTimelineEntry[]>([]);
  const [replayOpen, setReplayOpen] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState<ReplaySpeed>('normal');
  const [replayCursor, setReplayCursor] = useState(0);
  const [replayPlaying, setReplayPlaying] = useState(false);

  const replayTimeline = buildReplayTimeline(replayHistory);

  useEffect(() => {
    if (!replayOpen || !replayPlaying || replayTimeline.length === 0) {
      return;
    }

    if (replayCursor >= replayTimeline.length) {
      setReplayPlaying(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setReplayCursor((prev) => prev + 1);
    }, replayDelay(replaySpeed));

    return () => {
      window.clearTimeout(timer);
    };
  }, [replayOpen, replayPlaying, replayCursor, replaySpeed, replayTimeline.length]);

  useEffect(() => {
    let cancelled = false;

    async function loadUserWeakAreas() {
      try {
        const userId = getOrCreateLocalUserId();
        const response = await fetch(`/api/user?userId=${encodeURIComponent(userId)}`);
        if (!response.ok) {
          throw new Error('user-profile-unavailable');
        }

        const payload = (await response.json()) as UserProfilePayload;
        const weakAreas = payload.stats?.weakAreas ?? [];
        if (!cancelled) {
          setUserWeakAreas(Array.isArray(weakAreas) ? weakAreas : []);
        }
      } catch {
        const fallbackWeakAreas = getUserStats().weakAreas;
        if (!cancelled) {
          setUserWeakAreas(fallbackWeakAreas);
        }
      }
    }

    void loadUserWeakAreas();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSimulateAttack = () => {
    setIsSimulating(true);
    
    // Simulate attack execution
    setTimeout(() => {
      let success = false;
      let message = '';
      let data = '';
      let classification: EvaluationClassification = 'incorrect';
      let reasoning: EvaluationReasoning | undefined;

      if (demo.type === 'sql-injection') {
        const hasInjection = input.includes("'") || input.includes('--') || input.includes('/*');
        success = hasInjection;
        classification = hasInjection ? 'correct' : (input.trim().length > 0 ? 'partial' : 'incorrect');
        if (hasInjection) {
          message = '💥 SQL Injection Successful! Database query was manipulated.';
          data = `SELECT * FROM users WHERE username = '${input}' AND password = 'anything'`;
          reasoning = {
            correct_points: ['You used injection syntax to alter query behavior.'],
            missed_points: [],
            next_steps: ['Confirm where input reaches SQL execution and patch with parameterized queries.'],
          };
        } else {
          message = 'Query executed safely - no injection detected.';
          reasoning = {
            correct_points: ['Input was executed without obvious exploit impact.'],
            missed_points: ['Attack payload did not include effective SQL control characters.'],
            next_steps: ['Try testing quote breaks and comment-based payload variants.'],
          };
        }
      } else if (demo.type === 'xss') {
        const hasScript = input.includes('<') && input.includes('>');
        success = hasScript;
        classification = hasScript ? 'correct' : (input.trim().length > 0 ? 'partial' : 'incorrect');
        if (hasScript) {
          message = '💥 XSS Attack Successful! Malicious script injected into page.';
          data = `User input rendered: ${input}`;
          reasoning = {
            correct_points: ['You supplied executable HTML/JS payload content.'],
            missed_points: [],
            next_steps: ['Check whether output encoding or CSP blocks script execution paths.'],
          };
        } else {
          message = 'Input rendered safely - no XSS detected.';
          reasoning = {
            correct_points: ['Input did not immediately trigger script execution.'],
            missed_points: ['Payload lacked script-capable markup or event handlers.'],
            next_steps: ['Try encoded script tags or event-handler-based payloads.'],
          };
        }
      } else if (demo.type === 'command-injection') {
        const hasCommand = input.includes(';') || input.includes('|') || input.includes('&&');
        success = hasCommand;
        classification = hasCommand ? 'correct' : (input.trim().length > 0 ? 'partial' : 'incorrect');
        if (hasCommand) {
          message = '💥 Command Injection Successful! System command executed.';
          data = `Executed: ping ${input}`;
          reasoning = {
            correct_points: ['You used command separators to chain execution.'],
            missed_points: [],
            next_steps: ['Validate where shell command construction is unsafe and constrain command inputs.'],
          };
        } else {
          message = 'Command executed safely - no injection detected.';
          reasoning = {
            correct_points: ['No command chaining was observed.'],
            missed_points: ['Input did not include shell metacharacters for command chaining.'],
            next_steps: ['Try separators such as ;, |, or && in controlled payloads.'],
          };
        }
      }

      setResult({
        success,
        message,
        data,
        evaluation: {
          classification,
          reasoning,
        },
      });

      const updatedHistory: StrategyHistoryEntry[] = [
        ...strategyHistory,
        {
          classification,
          action: input,
          reasoning,
        },
      ].slice(-15);

      const updatedReplay: ReplayTimelineEntry[] = [
        ...replayHistory,
        {
          stepIndex: replayHistory.length + 1,
          userAction: input,
          attackerResponse: message,
          narration: reasoning?.next_steps?.[0] ?? '',
        },
      ].slice(-15);

      setStrategyHistory(updatedHistory);
      setReplayHistory(updatedReplay);
      void computeStrategyScore(updatedHistory, 'ai').then((feedback) => {
        setStrategyFeedback(feedback);
        try {
          window.localStorage.setItem('hacklens_strategy_insights', JSON.stringify(feedback.insights));
        } catch {
          // Ignore storage errors.
        }
      });

      setIsSimulating(false);
    }, 800);
  };

  const copyPayload = () => {
    navigator.clipboard.writeText(demo.payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const coach = result?.evaluation
    ? applyWeakAreaHintBias(
        deriveAttackCoach(
          input,
          result.evaluation.classification,
          result.evaluation.reasoning
        ),
        userWeakAreas,
        demo.type
      )
    : null;

  const hasReasoning =
    !!result?.evaluation?.reasoning &&
    (result.evaluation.reasoning.correct_points.length > 0 ||
      result.evaluation.reasoning.missed_points.length > 0 ||
      result.evaluation.reasoning.next_steps.length > 0);

  const hasNextSteps = (result?.evaluation?.reasoning?.next_steps.length ?? 0) > 0;
  const shouldShowCoach = !!result?.evaluation && (
    result.evaluation.classification !== 'correct' || hasNextSteps
  );

  const coachSourceLabel = hasReasoning ? '🤖 AI Coach' : '🟡 Rule-Based Coach';
  const classificationBadge = result?.evaluation
    ? getClassificationBadge(result.evaluation.classification)
    : null;

  return (
    <div className="space-y-4 bg-background/50 p-4 rounded-lg border border-border">
      <div>
        <h3 className="text-lg font-semibold text-accent flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Try the Attack
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          This is a safe sandbox. Try to exploit the vulnerable system below.
        </p>
      </div>

      {/* Attack type info */}
      <div className="bg-secondary/30 p-3 rounded border border-border/50">
        <p className="text-xs font-semibold text-accent uppercase mb-1">Attack Type: {demo.type}</p>
        <p className="text-sm text-foreground">{demo.description}</p>
      </div>

      {/* Input area */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Your Attack Input:
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Try entering something malicious..."
          className="w-full px-3 py-2 rounded-lg bg-input text-foreground placeholder-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Hint: Try: <code className="bg-secondary/50 px-2 py-1 rounded text-accent">{demo.payload}</code>
        </p>
      </div>

      {/* Suggested payloads */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Common Payloads:</p>
        <div className="grid grid-cols-1 gap-2">
          {demo.tips.map((tip, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInput(tip);
                setResult(null);
              }}
              className="text-left px-3 py-2 rounded bg-secondary/50 hover:bg-secondary text-sm text-foreground transition-colors"
            >
              {tip}
            </button>
          ))}
        </div>
      </div>

      {/* Simulate button */}
      <button
        onClick={handleSimulateAttack}
        disabled={!input || isSimulating}
        className="w-full px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {isSimulating ? (
          <>
            <span className="inline-block animate-spin">⚙️</span>
            Simulating Attack...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Execute Attack
          </>
        )}
      </button>

      {/* Results */}
      {result && (
        <div className={`p-4 rounded-lg border-2 ${
          result.success
            ? 'bg-destructive/10 border-destructive'
            : 'bg-green-500/10 border-green-500'
        }`}>
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            {classificationBadge && (
              <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${classificationBadge.className}`}>
                {classificationBadge.label}
              </span>
            )}
          </div>

          <div className="flex gap-2 mb-2">
            <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
              result.success ? 'text-destructive' : 'text-green-500'
            }`} />
            <p className={`font-semibold ${result.success ? 'text-destructive' : 'text-green-500'}`}>
              {result.message}
            </p>
          </div>
          {result.data && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                System Output:
              </p>
              <div className="bg-background/80 p-2 rounded font-mono text-xs text-foreground break-all border border-border">
                {result.data}
              </div>
            </div>
          )}
          <div className="mt-3 p-2 bg-background/60 rounded text-sm text-foreground">
            {result.success ? (
              <p>
                This attack worked because the system didn&apos;t validate or sanitize user input. A hacker could use this to steal data, modify records, or take control of the system.
              </p>
            ) : (
              <p>
                This input was safely handled. The system either validated the input or escaped special characters, preventing the injection attack.
              </p>
            )}
          </div>

          {coach && shouldShowCoach && (
            <div className="mt-3 space-y-2 animate-in fade-in duration-300">
              <div className="flex items-center">
                <span className="rounded-full border border-border/60 bg-secondary/20 px-2.5 py-1 text-xs font-medium text-foreground">
                  {coachSourceLabel}
                </span>
              </div>

              {isNonEmpty(coach.hint) && (
                <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-yellow-200">💡 Hint (based on your action)</p>
                  <p className="mt-1 text-sm text-muted-foreground">{coach.hint}</p>
                </div>
              )}

              {isNonEmpty(coach.mistake) && (
                <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-300">❌ Mistake</p>
                  <p className="mt-1 text-sm text-muted-foreground">{coach.mistake}</p>
                </div>
              )}

              {isNonEmpty(coach.next) && (
                <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">➡️ Next Step</p>
                  <p className="mt-1 text-sm text-muted-foreground">{coach.next}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {strategyFeedback && (
        <div className="rounded-md border border-blue-500/30 bg-blue-900/10 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">🧠 Strategy Feedback</p>
          <p className="mt-1 text-sm text-foreground">Score: {strategyFeedback.score}/100</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {strategyFeedback.insights.map((insight) => (
              <li key={insight} className="flex gap-2">
                <span className="text-blue-300">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result && replayTimeline.length > 0 && (
        <div className="rounded-md border border-border/60 bg-background/40 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">🎮 Session Replay</p>
            <button
              type="button"
              onClick={() => {
                setReplayOpen((prev) => !prev);
                if (!replayOpen) {
                  setReplayCursor(0);
                  setReplayPlaying(false);
                }
              }}
              className="rounded-md border border-border/60 bg-secondary/20 px-2.5 py-1 text-xs text-foreground hover:bg-secondary/40"
            >
              ▶️ Replay Attack
            </button>
          </div>

          {replayOpen && (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReplayCursor(0);
                    setReplayPlaying(true);
                  }}
                  className="rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs text-primary"
                >
                  {replayPlaying ? 'Playing...' : 'Play'}
                </button>
                <button
                  type="button"
                  onClick={() => setReplayPlaying(false)}
                  className="rounded-md border border-border/60 bg-secondary/20 px-2.5 py-1 text-xs text-foreground"
                >
                  Pause
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReplayPlaying(false);
                    setReplayCursor(0);
                  }}
                  className="rounded-md border border-border/60 bg-secondary/20 px-2.5 py-1 text-xs text-foreground"
                >
                  Reset
                </button>

                <div className="ml-auto flex items-center gap-1 rounded-md border border-border/60 bg-secondary/20 p-1">
                  {(['slow', 'normal', 'fast'] as const).map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => setReplaySpeed(speed)}
                      className={`rounded px-2 py-1 text-[11px] capitalize ${
                        replaySpeed === speed ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {replayTimeline.slice(0, Math.max(replayCursor, 1)).map((entry) => (
                  <div key={`${entry.stepIndex}-${entry.userAction}`} className="rounded-md border border-border/60 bg-secondary/20 p-2 text-xs">
                    <p className="font-medium text-foreground">Step {entry.stepIndex}</p>
                    <p className="mt-1 text-muted-foreground">User action: {entry.userAction}</p>
                    <p className="mt-1 text-muted-foreground">Attacker response: {entry.attackerResponse}</p>
                    {entry.narration && (
                      <p className="mt-1 text-muted-foreground">Narration: {entry.narration}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
