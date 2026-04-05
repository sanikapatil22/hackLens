import { describe, expect, test } from "vitest";

import { cachedScenarios } from "../lib/ai/scenario-cache";
import { generateBasicSolution } from "../lib/ai/llm-client";

describe("solution coverage", () => {
  test("all cached scenarios contain required solution fields", () => {
    const allScenarios = Object.values(cachedScenarios).flat();

    expect(allScenarios.length).toBeGreaterThan(0);

    for (const scenario of allScenarios) {
      expect(scenario.solution).toBeDefined();
      expect(scenario.solution.immediate_action).toBeTruthy();
      expect(Array.isArray(scenario.solution.prevention_tips)).toBe(true);
      expect(scenario.solution.prevention_tips.length).toBeGreaterThan(0);
      expect(Array.isArray(scenario.solution.best_practices)).toBe(true);
      expect(scenario.solution.best_practices.length).toBeGreaterThan(0);
    }
  });

  test("generateBasicSolution always returns a valid structure", () => {
    const types = ["phishing", "smishing", "impersonation", "malware", "unknown"];

    for (const type of types) {
      const solution = generateBasicSolution(type);
      expect(solution.immediate_action).toBeTruthy();
      expect(solution.prevention_tips.length).toBeGreaterThan(0);
      expect(solution.best_practices.length).toBeGreaterThan(0);
    }
  });
});
