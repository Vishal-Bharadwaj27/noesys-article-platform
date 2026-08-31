// ai.service.ts
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import type { z } from "zod";

interface AIEvaluationResult {
  score: number;
  feedback: string;
  parameters: Record<string, string | number>;
}
// ai.service.ts
import { NoObjectGeneratedError } from "ai";

export async function evaluateArticle(
  apiKey: string,
  prompt: string,
  schema: z.ZodTypeAny
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
        "You are a article evaluator. Follow the scoring instructions exactly and only return values allowed by the schema. Keep in mind that the passing score is 10, and evaluate article's ai_score strictly between 0-10",
      prompt,
    });
    console.log(prompt);
    
    return object as AIEvaluationResult;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      console.error("RAW MODEL OUTPUT:", error.text);
      console.error("FINISH REASON:", error.finishReason);
      console.error("USAGE:", error.usage);
    }
    throw error;
  }
}