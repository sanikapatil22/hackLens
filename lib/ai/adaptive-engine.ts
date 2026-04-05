import type { ScenarioDifficulty, ScenarioParams, ScenarioType } from "./scenario-types";
import { getUserStats } from "./user-tracking";

const scenarioTypes: ScenarioType[] = ["phishing", "smishing", "impersonation", "malware"];

function getRandomType(): ScenarioType {
  const index = Math.floor(Math.random() * scenarioTypes.length);
  return scenarioTypes[index];
}

function getWeakestType(weakAreas: string[], byType: Record<string, { accuracy: number }>): ScenarioType | null {
  let weakest: ScenarioType | null = null;
  let lowestAccuracy = Number.POSITIVE_INFINITY;

  for (const area of weakAreas) {
    if (!scenarioTypes.includes(area as ScenarioType)) {
      continue;
    }

    const accuracy = byType[area]?.accuracy ?? 0;
    if (accuracy < lowestAccuracy) {
      lowestAccuracy = accuracy;
      weakest = area as ScenarioType;
    }
  }

  return weakest;
}

function resolveDifficulty(accuracy: number): ScenarioDifficulty {
  if (accuracy < 40) {
    return "easy";
  }

  if (accuracy <= 70) {
    return "medium";
  }

  return "hard";
}

function getDifficultyReason(accuracy: number, difficulty: ScenarioDifficulty): string {
  if (accuracy < 40) {
    return "Difficulty set to easy due to low accuracy";
  }

  if (accuracy <= 70) {
    return "Difficulty set to medium for balanced practice";
  }

  return "Difficulty increased due to strong performance";
}

export function getAdaptiveParams(): ScenarioParams {
  const stats = getUserStats();

  if (stats.totalAttempts === 0) {
    return {
      type: "phishing",
      difficulty: "medium",
      selectionMode: "adaptive",
      difficultyReason: "Difficulty set to medium while baseline performance is being established",
    };
  }

  const weakestType = getWeakestType(stats.weakAreas, stats.byType);
  const difficulty = resolveDifficulty(stats.accuracy);

  return {
    type: weakestType ?? getRandomType(),
    difficulty,
    selectionMode: "adaptive",
    difficultyReason: getDifficultyReason(stats.accuracy, difficulty),
  };
}
