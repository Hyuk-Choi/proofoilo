import type {
  ProjectAnalysis,
  UploadedFile,
} from "../../types/proofolio";
import type { AnalyzeFileOptions } from "./contracts";
import { getAnalysisProfile } from "./mock-profiles";
import {
  cleanProjectTitle,
  createStableId,
  simulateAiDelay,
} from "./shared";

export function createMockAnalysis(
  file: UploadedFile,
  options: AnalyzeFileOptions = {},
): ProjectAnalysis {
  const projectTitle =
    options.projectName?.trim() || cleanProjectTitle(file.name);
  const profile = getAnalysisProfile(`${file.name} ${projectTitle}`);

  return {
    id: createStableId("analysis", `${file.id}-${projectTitle}`),
    sourceFileName: file.name,
    projectTitle,
    ...profile,
    competencyTags: [...profile.competencyTags],
    improvementPoints: [...profile.improvementPoints],
    missingQuestions: [...profile.missingQuestions],
  };
}

export async function analyzeFile(
  file: UploadedFile,
  options: AnalyzeFileOptions = {},
): Promise<ProjectAnalysis> {
  await simulateAiDelay();
  return createMockAnalysis(file, options);
}
