import { z } from "zod";

export const ArticleEvaluationSchema = z.object({
  score: z.number().min(0).max(10),
  feedback: z.string(),
});

export type ArticleEvaluation =
  typeof ArticleEvaluationSchema.type;