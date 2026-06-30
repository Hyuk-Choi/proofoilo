import { mockKnowledgeBase } from "@/data/mockKnowledgeBase";
import type { AnalysisInput, AnalysisScores } from "@/types/analysis";
import { selectRelevantItems } from "./textVariation";

export type RecommendationBundle = {
  insights: string[];
  problems: string[];
  recommendations: string[];
  warnings: string[];
  examples: string[];
  strategies: string[];
};

export function buildRecommendationBundle({
  input,
  scores,
  signals,
  seed,
}: {
  input: AnalysisInput;
  scores: AnalysisScores;
  signals: string[];
  seed: string;
}): RecommendationBundle {
  const scoreSignals = [
    scores.messageClarity < 62 ? "message" : "",
    scores.targetFit < 62 ? "target" : "",
    scores.conversionPotential < 62 ? "conversion" : "",
    scores.budgetEfficiency < 62 ? "budget" : "",
    scores.marketFit < 62 ? "positioning" : "",
    scores.executionDifficulty < 62 ? "execution" : "",
  ].filter(Boolean);
  const combinedSignals = [
    ...signals,
    ...scoreSignals,
    input.goal ?? "",
    input.industry ?? "",
  ];

  return {
    insights: selectRelevantItems(
      mockKnowledgeBase.insights,
      combinedSignals,
      seed,
      3,
    ).map((item) => item.text),
    problems: selectRelevantItems(
      mockKnowledgeBase.painPoints,
      combinedSignals,
      seed,
      3,
    ).map((item) => item.text),
    recommendations: selectRelevantItems(
      mockKnowledgeBase.recommendations,
      combinedSignals,
      seed,
      5,
    ).map((item) => item.text),
    warnings: selectRelevantItems(
      mockKnowledgeBase.warnings,
      combinedSignals,
      seed,
      2,
    ).map((item) => item.text),
    examples: selectRelevantItems(
      mockKnowledgeBase.examples,
      combinedSignals,
      seed,
      3,
    ).map((item) => item.text),
    strategies: selectRelevantItems(
      mockKnowledgeBase.strategies,
      combinedSignals,
      seed,
      5,
    ).map((item) => item.text),
  };
}
