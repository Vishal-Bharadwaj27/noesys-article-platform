export interface ParameterResultInput {
  parameter_id: string;
  value: string;
  option_id: string | null;
  numeric_value: number | null;
}

export interface EvaluationOutcome {
  ai_score: number;
  ai_feedback: string;
  status: "approved" | "rewrite_required";
  parameter_results: ParameterResultInput[];
}