import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { ArticleEvaluationSchema } from "../schemas/articleEvaluation.schema";

export async function evaluateArticle(
  apiKey: string,
  userPrompt: string,
  title: string,
  content: string,
) {
  const google = createGoogleGenerativeAI({
    apiKey: apiKey,
  });
  const { object } = await generateObject({
    model: google("gemini-3.6-flash"),
    schema: ArticleEvaluationSchema,
    system: userPrompt,
    prompt: `Title: ${title}\n\nArticle: ${content}`,
  });

  return object;
}
