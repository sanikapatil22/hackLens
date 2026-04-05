import { cachedScenarios, scenarioPool } from "./scenario-cache";
import type { Scenario, ScenarioParams } from "./scenario-types";

export function getScenarioKey(params: ScenarioParams): string {
  return `${params.type}-${params.difficulty}`;
}

export function randomPick<T>(arr: T[]): T {
  if (arr.length === 0) {
    throw new Error("Cannot pick a random item from an empty array.");
  }

  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
}

export function getCachedScenario(params: ScenarioParams): Scenario | null {
  const exactKey = getScenarioKey(params);
  const exactMatches = cachedScenarios[exactKey];

  if (exactMatches && exactMatches.length > 0) {
    return randomPick(exactMatches);
  }

  const sameTypeMatches = scenarioPool.filter((scenario) => scenario.type === params.type);
  if (sameTypeMatches.length > 0) {
    return randomPick(sameTypeMatches);
  }

  if (scenarioPool.length > 0) {
    return randomPick(scenarioPool);
  }

  return null;
}
