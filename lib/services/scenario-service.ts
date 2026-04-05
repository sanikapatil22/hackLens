import type { Scenario, ScenarioParams } from "../ai/scenario-types";
import { getAdaptiveParams } from "../ai/adaptive-engine";
import { generateScenario } from "../ai/scenario-engine";
import { logService, log } from "../server/logger";

type ScenarioMode = "demo" | "live";

interface GetScenarioInput {
  params?: Partial<ScenarioParams>;
  mode?: ScenarioMode;
  adaptive?: boolean;
}

function resolveScenarioParams(input: GetScenarioInput): ScenarioParams {
  if (input.adaptive) {
    const adaptive = getAdaptiveParams();
    return {
      ...adaptive,
      ...input.params,
      selectionMode: "adaptive",
      difficultyReason: input.params?.difficultyReason ?? adaptive.difficultyReason,
      type: input.params?.type ?? adaptive.type,
      difficulty: input.params?.difficulty ?? adaptive.difficulty,
    };
  }

  return {
    type: input.params?.type ?? "phishing",
    difficulty: input.params?.difficulty ?? "medium",
    context: input.params?.context,
    selectionMode: input.params?.selectionMode ?? "manual",
    difficultyReason: input.params?.difficultyReason,
  };
}

export async function getScenario(input: GetScenarioInput): Promise<Scenario> {
  try {
    const params = resolveScenarioParams(input);
    const mode = input.mode ?? "demo";
    logService("scenario-service", "generateScenario_start", {
      type: params.type,
      difficulty: params.difficulty,
      mode,
      adaptive: Boolean(input.adaptive),
    });

    const scenario = await generateScenario(params, mode);
    logService("scenario-service", "scenario_generated", {
      type: scenario.type,
      difficulty: scenario.difficulty,
      mode,
      source: scenario.meta.source,
    });

    return scenario;
  } catch (error) {
    log("error", "service:scenario-service:generateScenario_error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new Error("Unable to generate scenario");
  }
}
