export interface ArticleTypeInput {
  name: string;
  description?: string;
  passThreshold: number;
  scorePrompt: string;
  scoreMin: number;
  scoreMax: number;
}


// insights
export interface NumericDistributionBucket {
  value: number;
  count: number;
}

export interface OptionBreakdown {
  label: string;
  count: number;
}

export interface ParameterSummary {
  parameterId: string;
  parameterName: string;
  scopeType: "numeric" | "option";
  options?: OptionBreakdown[];
  numeric?: {
    avg: number;
    min: number;
    max: number;
    count: number;
    distribution: NumericDistributionBucket[];
  };
}

export interface ArticleTypeSummary {
  articleTypeId: string;
  articleTypeName: string;
  totalArticles: number;
  parameters: ParameterSummary[];
}

// employee submissoins
export interface EmployeeSubmissionRow {
  userId: string;
  name: string;
  jobRole: string;
  monthly: Record<string, number>;
  total: number;
}

export interface EmployeeSubmissionsResult {
  months: string[];
  rows: EmployeeSubmissionRow[];
  monthlyTotals: Record<string, number>;
  grandTotal: number;
}
