import type {
  DetailedReviewConfidence,
  ProjectAnalysis,
  ProofolioWorkspace,
} from "@/types/proofolio";
import {
  hasQuantitativeEvidence,
  joinKoreanList,
} from "@/lib/ai/shared";
import { getAccuracyReportForAnalysis } from "./accuracy-review";
import { getDetailedReviewForAnalysis } from "./detailed-review";
import { getProjectEvidenceAudit } from "./evidence-audit";

export type ResearchReadinessLevel = "충분" | "보완 필요" | "부족";
export type ResearchCriterionStatus = "통과" | "보완 필요" | "차단";

export type ResearchDepthCriterion = {
  label: string;
  score: number;
  status: ResearchCriterionStatus;
  description: string;
  evidence: string;
  recommendation: string;
};

export type ProjectResearchDepthAudit = {
  analysisId: string;
  projectTitle: string;
  score: number;
  level: ResearchReadinessLevel;
  readyForOutput: boolean;
  summary: string;
  criteria: ResearchDepthCriterion[];
  blockers: string[];
  improvements: string[];
  strengths: string[];
  researchBrief: string[];
  researchGaps: string[];
  minimumActions: string[];
};

export type WorkspaceResearchDepthAudit = {
  score: number;
  level: ResearchReadinessLevel;
  readyForOutputs: boolean;
  projectAudits: ProjectResearchDepthAudit[];
  blockers: string[];
  improvements: string[];
  executiveSummary: string;
};

const confidenceWeight: Record<DetailedReviewConfidence, number> = {
  높음: 100,
  중간: 74,
  낮음: 38,
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function ratioScore(value: number, total: number) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, (value / total) * 100));
}

