import type { ScenarioDifficulty, ScenarioType } from "./scenario-types";
import { generateScenarioWithLLM } from "../server/llm-client";

export type SimulationOutcome = "success" | "partial" | "failure";
type SystemStatus = "secured" | "degraded" | "compromised" | "fully_compromised";
type AttackerProgress = "foothold" | "privilege_escalation" | "lateral_movement" | "exfiltration";

const attackerProgressOrder: Record<AttackerProgress, number> = {
  foothold: 0,
  privilege_escalation: 1,
  lateral_movement: 2,
  exfiltration: 3,
};

const systemStatusSeverityOrder: Record<SystemStatus, number> = {
  secured: 0,
  degraded: 1,
  compromised: 2,
  fully_compromised: 3,
};

export interface SimulationState {
  step: number;
  maxSteps: number;
  score: number;
  status: "in_progress" | "completed";
  system_status?: SystemStatus;
  attacker_progress?: AttackerProgress;
  history: Array<{
    step: number;
    userAction: string;
    outcome: SimulationOutcome;
    attackerReaction: string;
  }>;
}

export interface SimulationScenarioContext {
  type: ScenarioType;
  difficulty: ScenarioDifficulty;
  title?: string;
  content?: string;
  objective?: string;
  correctAction?: string;
  redFlags?: string[];
}

export interface SimulationStepResult {
  evaluation: {
    outcome: SimulationOutcome;
    confidence: "low" | "medium" | "high";
    feedback: string;
  };
  attackerReaction: string;
  updatedState: SimulationState;
  done: boolean;
  source: "ai" | "fallback";
}

function normalizeSystemStatus(value: SimulationState["system_status"]): SystemStatus {
  if (value === "secured" || value === "degraded" || value === "compromised" || value === "fully_compromised") {
    return value;
  }

  return "degraded";
}

function normalizeAttackerProgress(value: SimulationState["attacker_progress"]): AttackerProgress {
  if (value === "foothold" || value === "privilege_escalation" || value === "lateral_movement" || value === "exfiltration") {
    return value;
  }

  return "foothold";
}

function nextAttackerProgress(current: AttackerProgress): AttackerProgress {
  switch (current) {
    case "foothold":
      return "privilege_escalation";
    case "privilege_escalation":
      return "lateral_movement";
    case "lateral_movement":
      return "exfiltration";
    case "exfiltration":
      return "exfiltration";
  }
}

function isTerminalState(state: SimulationState): boolean {
  return (
    state.status === "completed" ||
    state.step >= state.maxSteps ||
    state.system_status === "fully_compromised" ||
    state.system_status === "secured" ||
    state.attacker_progress === "exfiltration"
  );
}

function normalizeState(input: SimulationState): SimulationState {
  const maxSteps = Math.max(1, input.maxSteps || 3);
  const step = Math.max(1, input.step || 1);

  return {
    step,
    maxSteps,
    score: Math.max(0, input.score || 0),
    status: input.status === "completed" ? "completed" : "in_progress",
    system_status: normalizeSystemStatus(input.system_status),
    attacker_progress: normalizeAttackerProgress(input.attacker_progress),
    history: Array.isArray(input.history) ? input.history : [],
  };
}

