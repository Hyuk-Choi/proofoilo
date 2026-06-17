import type { ProjectAnalysis } from "../../types/proofolio";

export type AnalyzeFileOptions = {
  projectName?: string;
};

export type GenerationOptions = {
  targetRole?: string;
  companyName?: string;
  userAnswers?: Record<string, string>;
  characterLimit?: number;
};

export type AnalysisProfile = Omit<
  ProjectAnalysis,
  "id" | "sourceFileName" | "projectTitle"
>;