function compactList(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

function statusFromScore(score: number): ResearchCriterionStatus {
  if (score >= 82) return "통과";
  if (score >= 62) return "보완 필요";
  return "차단";
}

function levelFromScore(score: number): ResearchReadinessLevel {
  if (score >= 82) return "충분";
  if (score >= 62) return "보완 필요";
  return "부족";
}

function criterion({
  label,
  score,
  description,
  evidence,
  recommendation,
}: Omit<ResearchDepthCriterion, "score" | "status"> & {
  score: number;
}): ResearchDepthCriterion {
  const normalizedScore = clampScore(score);

  return {
    label,
    score: normalizedScore,
    status: statusFromScore(normalizedScore),
    description,
    evidence,
    recommendation,
  };
}

function countMatches(value: string, patterns: RegExp[]) {
  return patterns.filter((pattern) => pattern.test(value)).length;
}

function hasText(value: string, minimum = 24) {
  return value.trim().length >= minimum;
}

function getAnswerMap(
  analysis: ProjectAnalysis,
  workspace?: ProofolioWorkspace,
  userAnswers?: Record<string, string>,
) {
  return userAnswers ?? workspace?.questionAnswers[analysis.id] ?? {};
}

function getCareerInputText(workspace?: ProofolioWorkspace) {
  return (
    workspace?.careerInputs
      .map((input) =>
        [
          input.title,
          input.targetRole,
          input.companyName,
          input.situation,
          input.action,
          input.result,
          input.learned,
          input.content,
          input.tags.join(" "),
        ].join(" "),
      )
      .join(" ") ?? ""
  );
}

export function getProjectResearchDepthAudit(
  analysis: ProjectAnalysis,
  workspace?: ProofolioWorkspace,
  userAnswers?: Record<string, string>,
): ProjectResearchDepthAudit {
  const detailedReview = getDetailedReviewForAnalysis(analysis);
  const accuracyReport = getAccuracyReportForAnalysis(analysis);
  const evidenceAudit = getProjectEvidenceAudit(analysis, workspace);
  const sourceFile = workspace?.uploadedFiles.find(
    (file) => file.name === analysis.sourceFileName,
  );
  const answers = getAnswerMap(analysis, workspace, userAnswers);
  const answeredQuestions = analysis.missingQuestions.filter(
    (question) => answers[question]?.trim(),
  ).length;
  const answerText = Object.values(answers).join(" ");
  const careerInputText = getCareerInputText(workspace);
  const combinedText = [
    sourceFile?.contentPreview,
    sourceFile?.contentSummary,
    answerText,
    careerInputText,
    analysis.background,
    analysis.problemDefinition,
    analysis.targetAudience,
    analysis.keyInsight,
    analysis.strategy,
    analysis.execution,
    analysis.result,
    analysis.userRole,
    analysis.sourceReview?.reviewScope,
    analysis.sourceReview?.evidenceQuality,
    analysis.sourceReview?.detectedSignals.join(" "),
    ...detailedReview.itemReviews.map((item) => item.sourceExcerpt),
  ]
    .filter(Boolean)
    .join(" ");
  const directEvidenceItems =
    accuracyReport.sourceCoverage.directEvidenceItems;
  const textPreviewCharacters =
    accuracyReport.sourceCoverage.textPreviewCharacters +
    (sourceFile?.contentPreview?.length ?? 0);
  const highConfidenceItems = detailedReview.itemReviews.filter(
    (item) => item.confidence === "높음",
  ).length;
  const mediumConfidenceItems = detailedReview.itemReviews.filter(
    (item) => item.confidence === "중간",
  ).length;
  const confidenceScore = detailedReview.itemReviews.length
    ? average(
        detailedReview.itemReviews.map(
          (item) => confidenceWeight[item.confidence],
        ),
      )
    : 0;
  const requiredFrameworkFields = [
    analysis.background,
    analysis.problemDefinition,
    analysis.targetAudience,
    analysis.keyInsight,
    analysis.strategy,
    analysis.execution,
    analysis.result,
    analysis.userRole,
  ];
  const sourceKinds = compactList([
    sourceFile?.contentPreview?.trim() ? "업로드 원문 미리보기" : "",
    answerText.trim() ? "보완 질문 답변" : "",
    analysis.sourceReview ? "첨부 파일 검토 리포트" : "",
    detailedReview.itemReviews.length ? "항목별 정밀 리뷰" : "",
    careerInputText.trim() ? "직접 입력 경험/자소서" : "",
    hasQuantitativeEvidence(combinedText) ? "정량 지표" : "",
  ]);
  const researchSignalCount = countMatches(combinedText, [
    /출처|source|기사|리포트|논문|보고서|자료|원문/i,
    /설문|인터뷰|후기|피드백|VOC|멘토|교수|고객/i,
    /경쟁|비교|벤치마크|대안|포지셔닝|시장/i,
    /CTR|CPC|CVR|ROAS|조회|저장|공유|전환|매출|점수|명|개|%/i,
    /타깃|고객|페르소나|여정|세그먼트|구매/i,
  ]);
  const roleSignalCount = countMatches(analysis.userRole, [
    /담당|주도|작성|설계|분석|정의|도출|비교|운영|조율|제안/,
    /산출물|장표|표|카피|와이어프레임|원고|캘린더|리포트/,
    /의사결정|기준|우선순위|검증|피드백/,
  ]);
  const sourceCoverageScore = clampScore(
    Math.min(40, directEvidenceItems * 9) +
      Math.min(24, textPreviewCharacters / 18) +
      (analysis.sourceReview ? 14 : 0) +
      Math.min(22, detailedReview.itemReviews.length * 2.8),
  );
  const frameworkScore = clampScore(
    ratioScore(
      requiredFrameworkFields.filter((field) => hasText(field, 42)).length,
      requiredFrameworkFields.length,
    ) *
      0.76 +
      Math.min(24, analysis.competencyTags.length * 4),
  );
  const validationScore = clampScore(
    ratioScore(
      accuracyReport.sourceCoverage.verifiedClaims,
      accuracyReport.sourceCoverage.totalClaims,
    ) *
      0.36 +
      (hasQuantitativeEvidence(combinedText) ? 24 : 8) +
      (analysis.missingQuestions.length
        ? ratioScore(answeredQuestions, analysis.missingQuestions.length) * 0.24
        : 24) +
      Math.min(16, highConfidenceItems * 5 + mediumConfidenceItems * 2),
  );
  const sourceDiversityScore = clampScore(
    ratioScore(sourceKinds.length, 5) * 0.58 + researchSignalCount * 8.4,
  );
  const marketContextScore = clampScore(
    countMatches(combinedText, [
      /시장|산업|경쟁|브랜드|서비스|카테고리/,
      /타깃|고객|사용자|소비자|페르소나|세그먼트/,
      /문제|니즈|pain|구매|전환|여정/,
      /전략|포지셔닝|메시지|채널|랜딩|콘텐츠/,
    ]) * 22 +
      (analysis.targetAudience.length >= 36 ? 12 : 0),
  );
  const roleContributionScore = clampScore(
    Math.min(44, analysis.userRole.length * 0.54) +
      roleSignalCount * 13 +
      (answerText.trim() ? 12 : 0),
  );
  const synthesisScore = clampScore(
    confidenceScore * 0.34 +
      accuracyReport.overallScore * 0.28 +
      evidenceAudit.score * 0.22 +
      Math.min(16, detailedReview.synthesisPoints.length * 5.4),
  );
  const criteria = [
    criterion({
      label: "원문·첨부 검토 범위",
      score: sourceCoverageScore,
      description:
        "업로드 파일의 원문, 텍스트 미리보기, 첨부 검토 리포트와 항목별 리뷰가 충분히 반영됐는지 확인합니다.",
      evidence: `직접 근거 ${directEvidenceItems}개 · 텍스트 근거 ${textPreviewCharacters}자 · 정밀 리뷰 ${detailedReview.itemReviews.length}개`,
      recommendation:
        "PPT/PDF/DOCX/이미지의 핵심 문장, 표 제목, 수치, 이미지 설명을 텍스트로 추가하면 분석 정확도가 올라갑니다.",
    }),
    criterion({
      label: "문제 해결 프레임 완성도",
      score: frameworkScore,
      description:
        "배경, 문제, 타깃, 인사이트, 전략, 실행, 결과, 본인 역할이 포트폴리오 구조로 모두 분리됐는지 확인합니다.",
      evidence: `핵심 필드 ${requiredFrameworkFields.filter((field) => hasText(field, 42)).length}/${requiredFrameworkFields.length}개 충족 · 역량 태그 ${analysis.competencyTags.length}개`,
      recommendation:
        "짧거나 추상적인 항목은 '무엇을 봤고, 어떤 기준으로 판단했고, 무엇을 실행했는지'가 드러나게 보강하세요.",
    }),
    criterion({
      label: "검증 근거와 보완 답변",
      score: validationScore,
      description:
        "핵심 주장, 성과 수치, 보완 질문 답변이 최종 산출물의 확정 표현을 뒷받침하는지 확인합니다.",
      evidence: `검증 주장 ${accuracyReport.sourceCoverage.verifiedClaims}/${accuracyReport.sourceCoverage.totalClaims} · 보완 답변 ${answeredQuestions}/${analysis.missingQuestions.length} · 정량 근거 ${hasQuantitativeEvidence(combinedText) ? "있음" : "부족"}`,
      recommendation:
        "성과 문장마다 기간, 비교 대상, 수치, 출처 또는 제3자 피드백을 붙이고 미답변 질문을 먼저 채우세요.",
    }),
    criterion({
      label: "리서치 출처 다양성",
      score: sourceDiversityScore,
      description:
        "파일 원문, 보완 답변, 직접 입력 경험, 정량 지표와 외부/비교 맥락이 함께 쓰였는지 확인합니다.",
      evidence: `확인 출처: ${sourceKinds.join(", ") || "부족"} · 리서치 신호 ${researchSignalCount}개`,
      recommendation:
        "기사, 리포트, 설문, 경쟁 비교, 고객 반응 중 최소 2가지 이상의 근거 유형을 추가하세요.",
    }),
    criterion({
      label: "시장·고객 맥락",
      score: marketContextScore,
      description:
        "프로젝트가 개인 활동 설명에 그치지 않고 시장, 고객, 경쟁, 구매/사용 맥락에서 해석되는지 확인합니다.",
      evidence: `시장·고객·전략 맥락 신호를 ${countMatches(combinedText, [/시장|산업|경쟁|브랜드|서비스|카테고리/, /타깃|고객|사용자|소비자|페르소나|세그먼트/, /문제|니즈|pain|구매|전환|여정/, /전략|포지셔닝|메시지|채널|랜딩|콘텐츠/])}개 범주에서 확인`,
      recommendation:
        "타깃을 한 문장으로 끝내지 말고 고객 행동, 경쟁 대안, 선택 기준과 연결해 설명하세요.",
    }),
    criterion({
      label: "본인 기여 검증성",
      score: roleContributionScore,
      description:
        "팀 결과와 개인 기여가 분리되어, 면접에서 본인이 실제로 한 일을 방어할 수 있는지 확인합니다.",
      evidence: `역할 문장 ${analysis.userRole.length}자 · 역할 신호 ${roleSignalCount}개 · 보완 답변 ${answerText.trim() ? "있음" : "없음"}`,
      recommendation:
        "직접 작성한 산출물, 결정한 기준, 비교한 대안, 조율한 이해관계자를 별도 bullet로 적으세요.",
    }),
    criterion({
      label: "컨설턴트식 종합 분석",
      score: synthesisScore,
      description:
        "항목별 근거와 정확도 검토를 종합해 최종 포트폴리오에서 무엇을 주장하고 무엇을 보류할지 판단합니다.",
      evidence: `정확도 ${accuracyReport.overallScore}/100 · 근거 감사 ${evidenceAudit.score}/100 · 신뢰도 평균 ${Math.round(confidenceScore)}/100`,
      recommendation:
        "신뢰도 낮은 항목은 확정 성과가 아니라 가설, 기대효과, 추가 검증 계획으로 라벨링하세요.",
    }),
  ];
  const score = clampScore(average(criteria.map((item) => item.score)));
  const criticalCriterionLabels = [
    "원문·첨부 검토 범위",
    "검증 근거와 보완 답변",
  ];
  const blockers = compactList([
    ...criteria
      .filter(
        (item) =>
          item.status === "차단" &&
          criticalCriterionLabels.includes(item.label),
      )
      .map((item) => `${item.label}: ${item.recommendation}`),
    directEvidenceItems === 0 && !sourceFile?.contentPreview
      ? "업로드 파일의 직접 원문 근거가 부족합니다."
      : "",
    !hasQuantitativeEvidence(combinedText)
      ? "성과 또는 검증 기준을 뒷받침할 정량/정성 근거가 부족합니다."
      : "",
  ]);
  const improvements = compactList([
    ...criteria
      .filter((item) => item.status !== "통과")
      .map((item) => `${item.label}: ${item.recommendation}`),
    ...evidenceAudit.requiredActions.slice(0, 3),
    ...accuracyReport.verificationActions.slice(0, 3),
  ]);
  const strengths = criteria
    .filter((item) => item.status === "통과")
    .map((item) => `${item.label}: ${item.evidence}`);
  const level = levelFromScore(score);
  const readyForOutput = score >= 78 && blockers.length === 0;
  const researchGaps = compactList([
    ...criteria
      .filter((item) => item.status !== "통과")
      .map((item) => `${item.label} 보완 필요`),
    ...detailedReview.missingEvidence.map((gap) => `${gap.area}: ${gap.issue}`),
  ]);
  const minimumActions = compactList([
    ...blockers,
    ...improvements,
  ]).slice(0, 6);
  const researchBrief = compactList([
    `검토 범위: ${sourceKinds.join(", ") || "분석 리포트 기반"}를 활용했습니다.`,
    `핵심 리서치 프레임: ${analysis.projectType}을 ${joinKoreanList(
      analysis.competencyTags.slice(0, 4),
    )} 관점에서 문제-인사이트-전략-역할로 재구성했습니다.`,
    `검증 상태: 핵심 주장 ${accuracyReport.sourceCoverage.verifiedClaims}/${accuracyReport.sourceCoverage.totalClaims}개가 직접 또는 부분 근거와 연결됐습니다.`,
    `성과 표기 기준: ${
      hasQuantitativeEvidence(combinedText)
        ? "수치가 있는 항목은 기간·모수·출처를 보강해 성과로 활용합니다."
        : "수치가 부족한 항목은 기대효과 또는 검증 계획으로 표기합니다."
    }`,
    `산출물 사용 판단: ${readyForOutput ? "최종 산출물에 반영 가능한 리서치 수준입니다." : "산출물에는 가설/보완 필요 라벨을 함께 표시해야 합니다."}`,
  ]);

  return {
    analysisId: analysis.id,
    projectTitle: analysis.projectTitle,
    score,
    level,
    readyForOutput,
    summary: readyForOutput
      ? "원문/근거, 문제 해결 구조, 시장·고객 맥락과 본인 기여가 산출물에 반영 가능한 수준입니다."
      : score >= 62
        ? "기본 분석 구조는 갖췄지만 일부 원문 근거, 출처 다양성, 성과 검증 또는 본인 기여 근거를 보완해야 합니다."
        : "현재 리서치 수준은 최종 산출물보다 초안에 가깝습니다. 원문, 수치, 출처와 보완 답변을 먼저 추가해야 합니다.",
    criteria,
    blockers,
    improvements,
    strengths,
    researchBrief,
    researchGaps,
    minimumActions,
  };
}

export function getWorkspaceResearchDepthAudit(
  workspace: ProofolioWorkspace,
): WorkspaceResearchDepthAudit {
  const projectAudits = workspace.analyses.map((analysis) =>
    getProjectResearchDepthAudit(analysis, workspace),
  );
  const score = clampScore(average(projectAudits.map((audit) => audit.score)));
  const blockers = compactList(
    projectAudits.flatMap((audit) =>
      audit.blockers.map((blocker) => `${audit.projectTitle}: ${blocker}`),
    ),
  );
  const improvements = compactList(
    projectAudits.flatMap((audit) =>
      audit.improvements.map(
        (improvement) => `${audit.projectTitle}: ${improvement}`,
      ),
    ),
  );
  const readyForOutputs =
    projectAudits.length > 0 &&
    projectAudits.every((audit) => audit.readyForOutput);
  const level = levelFromScore(score);

  return {
    score,
    level,
    readyForOutputs,
    projectAudits,
    blockers,
    improvements,
    executiveSummary: readyForOutputs
      ? "모든 프로젝트가 최종 포트폴리오 산출물에 반영 가능한 리서치 충분도 기준을 충족합니다."
      : score >= 62
        ? "대부분의 프로젝트는 구조화됐지만 일부 근거, 출처 다양성 또는 성과 검증 보완이 필요합니다."
        : "현재 작업공간은 리서치 기반이 약해 최종 산출물을 초안으로 표시해야 합니다. 원문·수치·보완 답변을 먼저 추가하세요.",
  };
}
