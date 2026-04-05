import type { ScenarioDifficulty, ScenarioType } from "./scenario-types";
import { generateScenarioWithLLM } from "../server/llm-client";

export type SimulationOutcome = "success" | "partial" | "failure";
type SystemStatus = "secured" | "degraded" | "compromised" | "fully_compromised";
type AttackerProgress = "foothold" | "privilege_escalation" | "lateral_movement" | "exfiltration";
type AttackerMemory = {
  previous_failures: string[];
  preferred_style: "stealth" | "aggressive";
};
const ATTACK_STAGES = [
  "initial_access",
  "privilege_escalation",
  "lateral_movement",
  "exfiltration",
] as const;
type AttackStage = typeof ATTACK_STAGES[number];

const ATTACK_TRANSITIONS: Record<AttackStage, AttackStage[]> = {
  initial_access: ["privilege_escalation"],
  privilege_escalation: ["lateral_movement", "exfiltration"],
  lateral_movement: ["privilege_escalation", "exfiltration"],
  exfiltration: [],
};

const STAGE_TO_PROGRESS: Record<AttackStage, AttackerProgress> = {
  initial_access: "foothold",
  privilege_escalation: "privilege_escalation",
  lateral_movement: "lateral_movement",
  exfiltration: "exfiltration",
};

const PROGRESS_TO_STAGE: Record<AttackerProgress, AttackStage> = {
  foothold: "initial_access",
  privilege_escalation: "privilege_escalation",
  lateral_movement: "lateral_movement",
  exfiltration: "exfiltration",
};

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
  attacker_memory?: AttackerMemory;
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
  weakAreas?: string[];
}

