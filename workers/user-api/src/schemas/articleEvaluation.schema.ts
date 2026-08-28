import { z } from "zod";

export const ArticleEvaluationSchema = z.object({
  overall_score: z.number(),
  overall_feedback: z.string(),
  parameter_results: z.array(
    z.object({
      parameter_id: z.string(),
      type: z.enum(["numeric", "option"]),
      value: z.union([z.number(), z.string()]),
    })
  ),
});

export type ArticleEvaluation = typeof ArticleEvaluationSchema.type;