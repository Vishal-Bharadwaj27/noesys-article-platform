import { createWorkersAI } from "workers-ai-provider";
import { generateObject } from "ai";
import { ArticleEvaluationSchema } from "../schemas/articleEvaluation.schema";

export async function evaluateArticle(
  ai: Ai,
  prompt: string,
  title: string,
  content: string,
) {
  const workersai = createWorkersAI({
    binding: ai,
  });

  const { object } = await generateObject({
    model: workersai("@cf/meta/llama-3.1-8b-instruct"),
    schema: ArticleEvaluationSchema,
    system: prompt,
    prompt: `
Title:
${title}

Article:
${content}
`,
  });

  return object;
}