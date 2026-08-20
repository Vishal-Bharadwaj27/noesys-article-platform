import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { ArticleEvaluationSchema } from "../schemas/articleEvaluation.schema";

export async function evaluateArticle(
  prompt: string,
  title: string,
  content: string,
) {
  const { output } = await generateText({
    model: google("gemini-2.5-flash"),
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