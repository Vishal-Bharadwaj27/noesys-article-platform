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
  console.log(apiKey)

  const google = createGoogleGenerativeAI({
    apiKey,
  });

  const markdownFormattingInstructions = `
IMPORTANT: Format your feedback response using Markdown with the following structure:
- Use ### for main sections (e.g., ### Overall Score: X/10)
- Use **bold** for key terms and subsection headers
- Use - for bullet points in lists
- Use numbered lists (1. 2. 3.) for ordered items
- Use > for blockquotes if needed
- Ensure consistent spacing between sections

Example format:
### Overall Score: 8.5/10
### Strengths
- **Item 1:** Description
- **Item 2:** Description
### Weaknesses
- **Item 1:** Description
### Specific Improvement Suggestions
1. First suggestion
2. Second suggestion
### Justification
Your justification here.
`;

  const { output } = await generateText({
   model: google("gemini-3.6-flash"),
    system: `${prompt}\n\n${markdownFormattingInstructions}`,
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