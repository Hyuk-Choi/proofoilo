import type {
  ProjectAnalysis,
  ProofolioWorkspace,
} from "../../types/proofolio";

export type AnalyzeFileOptions = {
  projectName?: string;
  contentPreview?: string;
  contentSummary?: string;
};

export type GenerationOptions = {
  targetRole?: string;
  companyName?: string;
  userAnswers?: Record<string, string>;
  characterLimit?: number;
  workspace?: ProofolioWorkspace;
};

export type AnalysisProfile = Omit<
  ProjectAnalysis,
  "id" | "sourceFileName" | "projectTitle"
>;
