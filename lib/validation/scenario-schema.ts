import { z } from "zod";

export const scenarioTypeSchema = z.enum(["phishing", "smishing", "impersonation", "malware"]);
export const scenarioDifficultySchema = z.enum(["easy", "medium", "hard"]);
export const scenarioModeSchema = z.enum(["demo", "live"]);

export const scenarioRequestSchema = z.object({
  mode: scenarioModeSchema.optional(),
  adaptive: z.boolean().optional(),
  params: z
    .object({
      type: scenarioTypeSchema.optional(),
      difficulty: scenarioDifficultySchema.optional(),
      context: z.string().optional(),
      selectionMode: z.enum(["manual", "adaptive"]).optional(),
      difficultyReason: z.string().optional(),
    })
    .optional(),
});

export const scenarioResponseSchema = z.object({
  id: z.string(),
  type: scenarioTypeSchema,
  difficulty: scenarioDifficultySchema,
  interface: z.enum(["email", "sms", "chat", "website"]),
  title: z.string(),
  content: z.string(),
  options: z.array(z.string()).min(2),
  correct_action: z.string(),
  red_flags: z.array(z.string()),
  explanation: z.object({
    hacker: z.string(),
    user: z.string(),
    developer: z.string(),
  }),
  solution: z.object({
    immediate_action: z.string(),
    prevention_tips: z.array(z.string()).min(1),
    best_practices: z.array(z.string()).min(1),
  }),
  meta: z.object({
    source: z.enum(["cached", "ai"]),
    mode: z.enum(["manual", "adaptive"]),
    difficulty_reason: z.string().optional(),
  }),
});

export type ScenarioRequestInput = z.infer<typeof scenarioRequestSchema>;
