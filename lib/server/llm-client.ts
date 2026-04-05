import type { Scenario, ScenarioParams } from "../ai/scenario-types";
import { getCache, setCache } from "./cache";
import { logAI } from "./logger";

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 5000;

function getCacheKey(params: ScenarioParams): string {
  return `llm-scenario-${params.type}-${params.difficulty}-${params.context ?? ""}`;
}

export function generateBasicSolution(type: string): Scenario["solution"] {
  const byType: Record<Scenario["type"], Scenario["solution"]> = {
    phishing: {
      immediate_action:
        "Do not click links or open attachments. Report the message to your security team and verify the request through an official channel.",
      prevention_tips: [
        "Verify sender domains before acting on urgent requests.",
        "Use bookmarked official portals rather than email links.",
        "Report suspicious messages so they can be blocked for others.",
      ],
      best_practices: [
        "Enable phishing-resistant MFA where possible.",
        "Run recurring phishing awareness drills.",
        "Use email filtering with domain and link reputation checks.",
      ],
    },
    smishing: {
      immediate_action:
        "Do not tap the link or reply. Block the sender and verify the claim directly with the institution using a trusted phone number or app.",
      prevention_tips: [
        "Treat urgent SMS alerts as suspicious until verified.",
        "Use official mobile apps for account and delivery checks.",
        "Never share OTPs, PINs, or credentials via text.",
      ],
      best_practices: [
        "Enable account alerts from official channels only.",
        "Use mobile threat protection and link scanning.",
        "Practice out-of-band verification for financial requests.",
      ],
    },
    impersonation: {
      immediate_action:
        "Pause the request, verify identity through a known contact path, and report the impersonation attempt to security immediately.",
      prevention_tips: [
        "Do not share secrets, tokens, or payment details over chat/email on request.",
        "Follow approval workflows even for executive requests.",
        "Use call-back verification for high-risk actions.",
      ],
      best_practices: [
        "Adopt role verification and anti-impersonation controls.",
        "Require dual approval for sensitive operations.",
        "Use least-privilege and short-lived credentials.",
      ],
    },
    malware: {
      immediate_action:
        "Stop interaction with the file/site immediately, disconnect if needed, and notify security for endpoint triage.",
      prevention_tips: [
        "Only install updates from trusted vendor channels.",
        "Do not run unknown executables or enable macros.",
        "Submit suspicious files to a sandbox before opening.",
      ],
      best_practices: [
        "Keep OS/browser/EDR tools fully patched.",
        "Enforce application allowlisting for executables.",
        "Back up critical data and test recovery procedures.",
      ],
    },
  };

  const normalized = (type as Scenario["type"]) in byType ? (type as Scenario["type"]) : "phishing";
  const solution = byType[normalized];

  return {
    immediate_action: solution.immediate_action,
    prevention_tips: [...solution.prevention_tips],
    best_practices: [...solution.best_practices],
  };
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

function buildPrompt(params: ScenarioParams): string {
  const contextLine = params.context
    ? `Additional context: ${params.context}`
    : "Additional context: none";

  return [
    "Generate one realistic cybersecurity attack simulation scenario for awareness training.",
    `Attack type must be exactly: ${params.type}`,
    `Difficulty must be exactly: ${params.difficulty}`,
    contextLine,
    "Include subtle, realistic social engineering indicators.",
    "Include 3 to 4 plausible user action options.",
    "One and only one option must match correct_action exactly.",
    "Return JSON only, with no markdown and no surrounding text.",
    "Use this exact schema:",
    "{",
    '  "id": string,',
    '  "type": string,',
    '  "difficulty": string,',
    '  "interface": string,',
    '  "title": string,',
    '  "content": string,',
    '  "options": string[],',
    '  "correct_action": string,',
    '  "red_flags": string[],',
    '  "explanation": {',
    '    "hacker": string,',
    '    "user": string,',
    '    "developer": string',
    "  },",
    '  "solution": {',
    '    "immediate_action": string,',
    '    "prevention_tips": string[],',
    '    "best_practices": string[]',
    "  }",
    "}",
    "Also include a 'solution' field with immediate_action, prevention_tips, and best_practices.",
  ].join("\n");
}

function extractJsonBlock(text: string): string {
  const trimmed = text.trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found in LLM response.");
  }

  return trimmed.slice(firstBrace, lastBrace + 1);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function validateScenarioPayload(raw: unknown, params: ScenarioParams): Scenario {
  if (!raw || typeof raw !== "object") {
    throw new Error("LLM response is not an object.");
  }

  const candidate = raw as Partial<Scenario>;

  if (!isNonEmptyString(candidate.id)) throw new Error("Invalid scenario id.");
  if (!isNonEmptyString(candidate.type)) throw new Error("Invalid scenario type.");
  if (!isNonEmptyString(candidate.difficulty)) throw new Error("Invalid scenario difficulty.");
  if (!isNonEmptyString(candidate.interface)) throw new Error("Invalid scenario interface.");
  if (!isNonEmptyString(candidate.title)) throw new Error("Invalid scenario title.");
  if (!isNonEmptyString(candidate.content)) throw new Error("Invalid scenario content.");
  if (!isStringArray(candidate.options) || candidate.options.length < 2) throw new Error("Invalid scenario options.");
  if (!isNonEmptyString(candidate.correct_action)) throw new Error("Invalid correct_action.");
  if (!candidate.options.includes(candidate.correct_action)) throw new Error("correct_action must be one of options.");
  if (!isStringArray(candidate.red_flags) || candidate.red_flags.length < 1) throw new Error("Invalid red_flags.");

  const explanation = candidate.explanation;
  if (!explanation || typeof explanation !== "object") {
    throw new Error("Invalid explanation object.");
  }

  const explanationObj = explanation as Scenario["explanation"];
  if (!isNonEmptyString(explanationObj.hacker)) throw new Error("Invalid hacker explanation.");
  if (!isNonEmptyString(explanationObj.user)) throw new Error("Invalid user explanation.");
  if (!isNonEmptyString(explanationObj.developer)) throw new Error("Invalid developer explanation.");

  const normalizedType = candidate.type as Scenario["type"];
  const normalizedDifficulty = candidate.difficulty as Scenario["difficulty"];
  const normalizedInterface = candidate.interface as Scenario["interface"];

  const allowedTypes: Scenario["type"][] = ["phishing", "smishing", "impersonation", "malware"];
  const allowedDifficulty: Scenario["difficulty"][] = ["easy", "medium", "hard"];
  const allowedInterfaces: Scenario["interface"][] = ["email", "sms", "chat", "website"];

  if (!allowedTypes.includes(normalizedType)) throw new Error("Scenario type is outside allowed values.");
  if (!allowedDifficulty.includes(normalizedDifficulty)) throw new Error("Scenario difficulty is outside allowed values.");
  if (!allowedInterfaces.includes(normalizedInterface)) throw new Error("Scenario interface is outside allowed values.");
  if (normalizedType !== params.type) throw new Error("Scenario type does not match request params.");
  if (normalizedDifficulty !== params.difficulty) throw new Error("Scenario difficulty does not match request params.");

  const solutionCandidate = candidate.solution as Partial<Scenario["solution"]> | undefined;
  const hasValidSolution =
    !!solutionCandidate &&
    isNonEmptyString(solutionCandidate.immediate_action) &&
    isStringArray(solutionCandidate.prevention_tips) &&
    solutionCandidate.prevention_tips.length > 0 &&
    isStringArray(solutionCandidate.best_practices) &&
    solutionCandidate.best_practices.length > 0;

  const normalizedSolution = hasValidSolution
    ? {
        immediate_action: solutionCandidate.immediate_action!,
        prevention_tips: solutionCandidate.prevention_tips!,
        best_practices: solutionCandidate.best_practices!,
      }
    : generateBasicSolution(normalizedType);

  return {
    id: candidate.id,
    type: normalizedType,
    difficulty: normalizedDifficulty,
    interface: normalizedInterface,
    title: candidate.title,
    content: candidate.content,
    options: candidate.options,
    correct_action: candidate.correct_action,
    red_flags: candidate.red_flags,
    explanation: {
      hacker: explanationObj.hacker,
      user: explanationObj.user,
      developer: explanationObj.developer,
    },
    solution: normalizedSolution,
    meta: {
      source: "ai",
      mode: "manual",
    },
  };
}

export async function generateScenarioWithLLM(params: ScenarioParams): Promise<Scenario> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  const cacheKey = getCacheKey(params);
  const cached = getCache<Scenario>(cacheKey);
  if (cached) {
    logAI("cache_hit", {
      type: params.type,
      difficulty: params.difficulty,
      cached: true,
    });
    return cached;
  }

  logAI("request_start", {
    type: params.type,
    difficulty: params.difficulty,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    logAI("timeout", {
      type: params.type,
      difficulty: params.difficulty,
      timeoutMs: REQUEST_TIMEOUT_MS,
    });
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.8,
        messages: [
          {
            role: "system",
            content:
              "You generate cybersecurity awareness scenarios. Return strict JSON only and follow schema exactly.",
          },
          {
            role: "user",
            content: buildPrompt(params),
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as ChatCompletionResponse;
    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("OpenAI response did not include content.");
    }

    let parsed: unknown;
    try {
      const json = extractJsonBlock(content);
      parsed = JSON.parse(json);
    } catch {
      throw new Error("Failed to parse scenario JSON from LLM response.");
    }

    const scenario = validateScenarioPayload(parsed, params);
    setCache(cacheKey, scenario);
    logAI("success", {
      type: params.type,
      difficulty: params.difficulty,
      cached: false,
    });
    return scenario;
  } catch (error) {
    logAI("error", {
      type: params.type,
      difficulty: params.difficulty,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
