import type {
  PortfolioOutput,
  ProjectAnalysis,
} from "../../types/proofolio";
import type { GenerationOptions } from "./contracts";
import { runOpenAiMock } from "./openai-mock-provider";
import {
  compactSentence,
  createStableId,
  hasQuantitativeEvidence,
  joinKoreanList,
  sentenceFragment,
} from "./shared";

export function buildPortfolioOutput(
  analysis: ProjectAnalysis,
  options: GenerationOptions = {},
): PortfolioOutput {
  const targetRole = options.targetRole?.trim() || "마케팅 직무";
  const skills = [...analysis.competencyTags];
  const portfolioTitle = `${analysis.projectTitle} | ${analysis.projectType}`;
  const answeredEvidence = Object.values(options.userAnswers ?? {}).filter(
    (answer) => answer.trim().length > 0,
  );
  const evidenceHasMetrics = hasQuantitativeEvidence(
    [analysis.result, ...answeredEvidence].join(" "),
  );
  const evidenceStatus = answeredEvidence.length
    ? evidenceHasMetrics
      ? "일부 정량 근거 확인 · 출처와 비교 기준 최종 점검 필요"
      : "정성 근거 확인 · 성과 수치와 비교 기준 추가 필요"
    : "분석 리포트 기반 가설 · 실행 성과 검증 전";
  const summary = compactSentence(
    `${analysis.oneLineSummary} ${targetRole} 관점에서 ${joinKoreanList(
      skills.slice(0, 3),
    )} 역량이 문제 정의, 판단 기준, 전략 선택과 실행안으로 어떻게 연결되는지 정리했습니다.`,
  );
  const keyInsightSummary = sentenceFragment(analysis.keyInsight);
  const keyMessage = compactSentence(
    `${analysis.projectTitle}에서 시장과 고객 자료를 동일한 기준으로 비교해 핵심 과제를 정의하고, "${keyInsightSummary}"라는 판단을 실행 우선순위로 전환한 ${targetRole} 프로젝트입니다.`,
  );
  const evidenceCopy = answeredEvidence.length
    ? `\n\n## 검증된 보완 근거\n${answeredEvidence
        .map((answer) => `- ${compactSentence(answer)}`)
        .join("\n")}`
    : "\n\n## 근거 상태\n- 현재 결과는 분석 리포트 기반 제안입니다. 실행 성과로 표현하기 전에 수치, 비교 기준과 출처를 추가해야 합니다.";
  const validationCopy = `\n\n## 검증 상태와 후속 과제\n- ${evidenceStatus}\n${analysis.missingQuestions
    .map((question) => `- ${question}`)
    .join("\n")}`;
  const sourceReviewCopy = analysis.sourceReview
    ? `\n\n## Source Review\n- 검토 범위: ${analysis.sourceReview.reviewScope}\n- 근거 품질: ${analysis.sourceReview.evidenceQuality}\n${analysis.sourceReview.consultantNotes.map((note) => `- ${note}`).join("\n")}`
    : "";
  const expertReviewCopy = analysis.expertReview
    ? `\n\n## Expert Deep Dive\n### Executive Diagnosis\n${analysis.expertReview.executiveDiagnosis}\n\n### Hiring Relevance\n${analysis.expertReview.hiringRelevance}\n\n### Evidence Review\n${analysis.expertReview.evidenceReviews
        .map(
          (review) =>
            `- ${review.label}: ${review.finding} 권고: ${review.recommendation}`,
        )
        .join("\n")}\n\n### Portfolio Angles\n${analysis.expertReview.portfolioAngles.map((angle) => `- ${angle}`).join("\n")}`
    : "";

  const pptCopy = [
    `01. Executive Summary | ${keyMessage}`,
    `02. Business Context | ${analysis.background}`,
    `03. Core Issue | ${analysis.problemDefinition}`,
    `04. Target & Decision Criteria | ${analysis.targetAudience}`,
    `05. Key Insight | ${analysis.keyInsight}`,
    `06. Strategic Recommendation | ${analysis.strategy}`,
    `07. Execution Plan | ${analysis.execution}`,
    `08. Outcome / Expected Impact | ${analysis.result}`,
    `09. My Contribution | ${analysis.userRole}`,
    `10. Evidence Status | ${evidenceStatus}`,
    analysis.sourceReview
      ? `11. Source Review | ${analysis.sourceReview.recommendedPortfolioUse}`
      : "",
  ].filter(Boolean).join("\n\n");

  const notionCopy = `# ${portfolioTitle}

## Executive Summary
${summary}

## Business Context
${analysis.background}

## Core Issue
${analysis.problemDefinition}

## Target & Decision Criteria
${analysis.targetAudience}

## Key Insight
${analysis.keyInsight}

## Strategic Recommendation
${analysis.strategy}

## Execution Plan
${analysis.execution}

## Outcome / Expected Impact
${analysis.result}

## My Contribution
${analysis.userRole}

## Demonstrated Competencies
${skills.map((skill) => `- ${skill}`).join("\n")}

## Core Portfolio Message
${keyMessage}${evidenceCopy}${validationCopy}${sourceReviewCopy}${expertReviewCopy}`;

  const onePageSummary = `EXECUTIVE SUMMARY
${keyMessage}

BUSINESS CONTEXT
${analysis.background}

CORE ISSUE
${analysis.problemDefinition}

KEY INSIGHT
${analysis.keyInsight}

RECOMMENDATION
${analysis.strategy}

EXECUTION
${analysis.execution}

OUTCOME / EXPECTED IMPACT
${analysis.result}

MY CONTRIBUTION
${analysis.userRole}

DEMONSTRATED COMPETENCIES
${joinKoreanList(skills)}

EVIDENCE STATUS
${evidenceStatus}`;

  const caseStudy = `# ${portfolioTitle}

## 1. Executive Summary
${summary}

## 2. Business Context
${analysis.background}

## 3. Core Issue
${analysis.problemDefinition}

## 4. Target & Decision Criteria
타깃: ${analysis.targetAudience}

## 5. Key Insight
${analysis.keyInsight}

## 6. Strategic Recommendation
${analysis.strategy}

## 7. Execution Plan
${analysis.execution}

## 8. Outcome / Expected Impact
${analysis.result}

## 9. My Contribution
${analysis.userRole}

## 10. Demonstrated Competencies
${skills.map((skill) => `- ${skill}`).join("\n")}

## 11. Consultant Review
${analysis.expertComment}

## 12. Core Portfolio Message
${keyMessage}${evidenceCopy}${validationCopy}${sourceReviewCopy}${expertReviewCopy}`;

  return {
    id: createStableId("portfolio", analysis.id),
    projectTitle: analysis.projectTitle,
    portfolioTitle,
    summary,
    problem: analysis.problemDefinition,
    insight: analysis.keyInsight,
    strategy: analysis.strategy,
    execution: analysis.execution,
    result: analysis.result,
    role: analysis.userRole,
    skills,
    pptCopy,
    notionCopy,
    onePageSummary,
    caseStudy,
    keyMessage,
  };
}

export async function generatePortfolio(
  analysis: ProjectAnalysis,
  options: GenerationOptions = {},
): Promise<PortfolioOutput> {
  return runOpenAiMock({
    task: "portfolio-generation",
    inputSummary: `${analysis.projectTitle} ${analysis.projectType}`,
    resolver: () => buildPortfolioOutput(analysis, options),
  });
}
