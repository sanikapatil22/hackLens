export type InteractionLog = {
  scenarioType: string;
  difficulty: string;
  isCorrect: boolean;
  selectedAction: string;
  correctAction: string;
  redFlags: string[];
  timestamp: number;
};

export type UserStats = {
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  byType: Record<
    string,
    {
      attempts: number;
      correct: number;
      accuracy: number;
    }
  >;
  commonMistakes: string[];
  weakAreas: string[];
};

const STORAGE_KEY = "hacklens_user_stats";

function defaultStats(): UserStats {
  return {
    totalAttempts: 0,
    correctAttempts: 0,
    accuracy: 0,
    byType: {},
    commonMistakes: [],
    weakAreas: [],
  };
}

function isValidInteractionLog(value: unknown): value is InteractionLog {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<InteractionLog>;

  return (
    typeof candidate.scenarioType === "string" &&
    typeof candidate.difficulty === "string" &&
    typeof candidate.isCorrect === "boolean" &&
    typeof candidate.selectedAction === "string" &&
    typeof candidate.correctAction === "string" &&
    Array.isArray(candidate.redFlags) &&
    candidate.redFlags.every((flag) => typeof flag === "string") &&
    typeof candidate.timestamp === "number"
  );
}

function readLogs(): InteractionLog[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isValidInteractionLog);
  } catch {
    return [];
  }
}

function saveLogs(logs: InteractionLog[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // Ignore storage quota and serialization errors.
  }
}

function calculateAccuracy(correct: number, attempts: number): number {
  if (attempts === 0) {
    return 0;
  }

  return Math.round((correct / attempts) * 100);
}

export function logInteraction(log: InteractionLog): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!isValidInteractionLog(log)) {
    return;
  }

  const existing = readLogs();
  existing.push(log);
  saveLogs(existing);
}

export function getUserStats(): UserStats {
  const logs = readLogs();
  if (logs.length === 0) {
    return defaultStats();
  }

  const totalAttempts = logs.length;
  const correctAttempts = logs.filter((entry) => entry.isCorrect).length;

  const byTypeAccumulator: Record<string, { attempts: number; correct: number }> = {};
  const mistakesCounter: Record<string, number> = {};

  for (const entry of logs) {
    if (!byTypeAccumulator[entry.scenarioType]) {
      byTypeAccumulator[entry.scenarioType] = { attempts: 0, correct: 0 };
    }

    byTypeAccumulator[entry.scenarioType].attempts += 1;
    if (entry.isCorrect) {
      byTypeAccumulator[entry.scenarioType].correct += 1;
    } else {
      mistakesCounter[entry.selectedAction] = (mistakesCounter[entry.selectedAction] ?? 0) + 1;
    }
  }

  const byType: UserStats["byType"] = {};
  const weakAreas: string[] = [];

  for (const [type, data] of Object.entries(byTypeAccumulator)) {
    const typeAccuracy = calculateAccuracy(data.correct, data.attempts);

    byType[type] = {
      attempts: data.attempts,
      correct: data.correct,
      accuracy: typeAccuracy,
    };

    if (typeAccuracy < 60) {
      weakAreas.push(type);
    }
  }

  const commonMistakes = Object.entries(mistakesCounter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([action]) => action);

  return {
    totalAttempts,
    correctAttempts,
    accuracy: calculateAccuracy(correctAttempts, totalAttempts),
    byType,
    commonMistakes,
    weakAreas,
  };
}
