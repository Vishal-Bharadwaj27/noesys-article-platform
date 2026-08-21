import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { ArticleEvaluationSchema } from "../schemas/articleEvaluation.schema";

export async function evaluateArticle(
  apiKey: string,
  prompt: string,
  title: string,
  content: string,
) {
  if (!apiKey) {
    throw new Error("Google Generative AI API key is missing.");
  }

  const google = createGoogleGenerativeAI({
    apiKey,
  });

  const { output } = await generateText({
   model: google("gemini-3.6-flash"),
    system: prompt,
    prompt: `
Title:

${title}

Article:

${content}
`,
    output: Output.object({
      schema: ArticleEvaluationSchema,
    }),
  });

  return output;
}