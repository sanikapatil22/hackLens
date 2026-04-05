// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../lib/ai/llm-client", () => ({
  generateScenarioWithLLM: vi.fn(),
}));

vi.mock("../lib/ai/rate-limiter", () => ({
  canMakeAIRequest: vi.fn(() => true),
  getCooldownTime: vi.fn(() => 0),
}));

import { generateScenario } from "../lib/ai/scenario-engine";
import { generateScenarioWithLLM } from "../lib/ai/llm-client";
import { canMakeAIRequest } from "../lib/ai/rate-limiter";

const mockedGenerateScenarioWithLLM = vi.mocked(generateScenarioWithLLM);
const mockedCanMakeAIRequest = vi.mocked(canMakeAIRequest);

describe("scenario-engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
  });

  test("demo mode returns a cached scenario", async () => {
    const scenario = await generateScenario({ type: "phishing", difficulty: "easy", selectionMode: "manual" }, "demo");

    expect(scenario).toBeTruthy();
    expect(scenario.meta.source).toBe("cached");
    expect(scenario.meta.mode).toBe("manual");
    expect(scenario.solution).toBeTruthy();
  });

  test("live mode without API key falls back to cache", async () => {
    const scenario = await generateScenario({ type: "smishing", difficulty: "medium", selectionMode: "manual" }, "live");

    expect(scenario.meta.source).toBe("cached");
    expect(scenario.solution.immediate_action.length).toBeGreaterThan(0);
  });

  test("live mode with LLM failure falls back correctly", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    mockedGenerateScenarioWithLLM.mockRejectedValueOnce(new Error("LLM failed"));

    const scenario = await generateScenario({ type: "impersonation", difficulty: "hard", selectionMode: "adaptive", difficultyReason: "test reason" }, "live");

    expect(scenario.meta.source).toBe("cached");
    expect(scenario.meta.mode).toBe("adaptive");
    expect(scenario.meta.difficulty_reason).toBe("test reason");
  });

  test("returned scenario always includes solution and meta", async () => {
    const scenario = await generateScenario({ type: "phishing", difficulty: "medium", selectionMode: "manual" }, "demo");

    expect(scenario.solution).toBeDefined();
    expect(scenario.solution.immediate_action).toBeTruthy();
    expect(scenario.solution.prevention_tips.length).toBeGreaterThan(0);
    expect(scenario.solution.best_practices.length).toBeGreaterThan(0);
    expect(scenario.meta).toBeDefined();
    expect(["cached", "ai"]).toContain(scenario.meta.source);
    expect(["manual", "adaptive"]).toContain(scenario.meta.mode);
  });

  test("live mode falls back when rate limiter is triggered", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    mockedCanMakeAIRequest.mockReturnValueOnce(false);

    const scenario = await generateScenario({ type: "phishing", difficulty: "easy", selectionMode: "manual" }, "live");

    expect(scenario.meta.source).toBe("cached");
    expect(mockedGenerateScenarioWithLLM).not.toHaveBeenCalled();
  });

  test("live mode uses cache hit and avoids second LLM call", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    mockedCanMakeAIRequest.mockReturnValue(true);

    const aiScenario = {
      id: "llm-cache-hit",
      type: "phishing",
      difficulty: "easy",
      interface: "email",
      title: "AI cacheable scenario",
      content: "Suspicious message",
      options: ["Ignore", "Report"],
      correct_action: "Report",
      red_flags: ["Urgent tone"],
      explanation: {
        hacker: "Attacker creates urgency",
        user: "Verify sender",
        developer: "Protect with training and controls",
      },
      solution: {
        immediate_action: "Report immediately",
        prevention_tips: ["Do not click unknown links"],
        best_practices: ["Enable anti-phishing filtering"],
      },
      meta: {
        source: "ai",
        mode: "manual",
      },
    } as const;

    mockedGenerateScenarioWithLLM.mockResolvedValueOnce(aiScenario as never);

    const params = { type: "phishing" as const, difficulty: "easy" as const, selectionMode: "manual" as const };

    const first = await generateScenario(params, "live");
    const second = await generateScenario(params, "live");

    expect(first.meta.source).toBe("ai");
    expect(second.meta.source).toBe("ai");
    expect(mockedGenerateScenarioWithLLM).toHaveBeenCalledTimes(1);
  });
});
