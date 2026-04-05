import { getCachedScenario } from "./scenario-generator";
import { generateScenarioWithLLM } from "./llm-client";
import { canMakeAIRequest, getCooldownTime } from "./rate-limiter";
import type { Scenario, ScenarioParams } from "./scenario-types";
import { getCache, setCache } from "../server/cache";
import { log } from "../server/logger";

type ScenarioMode = "demo" | "live";

const DEFAULT_PARAMS: ScenarioParams = {
  type: "phishing",
  difficulty: "easy",
};

function getAiCacheKey(params: ScenarioParams): string {
  return `scenario-ai-${params.type}-${params.difficulty}`;
}

function withMeta(
  scenario: Scenario,
  params: ScenarioParams,
  source: Scenario["meta"]["source"]
): Scenario {
  const mode: Scenario["meta"]["mode"] = params.selectionMode ?? "manual";

  return {
    ...scenario,
    meta: {
      source,
      mode,
      ...(mode === "adaptive" && params.difficultyReason
        ? { difficulty_reason: params.difficultyReason }
        : {}),
    },
  };
}

function resolveScenario(params: ScenarioParams): Scenario {
  const primary = getCachedScenario(params);
  if (primary) {
    return primary;
  }

  const fallback = getCachedScenario(DEFAULT_PARAMS);
  if (fallback) {
    return fallback;
  }

  throw new Error("No scenarios are available in cache.");
}

export async function generateScenario(
  params: ScenarioParams,
  mode: ScenarioMode = "demo"
): Promise<Scenario> {
  if (mode === "demo") {
    return withMeta(resolveScenario(params), params, "cached");
  }

  if (typeof window !== "undefined") {
    log("warn", "scenario_engine_server_only_live_mode", {
      type: params.type,
      difficulty: params.difficulty,
    });
    return withMeta(resolveScenario(params), params, "cached");
  }

  if (!process.env.OPENAI_API_KEY) {
    log("warn", "scenario_engine_missing_api_key_fallback", {
      type: params.type,
      difficulty: params.difficulty,
    });
    return withMeta(resolveScenario(params), params, "cached");
  }

  const cacheKey = getAiCacheKey(params);
  const cachedAiScenario = getCache<Scenario>(cacheKey);
  if (cachedAiScenario) {
    return withMeta(cachedAiScenario, params, "ai");
  }

  if (!canMakeAIRequest()) {
    const cooldown = getCooldownTime();
    log("warn", "scenario_engine_rate_limit_fallback", {
      type: params.type,
      difficulty: params.difficulty,
      cooldown,
    });
    return withMeta(resolveScenario(params), params, "cached");
  }

  try {
    const generated = await generateScenarioWithLLM(params);
    setCache(cacheKey, generated);
    return withMeta(generated, params, "ai");
  } catch {
    return withMeta(resolveScenario(params), params, "cached");
  }
}

export type { Scenario, ScenarioParams } from "./scenario-types";
