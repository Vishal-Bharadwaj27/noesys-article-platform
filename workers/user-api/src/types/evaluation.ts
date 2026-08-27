// Types for the evaluation system

export interface AIParameterResult {
  parameter_id: string;
  type: "numeric" | "option";
  value: number | string;
}

export interface AIEvaluationResponse {
  overall_score: number;
  overall_feedback: string;
  parameter_results: AIParameterResult[];
}

export interface EvaluationOutcome {
  ai_score: number;
  ai_feedback: string;
  status: "approved" | "rewrite_required";
  parameter_results: {
    parameter_id: string;
    numeric_value: number | null;
    option_id: string | null;
    value: string; // display value
  }[];
}

export interface ArticleParameterResult {
  id: string;
  article_id: string;
  parameter_id: string;
  value: string;
  option_id: string | null;
  numeric_value: number | null;
  version: number;
  scored_at: string;
}