export interface SimulationStepResult {
  evaluation: {
    outcome: SimulationOutcome;
    classification?: "correct" | "partial" | "incorrect";
    confidence: "low" | "medium" | "high";
    feedback: string;
    reasoning?: {
      correct_points: string[];
      missed_points: string[];
      next_steps: string[];
    };
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

function normalizeAttackerMemory(value: SimulationState["attacker_memory"]): AttackerMemory {
  if (!value) {
    return {
      previous_failures: [],
      preferred_style: "aggressive",
    };
  }

  const style = value.preferred_style === "stealth" ? "stealth" : "aggressive";
  const failures = Array.isArray(value.previous_failures)
    ? value.previous_failures.filter((entry) => typeof entry === "string").slice(-6)
    : [];

  return {
    previous_failures: failures,
    preferred_style: style,
  };
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
    attacker_memory: normalizeAttackerMemory(input.attacker_memory),
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

function predictFailure(
  state: SimulationState,
  reasoning: {
    correct_points: string[];
    missed_points: string[];
    next_steps: string[];
  },
  classification: "correct" | "partial" | "incorrect",
  weakAreaSignal: boolean
): boolean {
  const incorrectSignal = classification === "incorrect";
  const missedSignal = reasoning.missed_points.length >= 2;
  const lowScoreSignal = state.score < 40;

  const recent = state.history.slice(-3);
  const repeatedMistakes = recent.filter((entry) => entry.outcome !== "success").length >= 2;

  const signalCount = [incorrectSignal, missedSignal, lowScoreSignal, repeatedMistakes, weakAreaSignal].filter(Boolean).length;
  return signalCount >= 2;
}

function hasRecentRecovery(state: SimulationState): boolean {
  const recent = state.history.slice(-2);
  return recent.some((entry) => entry.outcome === "success");
}

function buildSimulationPrompt(
  state: SimulationState,
  userAction: string,
  context: SimulationScenarioContext,
  willLikelyFail: boolean
): string {
  const redFlags = context.redFlags && context.redFlags.length > 0
    ? context.redFlags.join(", ")
    : "none";
  const recentHistory = formatRecentHistory(state);
  const currentStage = stageFromProgress(state.attacker_progress);
  const allowedNext = ATTACK_TRANSITIONS[currentStage];
  const weakAreas = context.weakAreas && context.weakAreas.length > 0
    ? context.weakAreas.join(", ")
    : "none";
  const attackerMemory = normalizeAttackerMemory(state.attacker_memory);

  return [
    "Generate the next attacker move for a multi-step cyber training simulation.",
    "Return strict JSON only in the standard scenario schema.",
    "The attacker MUST react to every user action.",
    "If the user action is ineffective or incorrect, the attacker SHOULD respond realistically. This may include advancing, consolidating access, or remaining stealthy depending on the situation.",
    "When advancing, choose one realistic progression: privilege escalation, lateral movement, or data exfiltration.",
    "Maintain consistency with the overall attack progression even if earlier steps are not shown.",
    "Evaluate the user's reasoning, not just the action.",
    "Return what the user did correctly, what critical steps were missed, and what should be done next.",
    "Always include at least one positive observation if the user's action has any correct aspect.",
    "Be concise and practical.",
    "In explanation.user, format reasoning as: CORRECT: ... | MISSED: ... | NEXT: ...",
    "The attack follows stages: initial_access -> privilege_escalation -> lateral_movement -> exfiltration.",
    "The attacker must progress through these stages logically.",
    "The attacker should maintain a consistent strategy across steps unless forced to adapt.",
    "The attacker should maintain continuity with previous actions and avoid abrupt strategy changes unless triggered by user actions.",
    "Use recent history to maintain a consistent attack strategy across steps.",
    "The attacker's goal is to reach data exfiltration efficiently while avoiding detection.",
    "Decisions should align with this long-term objective, not random stage switching.",
    "User actions influence pathing: good defense may force strategy change, weak defense may accelerate progression.",
    "The attacker may escalate privileges, move laterally, attempt exfiltration, or remain stealthy if beneficial.",
    "The attacker may choose to remain stealthy and delay visible actions if it improves long-term success or avoids detection.",
    "Attacker should adapt based on previous failures and user defenses.",
    "In explanation.developer, append a stage marker as: STAGE: <initial_access|privilege_escalation|lateral_movement|exfiltration>",
    `Current step: ${state.step}/${state.maxSteps}`,
    `Current system status: ${state.system_status}`,
    `Current attacker progress: ${state.attacker_progress}`,
    `Current attack stage: ${currentStage}`,
    `Allowed next stages: ${allowedNext.length > 0 ? allowedNext.join(", ") : "none"}`,
    `Scenario title: ${context.title ?? "N/A"}`,
    `Scenario content: ${context.content ?? "N/A"}`,
    `User weak areas: ${weakAreas}`,
    `Attacker preferred style: ${attackerMemory.preferred_style}`,
    `Attacker previous failures: ${attackerMemory.previous_failures.length > 0 ? attackerMemory.previous_failures.join(", ") : "none"}`,
    `User action in previous step: ${userAction}`,
    `Recent steps:\n${recentHistory}`,
    `Training objective: ${context.objective ?? "Teach secure decision-making."}`,
    `Known red flags: ${redFlags}`,
    "The generated content should represent the next attacker tactic and escalation.",
    "Use realistic social engineering progression and keep it concise.",
    ...(willLikelyFail
      ? [
          "The user is likely struggling.",
          "Adjust difficulty by slowing attacker progression slightly, providing subtle hints, and avoiding overwhelming complexity.",
          "Hints must be subtle and should not reveal direct answers.",
          "Include small guidance in explanation.user or implicit cues in next_prompt while keeping attacker behavior realistic.",
        ]
      : []),
  ].join("\n");
}

function stageFromProgress(progress: SimulationState["attacker_progress"]): AttackStage {
  return PROGRESS_TO_STAGE[normalizeAttackerProgress(progress)];
}

function normalizeTopic(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, "_");
}

function isWeakAreaMatch(
  weakAreas: string[] | undefined,
  context: SimulationScenarioContext,
  currentStage: AttackStage
): boolean {
  if (!weakAreas || weakAreas.length === 0) {
    return false;
  }

  const normalized = weakAreas.map(normalizeTopic);
  const scenarioType = normalizeTopic(context.type);

  if (normalized.includes(scenarioType) || normalized.includes(currentStage)) {
    return true;
  }

  if (normalized.includes("input_validation")) {
    return scenarioType === "phishing" || scenarioType === "smishing" || currentStage === "initial_access";
  }

  return false;
}

function deriveAttackerMemory(
  state: SimulationState,
  userAction: string,
  classification: "correct" | "partial" | "incorrect"
): AttackerMemory {
  const current = normalizeAttackerMemory(state.attacker_memory);
  const action = userAction.toLowerCase();
  const previousFailures = [...current.previous_failures];

  if (classification === "incorrect") {
    previousFailures.push(`missed:${state.step}`);
  }

  if (action.includes("block") && action.includes("network")) {
    previousFailures.push("network_blocked");
  }

  const recent = previousFailures.slice(-6);
  const repeatedBlocks = recent.filter((entry) => entry.includes("network_blocked")).length >= 2;
  const repeatedMisses = recent.filter((entry) => entry.includes("missed")).length >= 2;

  let preferredStyle: "stealth" | "aggressive" = current.preferred_style;
  if (repeatedBlocks || action.includes("block") || action.includes("isolate")) {
    preferredStyle = "stealth";
  } else if (repeatedMisses) {
    preferredStyle = "aggressive";
  }

  return {
    previous_failures: recent,
    preferred_style: preferredStyle,
  };
}

function progressFromStage(stage: AttackStage): AttackerProgress {
  return STAGE_TO_PROGRESS[stage];
}

function parseNextStageFromAiText(text: string): AttackStage | null {
  const lowered = text.toLowerCase();
  for (const stage of ATTACK_STAGES) {
    const escaped = stage.replace("_", "[_\\s-]?");
    const matcher = new RegExp(`\\b${escaped}\\b`, "i");
    if (matcher.test(lowered)) {
      return stage;
    }
  }

  return null;
}

function parseNextStageFromAiScenario(aiScenario: {
  content: string;
  explanation: { hacker: string; user: string; developer: string };
}): AttackStage | null {
  const combined = [
    aiScenario.explanation.developer,
    aiScenario.explanation.hacker,
    aiScenario.explanation.user,
    aiScenario.content,
  ].join("\n");

  return parseNextStageFromAiText(combined);
}

function getNextStage(
  currentStage: AttackStage,
  classification: "correct" | "partial" | "incorrect",
  action: string,
  stepIndex: number,
  willLikelyFail: boolean,
  attackerMemory: AttackerMemory
): AttackStage {
  if (currentStage === "exfiltration") {
    return "exfiltration";
  }

  const normalizedAction = action.trim().toLowerCase();
  const allowed = ATTACK_TRANSITIONS[currentStage];
  if (allowed.length === 0) {
    return currentStage;
  }

  const mostSevereAllowed = [...allowed].sort(
    (a, b) => ATTACK_STAGES.indexOf(b) - ATTACK_STAGES.indexOf(a)
  )[0];
  const leastSevereAllowed = [...allowed].sort(
    (a, b) => ATTACK_STAGES.indexOf(a) - ATTACK_STAGES.indexOf(b)
  )[0];

  const continuityStage =
    currentStage === "privilege_escalation" && allowed.includes("lateral_movement")
      ? "lateral_movement"
      : leastSevereAllowed;

  if (
    normalizedAction.includes("check logs") ||
    normalizedAction.includes("audit logs") ||
    normalizedAction.includes("log analysis")
  ) {
    if (stepIndex <= 2 && allowed.length > 0) {
      const fastestEscalation = [...allowed].sort(
        (a, b) => ATTACK_STAGES.indexOf(b) - ATTACK_STAGES.indexOf(a)
      )[0];
      return fastestEscalation;
    }

    return currentStage;
  }

  if (normalizedAction.includes("block ip") || normalizedAction.includes("block network")) {
    if (attackerMemory.preferred_style === "stealth") {
      return currentStage;
    }

    return "privilege_escalation";
  }

  if (classification === "incorrect") {
    if (willLikelyFail) {
      const shouldHold = stepIndex % 2 === 0;
      return shouldHold ? currentStage : continuityStage;
    }

    return mostSevereAllowed;
  }

  if (classification === "partial") {
    const shouldAdvance = stepIndex % 2 === 1;
    return shouldAdvance ? continuityStage : currentStage;
  }

  if (classification === "correct") {
    return continuityStage;
  }

  return currentStage;
}

function applyCriticalMistakeEscalation(
  currentStage: AttackStage,
  proposedStage: AttackStage,
  classification: "correct" | "partial" | "incorrect",
  stepIndex: number,
  reasoning: {
    correct_points: string[];
    missed_points: string[];
    next_steps: string[];
  }
): AttackStage {
  if (classification !== "incorrect" || stepIndex <= 1) {
    return proposedStage;
  }

  const severeSignals = ["ignored compromise", "no investigation", "missed indicators"];
  const hasSevereSignal = reasoning.missed_points.some((point) => {
    const normalized = point.toLowerCase();
    return severeSignals.some((signal) => normalized.includes(signal));
  });

  if (!hasSevereSignal) {
    return proposedStage;
  }

  const allowed = ATTACK_TRANSITIONS[currentStage];
  if (allowed.length === 0) {
    return proposedStage;
  }

  const mostSevereAllowed = [...allowed].sort(
    (a, b) => ATTACK_STAGES.indexOf(b) - ATTACK_STAGES.indexOf(a)
  )[0];

  return ATTACK_STAGES.indexOf(mostSevereAllowed) > ATTACK_STAGES.indexOf(proposedStage)
    ? mostSevereAllowed
    : proposedStage;
}

function resolveAiNextStage(
  currentStage: AttackStage,
  aiCandidateStage: AttackStage | null,
  classification: "correct" | "partial" | "incorrect",
  action: string,
  stepIndex: number,
  willLikelyFail: boolean,
  attackerMemory: AttackerMemory
): AttackStage {
  const deterministicFallback = getNextStage(currentStage, classification, action, stepIndex, willLikelyFail, attackerMemory);
  if (!aiCandidateStage) {
    return deterministicFallback;
  }

  if (aiCandidateStage === currentStage) {
    return currentStage;
  }

  const allowed = ATTACK_TRANSITIONS[currentStage];
  if (allowed.includes(aiCandidateStage)) {
    return aiCandidateStage;
  }

  return deterministicFallback;
}

function classificationFromOutcome(outcome: SimulationOutcome): "correct" | "partial" | "incorrect" {
  if (outcome === "success") {
    return "correct";
  }

  if (outcome === "partial") {
    return "partial";
  }

  return "incorrect";
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

function parseReasoningFromText(text: string): {
  correct_points: string[];
  missed_points: string[];
  next_steps: string[];
} | null {
  const match = text.match(/CORRECT:\s*(.*?)\s*\|\s*MISSED:\s*(.*?)\s*\|\s*NEXT:\s*(.*)/i);
  if (!match) {
    return null;
  }

  const correctPoints = parseReasoningSection(match[1]);
  const missedPoints = parseReasoningSection(match[2]);
  const nextSteps = parseReasoningSection(match[3]);

  if (correctPoints.length === 0 && missedPoints.length === 0 && nextSteps.length === 0) {
    return null;
  }

  return {
    correct_points: correctPoints,
    missed_points: missedPoints,
    next_steps: nextSteps,
  };
}

function alignClassificationWithReasoning(
  classification: "correct" | "partial" | "incorrect",
  reasoning: {
    correct_points: string[];
    missed_points: string[];
    next_steps: string[];
  }
): "correct" | "partial" | "incorrect" {
  if (classification === "correct" && reasoning.missed_points.length > 0) {
    return "partial";
  }

  return classification;
}

function applyReasoningPenalty(
  baseScore: number,
  reasoning: {
    correct_points: string[];
    missed_points: string[];
    next_steps: string[];
  }
): number {
  const penalty = Math.min(reasoning.missed_points.length, 5);
  return clampScore(baseScore - penalty);
}

function generateReasoningFromCache(
  action: string,
  classification: "correct" | "partial" | "incorrect",
  stepIndex: number,
  willLikelyFail: boolean
): {
  correct_points: string[];
  missed_points: string[];
  next_steps: string[];
} {
  const normalized = action.trim().toLowerCase();
  const nextStepVariants = [
    "Check logs for suspicious activity",
    "Inspect system logs for anomalies",
    "Review audit logs for indicators",
  ];
  const selectedVariant = nextStepVariants[stepIndex % nextStepVariants.length];

  let reasoning: {
    correct_points: string[];
    missed_points: string[];
    next_steps: string[];
  };

  if (normalized.length === 0) {
    reasoning = {
      correct_points: [],
      missed_points: ["No meaningful action taken"],
      next_steps: ["Start by identifying indicators of compromise"],
    };
  } else if (normalized.includes("block ip")) {
    reasoning = {
      correct_points: ["Good containment action"],
      missed_points: ["Did not investigate source of attack"],
      next_steps: [selectedVariant],
    };
  } else if (classification === "correct") {
    reasoning = {
      correct_points: ["Selected a defensible response aligned to mitigation goals"],
      missed_points: ["Could improve by documenting the incident trail"],
      next_steps: ["Confirm remediation and monitor for recurrence"],
    };
  } else if (classification === "partial") {
    reasoning = {
      correct_points: ["Took a partially useful defensive step"],
      missed_points: ["Critical verification or containment steps were incomplete"],
      next_steps: ["Validate attacker indicators and escalate to incident response"],
    };
  } else {
    reasoning = {
      correct_points: [],
      missed_points: ["Response did not reduce attacker advantage"],
      next_steps: ["Contain access immediately, then verify scope and impact"],
    };
  }

  if (
    (classification === "correct" || classification === "partial") &&
    reasoning.correct_points.length === 0
  ) {
    reasoning = {
      ...reasoning,
      correct_points: ["You identified part of the threat context"],
    };
  }

  if (willLikelyFail) {
    const hintVariants = [
      "Consider reviewing logs before taking further action",
      "Think about how the attacker gained access",
    ];
    const selectedHint = hintVariants[stepIndex % hintVariants.length];
    const selectedHintLower = selectedHint.toLowerCase();
    const guidedNextSteps = [...reasoning.next_steps];
    const hasSimilarHint = guidedNextSteps.some((step) => {
      const normalizedStep = step.toLowerCase();
      return (
        normalizedStep.includes(selectedHintLower) ||
        (selectedHintLower.includes("reviewing logs") && normalizedStep.includes("logs")) ||
        (selectedHintLower.includes("gained access") && normalizedStep.includes("gained access"))
      );
    });

    if (!hasSimilarHint) {
      guidedNextSteps.push(selectedHint);
    }

    reasoning = {
      ...reasoning,
      next_steps: guidedNextSteps,
    };
  }

  return reasoning;
}

function safeReasoningDefault(): {
  correct_points: string[];
  missed_points: string[];
  next_steps: string[];
} {
  return {
    correct_points: [],
    missed_points: ["Insufficient analysis"],
    next_steps: ["Review the situation and take appropriate action"],
  };
}

function buildAiReasoning(
  userAction: string,
  classification: "correct" | "partial" | "incorrect",
  explanationUserText: string,
  stepIndex: number,
  willLikelyFail: boolean
): {
  correct_points: string[];
  missed_points: string[];
  next_steps: string[];
} {
  const parsed = parseReasoningFromText(explanationUserText);
  if (parsed) {
    if (
      (classification === "correct" || classification === "partial") &&
      parsed.correct_points.length === 0
    ) {
      return {
        ...parsed,
        correct_points: ["You recognized at least part of the attack pattern"],
      };
    }

    return parsed;
  }

  const cacheReasoning = generateReasoningFromCache(userAction, classification, stepIndex, willLikelyFail);
  if (
    cacheReasoning.correct_points.length > 0 ||
    cacheReasoning.missed_points.length > 0 ||
    cacheReasoning.next_steps.length > 0
  ) {
    return cacheReasoning;
  }

  return safeReasoningDefault();
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
  evaluation: ReturnType<typeof evaluateAction>,
  nextProgress: AttackerProgress
): {
  system_status: SystemStatus;
  attacker_progress: AttackerProgress;
  status: "in_progress" | "completed";
} {
  const currentProgress = normalizeAttackerProgress(nextProgress);
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
  const systemStatus = severityFromProgress[currentProgress];

  return {
    attacker_progress: currentProgress,
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
  const currentStage = PROGRESS_TO_STAGE[currentProgress];
  const nextStage = PROGRESS_TO_STAGE[nextProgress];
  const allowedNext = ATTACK_TRANSITIONS[currentStage];

  const isAllowedTransition =
    nextStage === currentStage || allowedNext.includes(nextStage);

  const guardedProgress = isAllowedTransition ? nextProgress : currentProgress;

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
  const initialClassification = classificationFromOutcome(evaluation.outcome);
  const baselineReasoning = generateReasoningFromCache(userAction, initialClassification, state.step, false);
  const weakAreaSignal = isWeakAreaMatch(context.weakAreas, context, stageFromProgress(state.attacker_progress));
  let baselinePrediction = predictFailure(state, baselineReasoning, initialClassification, weakAreaSignal);
  if (hasRecentRecovery(state)) {
    baselinePrediction = false;
  }

  const reasoning = generateReasoningFromCache(userAction, initialClassification, state.step, baselinePrediction);
  const classification = alignClassificationWithReasoning(initialClassification, reasoning);
  const attackerMemory = deriveAttackerMemory(state, userAction, classification);
  let willLikelyFail = predictFailure(state, reasoning, classification, weakAreaSignal);
  if (hasRecentRecovery(state)) {
    willLikelyFail = false;
  }

  const nextStep = Math.min(state.step + 1, state.maxSteps);
  const currentStage = stageFromProgress(state.attacker_progress);
  const deterministicStage = getNextStage(currentStage, classification, userAction, state.step, willLikelyFail, attackerMemory);
  const nextStage = applyCriticalMistakeEscalation(currentStage, deterministicStage, classification, state.step, reasoning);
  const evolved = evolveState(state, evaluation, progressFromStage(nextStage));

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
  const scored = applyReasoningPenalty(clampScore(state.score + evaluation.scoreDelta), reasoning);
  const candidateState = applyStateGuards(state, {
    ...state,
    step: nextStep,
    score: scored,
    status: evolved.status,
    system_status: evolved.system_status,
    attacker_progress: evolved.attacker_progress,
    attacker_memory: attackerMemory,
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
      classification,
      confidence: evaluation.confidence,
      feedback: evaluation.feedback,
      reasoning: reasoning ?? safeReasoningDefault(),
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
        classification: "partial",
        confidence: "low",
        feedback: "Simulation already completed.",
        reasoning: {
          correct_points: [],
          missed_points: ["Simulation is already in a terminal state"],
          next_steps: ["Start a new simulation run to continue practicing"],
        },
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
    const promptEvaluation = evaluateAction(userAction, scenarioContext.correctAction);
    const promptClassification = classificationFromOutcome(promptEvaluation.outcome);
    const promptMemory = deriveAttackerMemory(state, userAction, promptClassification);
    const promptReasoning = generateReasoningFromCache(userAction, promptClassification, state.step, false);
    const weakAreaSignal = isWeakAreaMatch(
      scenarioContext.weakAreas,
      scenarioContext,
      stageFromProgress(state.attacker_progress)
    );
    let willLikelyFail = predictFailure(state, promptReasoning, promptClassification, weakAreaSignal);
    if (hasRecentRecovery(state)) {
      willLikelyFail = false;
    }

    const prompt = buildSimulationPrompt({ ...state, attacker_memory: promptMemory }, userAction, scenarioContext, willLikelyFail);
    const aiScenario = await generateSimulationStepWithLLM(prompt, scenarioContext);

    const evaluation = evaluateAction(userAction, scenarioContext.correctAction ?? aiScenario.correct_action);
    const initialClassification = classificationFromOutcome(evaluation.outcome);
    const reasoning = buildAiReasoning(userAction, initialClassification, aiScenario.explanation.user, state.step, willLikelyFail);
    const classification = alignClassificationWithReasoning(initialClassification, reasoning);
    const attackerMemory = deriveAttackerMemory(state, userAction, classification);
    let likelyFailForBranching = predictFailure(state, reasoning, classification, weakAreaSignal);
    if (hasRecentRecovery(state)) {
      likelyFailForBranching = false;
    }

    const nextStep = Math.min(state.step + 1, state.maxSteps);
    const currentStage = stageFromProgress(state.attacker_progress);
    const aiCandidateStage = parseNextStageFromAiScenario(aiScenario);
    const resolvedStage = resolveAiNextStage(currentStage, aiCandidateStage, classification, userAction, state.step, likelyFailForBranching, attackerMemory);
    const nextStage = applyCriticalMistakeEscalation(currentStage, resolvedStage, classification, state.step, reasoning);
    const evolved = evolveState(state, evaluation, progressFromStage(nextStage));
    const attackerReaction = aiScenario.explanation.hacker || aiScenario.content;
    const scored = applyReasoningPenalty(clampScore(state.score + evaluation.scoreDelta), reasoning);

    const candidateState = applyStateGuards(state, {
      ...state,
      step: nextStep,
      score: scored,
      status: evolved.status,
      system_status: evolved.system_status,
      attacker_progress: evolved.attacker_progress,
      attacker_memory: attackerMemory,
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
        classification,
        confidence: evaluation.confidence,
        feedback: evaluation.feedback,
        reasoning: reasoning ?? safeReasoningDefault(),
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
