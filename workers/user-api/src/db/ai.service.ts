import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { ArticleEvaluationSchema } from "../schemas/articleEvaluation.schema";
import type { AIEvaluationResponse } from "../types/evaluation";

export async function evaluateArticle(
  apiKey: string,
  prompt: string,
): Promise<AIEvaluationResponse> {
  if (!apiKey) {
    throw new Error("Google Generative AI API key is missing.");
  }
  const google = createGoogleGenerativeAI({
    apiKey,
  });

  const response = await generateText({
    model: google("gemini-1.5-flash"),
    messages: [
      {
        role: "system",
        content: prompt,
      },
    ],
  });

  // Parse the response as JSON and validate against schema
  const parsed = JSON.parse(response.text);
  const validated = ArticleEvaluationSchema.parse(parsed);
  
  return validated as AIEvaluationResponse;
}