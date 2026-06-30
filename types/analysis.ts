export type ConfidenceLevel = "높음" | "보통" | "낮음";
export type PriorityLevel = "높음" | "중간" | "낮음";

export type BudgetLevel = "낮음" | "중간" | "높음" | "미정";

export type AnalysisInput = {
  industry?: string;
  goal?: string;
  budget?: BudgetLevel | string;
  target?: string;
  targetAge?: string;
  channel?: string;
  channels?: string[];
  message?: string;
  product?: string;
  projectType?: string;
  evidenceText?: string;
  role?: string;
  seed?: string;
  variant?: number;
};

export type AnalysisScores = {
  marketFit: number;
  targetFit: number;
  messageClarity: number;
  conversionPotential: number;
  budgetEfficiency: number;
  executionDifficulty: number;
};

export type PriorityAction = {
  priority: PriorityLevel;
  action: string;
  reason: string;
};

export type BenchmarkRange = {
  label: string;
  ctr: string;
  cpc: string;
  conversionRate: string;
  note: string;
};

export type AnalysisResult = {
  headlineDiagnosis: string;
  summary: string;
  totalScore: number;
  confidenceLevel: ConfidenceLevel;
  scores: AnalysisScores;
  keyInsights: string[];
  problems: string[];
  recommendations: string[];
  priorityActions: PriorityAction[];
  generatedCopy: string[];
  nextTestIdeas: string[];
  caution: string;
  reasoningSummary: string;
  inputCompleteness: number;
  missingInputs: string[];
  benchmarkRange: BenchmarkRange;
  strategyTable: Array<{
    area: string;
    recommendation: string;
    expectedEffect: string;
  }>;
};
