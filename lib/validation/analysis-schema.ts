import { z } from "zod";

export const analysisRequestSchema = z.object({
  url: z.string().min(1, "URL is required"),
});

export type AnalysisRequestInput = z.infer<typeof analysisRequestSchema>;
