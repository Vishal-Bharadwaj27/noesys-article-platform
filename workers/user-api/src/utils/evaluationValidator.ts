import type { 
  ArticleTypeConfig, 
  ParameterConfig 
} from "../db/evaluation.service";
import type { 
  AIEvaluationResponse, 
  EvaluationOutcome 
} from "../types/evaluation";

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Validate the AI evaluation response against the article type and parameters
 * Throws ValidationError if validation fails
 */
export function validateEvaluationResponse(
  response: AIEvaluationResponse,
  articleType: ArticleTypeConfig,
  parameters: ParameterConfig[]
): void {
  // 1. Validate overall score
  if (typeof response.overall_score !== "number") {
    throw new ValidationError("Overall score must be a number");
  }

  if (
    response.overall_score < articleType.score_min ||
    response.overall_score > articleType.score_max
  ) {
    throw new ValidationError(
      `Overall score must be between ${articleType.score_min} and ${articleType.score_max}, got ${response.overall_score}`
    );
  }

  // 2. Validate that every active parameter has a result
  const expectedParameterIds = new Set(parameters.map((p) => p.id));
  const receivedParameterIds = new Set(
    response.parameter_results.map((r) => r.parameter_id)
  );

  // Check for missing parameters
  for (const paramId of expectedParameterIds) {
    if (!receivedParameterIds.has(paramId)) {
      throw new ValidationError(
        `Missing result for parameter: ${paramId}`
      );
    }
  }

  // Check for extra/unknown parameters
  for (const paramId of receivedParameterIds) {
    if (!expectedParameterIds.has(paramId)) {
      throw new ValidationError(
        `Unknown parameter_id in response: ${paramId}`
      );
    }
  }

  // 3. Validate each parameter result
  for (const result of response.parameter_results) {
    const parameter = parameters.find((p) => p.id === result.parameter_id);
    if (!parameter) {
      throw new ValidationError(
        `Parameter not found: ${result.parameter_id}`
      );
    }

    // Validate type matches scope_type
    if (result.type !== parameter.scope_type) {
      throw new ValidationError(
        `Parameter ${result.parameter_id}: type mismatch, expected ${parameter.scope_type}, got ${result.type}`
      );
    }

    // Validate based on scope_type
    if (parameter.scope_type === "numeric") {
      validateNumericParameter(result, parameter);
    } else if (parameter.scope_type === "option") {
      validateOptionParameter(result, parameter);
    }
  }
}

/**
 * Validate a numeric parameter result
 */
function validateNumericParameter(
  result: { value: number | string; parameter_id: string },
  parameter: ParameterConfig
): void {
  if (typeof result.value !== "number") {
    throw new ValidationError(
      `Parameter ${result.parameter_id}: numeric value must be a number, got ${typeof result.value}`
    );
  }

  if (parameter.min_value !== null && result.value < parameter.min_value) {
    throw new ValidationError(
      `Parameter ${result.parameter_id}: value ${result.value} is below minimum ${parameter.min_value}`
    );
  }

  if (parameter.max_value !== null && result.value > parameter.max_value) {
    throw new ValidationError(
      `Parameter ${result.parameter_id}: value ${result.value} is above maximum ${parameter.max_value}`
    );
  }
}

/**
 * Validate an option parameter result
 */
function validateOptionParameter(
  result: { value: number | string; parameter_id: string },
  parameter: ParameterConfig
): void {
  if (typeof result.value !== "string") {
    throw new ValidationError(
      `Parameter ${result.parameter_id}: option value must be a string, got ${typeof result.value}`
    );
  }

  // Check if the value matches an active option label (case-sensitive)
  const validOptionLabels = new Set(
    parameter.options.map((opt) => opt.label)
  );

  if (!validOptionLabels.has(result.value)) {
    throw new ValidationError(
      `Parameter ${result.parameter_id}: value "${result.value}" is not a valid option. Valid options: ${Array.from(validOptionLabels).join(", ")}`
    );
  }
}

/**
 * Resolve parameter results to database format
 * Converts AI response to the format needed for article_parameter_results table
 */
export function resolveParameterResults(
  parameterResults: AIEvaluationResponse["parameter_results"],
  parameters: ParameterConfig[]
): EvaluationOutcome["parameter_results"] {
  return parameterResults.map((result) => {
    const parameter = parameters.find((p) => p.id === result.parameter_id);
    if (!parameter) {
      throw new Error(`Parameter not found: ${result.parameter_id}`);
    }

    if (parameter.scope_type === "numeric") {
      return {
        parameter_id: result.parameter_id,
        numeric_value: result.value as number,
        option_id: null,
        value: String(result.value),
      };
    } else if (parameter.scope_type === "option") {
      // Find the option_id for the selected label
      const option = parameter.options.find(
        (opt) => opt.label === result.value
      );
      if (!option) {
        throw new Error(
          `Option not found for label "${result.value}" in parameter ${result.parameter_id}`
        );
      }

      return {
        parameter_id: result.parameter_id,
        numeric_value: null,
        option_id: option.id,
        value: result.value as string,
      };
    }

    throw new Error(
      `Unknown scope_type for parameter ${result.parameter_id}: ${parameter.scope_type}`
    );
  });
}
