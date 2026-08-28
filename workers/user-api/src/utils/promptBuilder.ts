import type { ArticleTypeConfig, ParameterConfig } from "../db/evaluation.service";

/**
 * Build the AI evaluation prompt based on article type and parameters
 */
export function buildEvaluationPrompt(
  articleType: ArticleTypeConfig,
  parameters: ParameterConfig[],
  title: string,
  content: string
): string {
  let prompt = `You are an expert article evaluator. Your task is to evaluate the given article based on specific criteria.

`;
  
  // Overall scoring section
  prompt += `## Overall Score Evaluation\n\n`;
  prompt += `${articleType.score_prompt}\n\n`;
  prompt += `Score Range: ${articleType.score_min} to ${articleType.score_max}\n\n`;
  
  // Per-parameter sections
  if (parameters.length > 0) {
    prompt += `## Parameter Evaluation\n\n`;
    prompt += `For each of the following criteria, evaluate the article and provide a score according to the specified format:\n\n`;
    
    for (const param of parameters) {
      prompt += `### ${param.name}\n\n`;
      prompt += `${param.prompt}\n\n`;
      
      if (param.scope_type === "numeric") {
        prompt += `Provide a numeric score between ${param.min_value} and ${param.max_value}.\n\n`;
      } else if (param.scope_type === "option") {
        const optionLabels = param.options.map((opt) => opt.label).join(", ");
        prompt += `Select exactly one of the following options: ${optionLabels}\n\n`;
      }
    }
  }
  
  // Response format instructions
  prompt += `## Response Format\n\n`;
  prompt += `You must respond with valid JSON in the following format:\n\n`;
  prompt += `{\n`;
  prompt += `  "overall_score": <number between ${articleType.score_min} and ${articleType.score_max}>,\n`;
  prompt += `  "overall_feedback": "<detailed feedback about the overall evaluation>",\n`;
  prompt += `  "parameter_results": [\n`;
  
  if (parameters.length > 0) {
    for (const param of parameters) {
      prompt += `    {\n`;
      prompt += `      "parameter_id": "${param.id}",\n`;
      prompt += `      "type": "${param.scope_type}",\n`;
      
      if (param.scope_type === "numeric") {
        prompt += `      "value": <number between ${param.min_value} and ${param.max_value}>\n`;
      } else {
        const optionLabels = param.options.map((opt) => `"${opt.label}"`).join(", ");
        prompt += `      "value": <one of: ${optionLabels}>\n`;
      }
      
      prompt += `    },\n`;
    }
  }
  
  prompt += `  ]\n`;
  prompt += `}\n\n`;
  
  // Markdown formatting instructions
  prompt += `## Feedback Formatting\n\n`;
  prompt += `Format your feedback response using Markdown with the following structure:\n`;
  prompt += `- Use ### for main sections (e.g., ### Overall Score: X/10)\n`;
  prompt += `- Use **bold** for key terms and subsection headers\n`;
  prompt += `- Use - for bullet points in lists\n`;
  prompt += `- Use numbered lists (1. 2. 3.) for ordered items\n`;
  prompt += `- Use > for blockquotes if needed\n`;
  prompt += `- Ensure consistent spacing between sections\n\n`;
  
  prompt += `Example format:\n`;
  prompt += `### Overall Score: 8.5/10\n`;
  prompt += `### Strengths\n`;
  prompt += `- **Item 1:** Description\n`;
  prompt += `- **Item 2:** Description\n`;
  prompt += `### Weaknesses\n`;
  prompt += `- **Item 1:** Description\n`;
  prompt += `### Specific Improvement Suggestions\n`;
  prompt += `1. First suggestion\n`;
  prompt += `2. Second suggestion\n`;
  prompt += `### Justification\n`;
  prompt += `Your justification here.\n\n`;
  
  // Article content
  prompt += `## Article to Evaluate\n\n`;
  prompt += `Title:\n${title}\n\n`;
  prompt += `Content:\n${content}\n`;
  
  return prompt;
}
