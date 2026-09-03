// ai.service.ts
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import type { z } from "zod";
import { AIEvaluationResult } from "../types";

export async function evaluateArticle(
  apiKey: string,
  prompt: string,
  schema: z.ZodType<AIEvaluationResult>
):Promise<AIEvaluationResult> {
  if (!apiKey) {
    throw new Error("Google Generative AI API key is missing.");
  }

  const google = createGoogleGenerativeAI({ apiKey });

  try {
    const { object } = await generateObject({
      model: google("gemini-3.5-flash-lite"),
      schema,
      system:
        "You are an article evaluator. Follow the scoring instructions exactly and only return values allowed by the schema. Evaluate article's ai_score strictly between 0-10",
      prompt,
    });
    
    return object as AIEvaluationResult;
  } catch (error) {
    throw error;
  }
}