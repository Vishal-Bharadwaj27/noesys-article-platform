import { evaluateArticle as callAI } from "./ai.service";
import { buildEvaluationPrompt } from "../utils/promptBuilder";
import { 
  validateEvaluationResponse, 
  resolveParameterResults,
  ValidationError 
} from "../utils/evaluationValidator";
import { 
  persistEvaluationResults, 
  handleEvaluationFailure 
} from "./evaluationPersistence.service";
import { 
  getArticleTypeConfig, 
  getActiveParameters 
} from "./evaluation.service";
import type { EvaluationOutcome } from "../types/evaluation";

/**
 * Main evaluateArticle function
 * Orchestrates the complete evaluation flow according to the implementation guide
 */
export async function evaluateArticle(
  db: D1Database,
  env: any,
  articleId: string,
  articleTypeId: string,
  title: string,
  content: string,
  version: number
): Promise<void> {
  try {
    // Step 1: Load article type
    const articleType = await getArticleTypeConfig(db, articleTypeId);
    if (!articleType) {
      throw new Error(`Article type not found or inactive: ${articleTypeId}`);
    }

    // Step 2: Load active parameters for the article type
    const parameters = await getActiveParameters(db, articleTypeId);

    // Step 3: Build the AI prompt
    const prompt = buildEvaluationPrompt(articleType, parameters, title, content);

    // Step 4: Call the AI
    const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY || env.GOOGLE_API_KEY || "";
    if (!apiKey) {
      throw new Error(
        "GOOGLE_GENERATIVE_AI_API_KEY not set in worker secrets. Run: wrangler secret put GOOGLE_GENERATIVE_AI_API_KEY"
      );
    }

    const aiResponse = await callAI(apiKey, prompt);

    // Step 5: Validate the AI response
    try {
      validateEvaluationResponse(aiResponse, articleType, parameters);
    } catch (validationError) {
      if (validationError instanceof ValidationError) {
        throw new Error(`AI response validation failed: ${validationError.message}`);
      }
      throw validationError;
    }

    // Step 6: Compute status
    const status = aiResponse.overall_score >= articleType.pass_threshold
      ? "approved"
      : "rewrite_required";

    // Step 7: Resolve parameter results
    const parameterResults = resolveParameterResults(
      aiResponse.parameter_results,
      parameters
    );

    // Step 8: Build evaluation outcome
    const outcome: EvaluationOutcome = {
      ai_score: aiResponse.overall_score,
      ai_feedback: aiResponse.overall_feedback,
      status,
      parameter_results: parameterResults,
    };

    // Step 9: Persist results (transaction)
    await persistEvaluationResults(db, articleId, version, outcome);

  } catch (error) {
    // Handle any failure by updating article status
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Article evaluation failed:", errorMessage, error);
    
    await handleEvaluationFailure(db, articleId, `AI evaluation failed: ${errorMessage}`);
    throw error; // Re-throw to allow caller to handle if needed
  }
}