function formatRecentHistory(state: SimulationState): string {
  const recent = state.history.slice(-3);
  if (recent.length === 0) {
    return "none";
  }

  return recent
    .map((entry) => {
      return `step ${entry.step}: user_action=${entry.userAction}; outcome=${entry.outcome}; attacker_action=${entry.attackerReaction}`;
    })
    .join("\n");
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function buildSimulationPrompt(
  state: SimulationState,
  userAction: string,
  context: SimulationScenarioContext
): string {
  const redFlags = context.redFlags && context.redFlags.length > 0
    ? context.redFlags.join(", ")
    : "none";
  const recentHistory = formatRecentHistory(state);

  return [
    "Generate the next attacker move for a multi-step cyber training simulation.",
    "Return strict JSON only in the standard scenario schema.",
    "The attacker MUST react to every user action.",
    "If the user action is ineffective or incorrect, the attacker SHOULD respond realistically. This may include advancing, consolidating access, or remaining stealthy depending on the situation.",
    "When advancing, choose one realistic progression: privilege escalation, lateral movement, or data exfiltration.",
    "Maintain consistency with the overall attack progression even if earlier steps are not shown.",
    `Current step: ${state.step}/${state.maxSteps}`,
    `Current system status: ${state.system_status}`,
    `Current attacker progress: ${state.attacker_progress}`,
    `Scenario title: ${context.title ?? "N/A"}`,
    `Scenario content: ${context.content ?? "N/A"}`,
    `User action in previous step: ${userAction}`,
    `Recent steps:\n${recentHistory}`,
    `Training objective: ${context.objective ?? "Teach secure decision-making."}`,
    `Known red flags: ${redFlags}`,
    "The generated content should represent the next attacker tactic and escalation.",
    "Use realistic social engineering progression and keep it concise.",
  ].join("\n");
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function evaluateAction(userAction: string, correctAction?: string): {
  outcome: SimulationOutcome;
  confidence: "low" | "medium" | "high";
  feedback: string;
  scoreDelta: number;
} {
  if (!correctAction || correctAction.trim().length === 0) {
    return {
      outcome: "partial",
      confidence: "low",
      feedback: "Action recorded. Continue with caution and verify through trusted channels.",
      scoreDelta: 5,
    };
  }

  const actionTokens = new Set(tokenize(userAction));
  const correctTokens = tokenize(correctAction);

  const overlapCount = correctTokens.reduce((acc, token) => {
    return actionTokens.has(token) ? acc + 1 : acc;
  }, 0);

  const overlapRatio = correctTokens.length > 0 ? overlapCount / correctTokens.length : 0;

  if (overlapRatio >= 0.6) {
    return {
      outcome: "success",
      confidence: "high",
      feedback: "Good decision. Your response aligns with the recommended mitigation path.",
      scoreDelta: 10,
    };
  }

  if (overlapRatio >= 0.25) {
    return {
      outcome: "partial",
      confidence: "medium",
      feedback: "Partially correct. You identified some defensive intent but missed safer execution details.",
      scoreDelta: 5,
    };
  }

  return {
    outcome: "failure",
    confidence: "medium",
    feedback: "Risky action. Prefer verification, reporting, and least-trust responses to suspicious requests.",
    scoreDelta: -5,
  };
}

async function generateSimulationStepWithLLM(
  prompt: string,
  context: SimulationScenarioContext
) {
  return generateScenarioWithLLM({
    type: context.type,
    difficulty: context.difficulty,
    context: prompt,
  });
}

function evolveState(
  state: SimulationState,
  evaluation: ReturnType<typeof evaluateAction>
): {
  system_status: SystemStatus;
  attacker_progress: AttackerProgress;
  status: "in_progress" | "completed";
} {
  const currentProgress = normalizeAttackerProgress(state.attacker_progress);
  const currentSystemStatus = normalizeSystemStatus(state.system_status);

  const severityFromProgress: Record<AttackerProgress, SystemStatus> = {
    foothold: "degraded",
    privilege_escalation: "compromised",
    lateral_movement: "compromised",
    exfiltration: "fully_compromised",
  };

  if (evaluation.outcome === "success") {
    const secured = clampScore(state.score + evaluation.scoreDelta) >= 70;
    return {
      attacker_progress: currentProgress,
      system_status: secured ? "secured" : currentSystemStatus,
      status: secured ? "completed" : "in_progress",
    };
  }

  if (evaluation.outcome === "partial") {
    return {
      attacker_progress: currentProgress,
      system_status: severityFromProgress[currentProgress],
      status: "in_progress",
    };
  }

  const recentFailures = state.history
    .slice(-2)
    .filter((entry) => entry.outcome === "failure").length;
  const shouldAdvance = recentFailures >= 1 || currentProgress === "foothold";

  const progressed = shouldAdvance ? nextAttackerProgress(currentProgress) : currentProgress;
  const systemStatus = severityFromProgress[progressed];

  return {
    attacker_progress: progressed,
    system_status: systemStatus,
    status: systemStatus === "fully_compromised" ? "completed" : "in_progress",
  };
}

function applyStateGuards(
  current: SimulationState,
  next: SimulationState,
  evaluation: ReturnType<typeof evaluateAction>
): SimulationState {
  const currentProgress = normalizeAttackerProgress(current.attacker_progress);
  const nextProgress = normalizeAttackerProgress(next.attacker_progress);
  const guardedProgress =
    attackerProgressOrder[nextProgress] < attackerProgressOrder[currentProgress]
      ? currentProgress
      : nextProgress;

  const currentStatus = normalizeSystemStatus(current.system_status);
  const nextStatus = normalizeSystemStatus(next.system_status);
  let guardedStatus = nextStatus;

  if (
    evaluation.outcome !== "success" &&
    systemStatusSeverityOrder[nextStatus] < systemStatusSeverityOrder[currentStatus]
  ) {
    guardedStatus = currentStatus;
  }

  return {
    ...next,
    attacker_progress: guardedProgress,
    system_status: guardedStatus,
  };
}

function buildFallbackResult(
  state: SimulationState,
  userAction: string,
  context: SimulationScenarioContext
): SimulationStepResult {
  const evaluation = evaluateAction(userAction, context.correctAction);
  const nextStep = Math.min(state.step + 1, state.maxSteps);
  const evolved = evolveState(state, evaluation);

  const fallbackReactions: Record<AttackerProgress, string> = {
    foothold: [
      "The attacker refreshes the pretext and probes for trust signals to keep initial access alive.",
      "The attacker stays quiet and re-validates access paths before pushing the next request.",
    ][state.step % 2],
    privilege_escalation: [
      "The attacker pivots to a higher-privilege request, claiming urgent administrative needs.",
      "The attacker reframes the ask as a permissions issue to obtain elevated access.",
    ][state.step % 2],
    lateral_movement: [
      "The attacker shifts toward adjacent systems and contacts, attempting lateral movement.",
      "The attacker reuses trust from one channel to pivot into a neighboring workflow.",
    ][state.step % 2],
    exfiltration: [
      "The attacker begins staging sensitive data for exfiltration under operational pressure.",
      "The attacker packages harvested data and attempts quiet exfiltration via approved-looking channels.",
    ][state.step % 2],
  };

  const attackerReaction = fallbackReactions[evolved.attacker_progress];
  const candidateState = applyStateGuards(state, {
    ...state,
    step: nextStep,
    score: clampScore(state.score + evaluation.scoreDelta),
    status: evolved.status,
    system_status: evolved.system_status,
    attacker_progress: evolved.attacker_progress,
    history: [
      ...state.history,
      {
        step: state.step,
        userAction,
        outcome: evaluation.outcome,
        attackerReaction,
      },
    ],
  }, evaluation);
  const done = isTerminalState(candidateState);

  return {
    evaluation: {
      outcome: evaluation.outcome,
      confidence: evaluation.confidence,
      feedback: evaluation.feedback,
    },
    attackerReaction,
    updatedState: {
      ...candidateState,
      status: done ? "completed" : candidateState.status,
    },
    done,
    source: "fallback",
  };
}

export async function runSimulationStep(
  currentState: SimulationState,
  userAction: string,
  scenarioContext: SimulationScenarioContext
): Promise<SimulationStepResult> {
  const state = normalizeState(currentState);

  if (isTerminalState(state)) {
    return {
      evaluation: {
        outcome: "partial",
        confidence: "low",
        feedback: "Simulation already completed.",
      },
      attackerReaction: "No further attacker action. The simulation has ended.",
      updatedState: {
        ...state,
        status: "completed",
      },
      done: true,
      source: "fallback",
    };
  }

  try {
    const prompt = buildSimulationPrompt(state, userAction, scenarioContext);
    const aiScenario = await generateSimulationStepWithLLM(prompt, scenarioContext);

    const evaluation = evaluateAction(userAction, scenarioContext.correctAction ?? aiScenario.correct_action);
    const nextStep = Math.min(state.step + 1, state.maxSteps);
    const evolved = evolveState(state, evaluation);
    const attackerReaction = aiScenario.explanation.hacker || aiScenario.content;

    const candidateState = applyStateGuards(state, {
      ...state,
      step: nextStep,
      score: clampScore(state.score + evaluation.scoreDelta),
      status: evolved.status,
      system_status: evolved.system_status,
      attacker_progress: evolved.attacker_progress,
      history: [
        ...state.history,
        {
          step: state.step,
          userAction,
          outcome: evaluation.outcome,
          attackerReaction,
        },
      ],
    }, evaluation);
    const done = isTerminalState(candidateState);

    return {
      evaluation: {
        outcome: evaluation.outcome,
        confidence: evaluation.confidence,
        feedback: evaluation.feedback,
      },
      attackerReaction,
      updatedState: {
        ...candidateState,
        status: done ? "completed" : candidateState.status,
      },
      done,
      source: "ai",
    };
  } catch {
    return buildFallbackResult(state, userAction, scenarioContext);
  }
}
