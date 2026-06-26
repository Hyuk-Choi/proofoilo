import type {
  PortfolioOutput,
  ProjectAnalysis,
} from "../../types/proofolio";
import type { GenerationOptions } from "./contracts";
import { getAccuracyReportForAnalysis } from "../analysis/accuracy-review";
import { getDetailedReviewForAnalysis } from "../analysis/detailed-review";
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
  const detailedReview = getDetailedReviewForAnalysis(analysis);
  const accuracyReport = getAccuracyReportForAnalysis(analysis);
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
  const recruiterTakeaway = compactSentence(
    `채용 담당자는 이 프로젝트에서 ${targetRole}에 필요한 ${joinKoreanList(
      skills.slice(0, 3),
    )} 역량, 본인의 판단 기준, 실행으로 옮긴 산출물, 그리고 결과를 검증하려는 태도를 확인할 수 있습니다.`,
  );
  const portfolioFitCopy = `\n\n## Portfolio Fit for ${targetRole}
- 채용 담당자 관점 핵심 메시지: ${keyMessage}
- 평가받을 역량: ${joinKoreanList(skills.slice(0, 5))}
- 읽히는 순서: 문제 정의 → 핵심 인사이트 → 전략 선택 기준 → 실행 산출물 → 본인 역할 → 결과/검증 상태
- 면접 방어 포인트: 성과가 확정되지 않은 항목은 기대효과와 후속 검증 계획으로 분리해 설명합니다.`;
  const evidenceMatrixCopy = `\n\n## Evidence Matrix
${accuracyReport.claimChecks
  .map(
    (check) =>
      `- ${check.label}: ${check.evidenceLevel} · 정확도 ${check.confidence} / 근거: ${check.evidenceSource} / 보완: ${check.verificationAction}`,
  )
  .join("\n")}`;
  const slideBlueprintCopy = `\n\n## Slide Blueprint
1. Cover: ${analysis.projectTitle}와 ${targetRole} 연결 메시지
2. Why Now: ${sentenceFragment(analysis.background)}
3. Problem: ${sentenceFragment(analysis.problemDefinition)}
4. Audience: ${sentenceFragment(analysis.targetAudience)}
5. Insight: ${sentenceFragment(analysis.keyInsight)}
6. Strategy: ${sentenceFragment(analysis.strategy)}
7. Execution: ${sentenceFragment(analysis.execution)}
8. My Contribution: ${sentenceFragment(analysis.userRole)}
9. Result / Validation: ${sentenceFragment(analysis.result)}
10. Evidence Status: ${evidenceStatus}
11. Interview Defense: 검증되지 않은 항목의 한계와 후속 확인 계획`;
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
  const detailedReviewCopy = `\n\n## Item-by-Item Consultant Review\n${detailedReview.coverageSummary}\n\n${detailedReview.itemReviews
        .map(
          (item) =>
            `${item.order}. [${item.analysisFocus}] ${item.sourceLabel}\n- 원문/근거: ${item.sourceExcerpt}\n- 진단: ${item.consultantDiagnosis}\n- 포트폴리오 활용: ${item.portfolioImplication}\n- 추가 확인: ${item.requiredFollowUp}`,
        )
        .join("\n\n")}\n\n### Missing Evidence\n${detailedReview.missingEvidence
        .map(
          (gap) =>
            `- ${gap.area}: ${gap.issue} 필요 근거: ${gap.requiredEvidence}`,
        )
        .join("\n")}`;

  const pptCopy = [
    `01. Executive Summary | ${keyMessage}`,
    `02. Recruiter Takeaway | ${recruiterTakeaway}`,
    `03. Business Context | ${analysis.background}`,
    `04. Core Issue | ${analysis.problemDefinition}`,
    `05. Target & Decision Criteria | ${analysis.targetAudience}`,
    `06. Key Insight | ${analysis.keyInsight}`,
    `07. Strategic Recommendation | ${analysis.strategy}`,
    `08. Execution Plan | ${analysis.execution}`,
    `09. My Contribution | ${analysis.userRole}`,
    `10. Outcome / Expected Impact | ${analysis.result}`,
    `11. Evidence Status | ${evidenceStatus}`,
    `12. Portfolio Fit | ${targetRole} 기준 ${joinKoreanList(skills.slice(0, 4))} 역량을 먼저 보여주는 케이스로 배치`,
    analysis.sourceReview
      ? `13. Source Review | ${analysis.sourceReview.recommendedPortfolioUse}`
      : "",
    `14. Accuracy Check | ${accuracyReport.sourceCoverage.verifiedClaims}/${accuracyReport.sourceCoverage.totalClaims}개 핵심 주장 검증 · 정확도 ${accuracyReport.overallScore}/100`,
    `15. Item-by-Item Review | ${detailedReview.itemReviews
          .slice(0, 4)
          .map((item) => `${item.sourceLabel}: ${item.portfolioImplication}`)
          .join(" / ")}`,
  ].filter(Boolean).join("\n\n");

  const notionCopy = `# ${portfolioTitle}

## Executive Summary
${summary}

## Recruiter Takeaway
${recruiterTakeaway}

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
${keyMessage}${portfolioFitCopy}${evidenceCopy}${validationCopy}${evidenceMatrixCopy}${sourceReviewCopy}${detailedReviewCopy}${expertReviewCopy}`;

  const onePageSummary = `EXECUTIVE SUMMARY
${keyMessage}

RECRUITER TAKEAWAY
${recruiterTakeaway}

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
${evidenceStatus}

PORTFOLIO FIT
${targetRole} 기준 ${joinKoreanList(skills.slice(0, 5))} 역량을 증명하는 케이스로 배치합니다.`;

  const caseStudy = `# ${portfolioTitle}

## 1. Executive Summary
${summary}

## 2. Recruiter Takeaway
${recruiterTakeaway}

## 3. Business Context
${analysis.background}

## 4. Core Issue
${analysis.problemDefinition}

## 5. Target & Decision Criteria
타깃: ${analysis.targetAudience}

## 6. Key Insight
${analysis.keyInsight}

## 7. Strategic Recommendation
${analysis.strategy}

## 8. Execution Plan
${analysis.execution}

## 9. Outcome / Expected Impact
${analysis.result}

## 10. My Contribution
${analysis.userRole}

## 11. Demonstrated Competencies
${skills.map((skill) => `- ${skill}`).join("\n")}

## 12. Portfolio Slide Blueprint
${slideBlueprintCopy}

## 13. Consultant Review
${analysis.expertComment}

## 14. Core Portfolio Message
${keyMessage}${portfolioFitCopy}${evidenceCopy}${validationCopy}${evidenceMatrixCopy}${sourceReviewCopy}${detailedReviewCopy}${expertReviewCopy}`;

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
