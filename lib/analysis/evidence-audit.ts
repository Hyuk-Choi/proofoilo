import type {
  DetailedReviewConfidence,
  ProjectAnalysis,
  ProofolioWorkspace,
} from "@/types/proofolio";
import { hasQuantitativeEvidence } from "@/lib/ai/shared";
import { getAccuracyReportForAnalysis } from "./accuracy-review";
import { getDetailedReviewForAnalysis } from "./detailed-review";

export type EvidenceReadinessLevel = "제출 가능" | "보완 필요" | "초안";

export type ProjectEvidenceAudit = {
  analysisId: string;
  projectTitle: string;
  score: number;
  level: EvidenceReadinessLevel;
  confidenceCounts: Record<DetailedReviewConfidence, number>;
  answeredQuestions: number;
  totalQuestions: number;
  hasTextPreview: boolean;
  hasQuantitativeEvidence: boolean;
  accuracy: {
    score: number;
    level: DetailedReviewConfidence;
    directEvidenceItems: number;
    inferredItems: number;
    verifiedClaims: number;
    totalClaims: number;
  };
  generatedArtifacts: {
    portfolio: boolean;
    coverLetter: boolean;
    resume: boolean;
    feedback: boolean;
    interview: boolean;
  };
  strengths: string[];
  risks: string[];
  requiredActions: string[];
};

export type WorkspaceFinalReadiness = {
  score: number;
  level: EvidenceReadinessLevel;
  readyForFinal: boolean;
  projectAudits: ProjectEvidenceAudit[];
  blockers: string[];
  warnings: string[];
  checklist: Array<{
    label: string;
    done: boolean;
    description: string;
  }>;
};

const confidenceWeight: Record<DetailedReviewConfidence, number> = {
  높음: 10,
  중간: 6,
  낮음: 2,
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getLevel(score: number): EvidenceReadinessLevel {
  if (score >= 82) return "제출 가능";
  if (score >= 62) return "보완 필요";
  return "초안";
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function compactList(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

export function getProjectEvidenceAudit(
  analysis: ProjectAnalysis,
  workspace?: ProofolioWorkspace,
): ProjectEvidenceAudit {
  const detailedReview = getDetailedReviewForAnalysis(analysis);
  const accuracyReport = getAccuracyReportForAnalysis(analysis);
  const sourceFile = workspace?.uploadedFiles.find(
    (file) => file.name === analysis.sourceFileName,
  );
  const answers = workspace?.questionAnswers[analysis.id] ?? {};
  const answeredQuestions = analysis.missingQuestions.filter(
    (question) => answers[question]?.trim(),
  ).length;
  const confidenceCounts = detailedReview.itemReviews.reduce<
    Record<DetailedReviewConfidence, number>
  >(
    (counts, item) => ({
      ...counts,
      [item.confidence]: counts[item.confidence] + 1,
    }),
    { 높음: 0, 중간: 0, 낮음: 0 },
  );
  const confidenceScore = detailedReview.itemReviews.length
    ? average(
        detailedReview.itemReviews.map(
          (item) => confidenceWeight[item.confidence],
        ),
      ) * 6
    : 0;
  const hasTextPreview = Boolean(
    sourceFile?.contentPreview?.trim() ||
      detailedReview.itemReviews.some((item) =>
        item.sourceLabel.startsWith("첨부 내용"),
      ),
  );
  const quantitativeEvidence = hasQuantitativeEvidence(
    [
      analysis.result,
      analysis.userRole,
      analysis.sourceReview?.evidenceQuality,
      ...Object.values(answers),
      ...detailedReview.itemReviews.map((item) => item.sourceExcerpt),
    ].join(" "),
  );
  const artifactFlags = {
    portfolio: Boolean(workspace?.portfolioOutputs[analysis.id]),
    coverLetter: Boolean(workspace?.coverLetterOutputs[analysis.id]),
    resume: Boolean(workspace?.resumeBullets[analysis.id]?.length),
    feedback: Boolean(workspace?.feedbackScores[analysis.id]),
    interview: Boolean(workspace?.interviewQuestions[analysis.id]?.length),
  };
  const artifactScore =
    Object.values(artifactFlags).filter(Boolean).length * 4;
  const answerScore = analysis.missingQuestions.length
    ? (answeredQuestions / analysis.missingQuestions.length) * 14
    : 14;
  const readinessBase =
    18 +
      confidenceScore +
      (hasTextPreview ? 10 : 0) +
      (quantitativeEvidence ? 12 : 0) +
      answerScore +
      artifactScore;
  const score = clampScore(
    readinessBase * 0.62 + accuracyReport.overallScore * 0.38,
  );
  const level = getLevel(score);
  const strengths = compactList([
    detailedReview.itemReviews.length
      ? `${detailedReview.itemReviews.length}개 항목을 원문/구성요소 단위로 분해했습니다.`
      : "",
    confidenceCounts["높음"] > 0
      ? `근거 신뢰도 높음 항목 ${confidenceCounts["높음"]}개가 확인됩니다.`
      : "",
    hasTextPreview
      ? "텍스트 미리보기가 있어 파일 내부 표현을 일부 직접 반영했습니다."
      : "",
    quantitativeEvidence
      ? "성과 또는 범위에 정량 신호가 포함되어 있습니다."
      : "",
    accuracyReport.level === "높음"
      ? "주요 주장 상당수가 원문 또는 정량 신호와 연결되어 있습니다."
      : "",
    artifactFlags.feedback
      ? "전문가 피드백이 생성되어 제출 전 리스크 점검이 가능합니다."
      : "",
  ]);
  const risks = compactList([
    !hasTextPreview
      ? "원문 본문, 표, 이미지 OCR이 직접 확인되지 않아 파일명/유형 기반 추론 비중이 큽니다."
      : "",
    confidenceCounts["낮음"] > confidenceCounts["높음"]
      ? "낮은 신뢰도 항목이 많아 최종본에서 확정 표현보다 검증 과제로 표시해야 합니다."
      : "",
    !quantitativeEvidence
      ? "성과 수치, 비교 기준, 제3자 피드백이 부족해 결과 문장의 증거력이 약합니다."
      : "",
    accuracyReport.level !== "높음"
      ? `정확도 검토 결과가 ${accuracyReport.level}입니다. 일부 주장은 직접 근거보다 컨설턴트 해석에 의존합니다.`
      : "",
    accuracyReport.sourceCoverage.verifiedClaims <
    accuracyReport.sourceCoverage.totalClaims
      ? `주요 주장 ${accuracyReport.sourceCoverage.totalClaims}개 중 ${accuracyReport.sourceCoverage.totalClaims - accuracyReport.sourceCoverage.verifiedClaims}개는 직접 근거 연결이 부족합니다.`
      : "",
    answeredQuestions < analysis.missingQuestions.length
      ? "보완 질문 일부가 미답변 상태입니다."
      : "",
    !artifactFlags.portfolio
      ? "포트폴리오 문장이 아직 생성되지 않아 최종 PPTX가 분석 요약 중심으로 구성됩니다."
      : "",
    !artifactFlags.feedback
      ? "전문가 피드백이 없어 제출 전 리스크 진단이 빠질 수 있습니다."
      : "",
  ]);
  const requiredActions = compactList([
    !hasTextPreview
      ? "PPT/PDF/DOCX/이미지의 핵심 원문, 표, 이미지 설명을 My Inputs 또는 텍스트 파일로 추가하세요."
      : "",
    !quantitativeEvidence
      ? "성과 문장에 기준 시점, 비교 대상, 수치 또는 정성 피드백을 최소 1개 추가하세요."
      : "",
    ...accuracyReport.verificationActions.slice(0, 4),
    answeredQuestions < analysis.missingQuestions.length
      ? "Analysis의 보완 질문에 답해 역할, 성과, 출처를 보강하세요."
      : "",
    !artifactFlags.portfolio
      ? "Portfolio 페이지에서 포트폴리오 결과물을 생성하세요."
      : "",
    !artifactFlags.feedback
      ? "Feedback 페이지에서 전문가 피드백을 생성하세요."
      : "",
  ]);

  return {
    analysisId: analysis.id,
    projectTitle: analysis.projectTitle,
    score,
    level,
    confidenceCounts,
    answeredQuestions,
    totalQuestions: analysis.missingQuestions.length,
    hasTextPreview,
    hasQuantitativeEvidence: quantitativeEvidence,
    accuracy: {
      score: accuracyReport.overallScore,
      level: accuracyReport.level,
      directEvidenceItems: accuracyReport.sourceCoverage.directEvidenceItems,
      inferredItems: accuracyReport.sourceCoverage.inferredItems,
      verifiedClaims: accuracyReport.sourceCoverage.verifiedClaims,
      totalClaims: accuracyReport.sourceCoverage.totalClaims,
    },
    generatedArtifacts: artifactFlags,
    strengths,
    risks,
    requiredActions,
  };
}

export function getWorkspaceFinalReadiness(
  workspace: ProofolioWorkspace,
): WorkspaceFinalReadiness {
  const projectAudits = workspace.analyses.map((analysis) =>
    getProjectEvidenceAudit(analysis, workspace),
  );
  const analysisCount = workspace.analyses.length;
  const portfolioCount = Object.keys(workspace.portfolioOutputs).length;
  const feedbackCount = Object.keys(workspace.feedbackScores).filter(
    (key) => !key.includes(":coverLetter"),
  ).length;
  const coverLetterCount = Object.keys(workspace.coverLetterOutputs).length;
  const resumeCount = Object.keys(workspace.resumeBullets).length;
  const interviewCount = Object.keys(workspace.interviewQuestions).length;
  const unansweredQuestions = projectAudits.reduce(
    (total, audit) => total + (audit.totalQuestions - audit.answeredQuestions),
    0,
  );
  const lowConfidenceProjects = projectAudits.filter(
    (audit) => audit.score < 62,
  );
  const lowAccuracyProjects = projectAudits.filter(
    (audit) => audit.accuracy.score < 62,
  );
  const evidenceScore = average(projectAudits.map((audit) => audit.score));
  const artifactCoverage = analysisCount
    ? average([
        portfolioCount / analysisCount,
        feedbackCount / analysisCount,
        coverLetterCount / analysisCount,
        resumeCount / analysisCount,
        interviewCount / analysisCount,
      ]) * 100
    : 0;
  const brandSkillScore =
    (workspace.personalBrand ? 50 : 0) + (workspace.skillAnalysis ? 50 : 0);
  const score = clampScore(
    evidenceScore * 0.58 + artifactCoverage * 0.32 + brandSkillScore * 0.1,
  );
  const blockers = compactList([
    analysisCount ? "" : "분석 완료 프로젝트가 없습니다.",
    portfolioCount < analysisCount
      ? `포트폴리오 미생성 프로젝트 ${analysisCount - portfolioCount}개`
      : "",
    feedbackCount < analysisCount
      ? `전문가 피드백 미생성 프로젝트 ${analysisCount - feedbackCount}개`
      : "",
    unansweredQuestions
      ? `미답변 보완 질문 ${unansweredQuestions}개`
      : "",
    lowConfidenceProjects.length
      ? `근거 신뢰도 초안 수준 프로젝트 ${lowConfidenceProjects.length}개`
      : "",
    lowAccuracyProjects.length
      ? `분석 정확도 낮음 프로젝트 ${lowAccuracyProjects.length}개`
      : "",
  ]);
  const warnings = compactList([
    coverLetterCount < analysisCount
      ? `자기소개서 미생성 프로젝트 ${analysisCount - coverLetterCount}개`
      : "",
    resumeCount < analysisCount
      ? `이력서 문장 미생성 프로젝트 ${analysisCount - resumeCount}개`
      : "",
    interviewCount < analysisCount
      ? `면접 질문 미생성 프로젝트 ${analysisCount - interviewCount}개`
      : "",
    workspace.personalBrand ? "" : "개인 브랜딩 결과가 아직 없습니다.",
    workspace.skillAnalysis ? "" : "스킬 분석 결과가 아직 없습니다.",
  ]);
  const level = getLevel(score);
  const readyForFinal = score >= 82 && blockers.length === 0;

  return {
    score,
    level,
    readyForFinal,
    projectAudits,
    blockers,
    warnings,
    checklist: [
      {
        label: "분석 리포트",
        done: analysisCount > 0,
        description: `${analysisCount}개 프로젝트 분석 완료`,
      },
      {
        label: "포트폴리오 생성",
        done: analysisCount > 0 && portfolioCount >= analysisCount,
        description: `${portfolioCount}/${analysisCount}개 생성`,
      },
      {
        label: "전문가 피드백",
        done: analysisCount > 0 && feedbackCount >= analysisCount,
        description: `${feedbackCount}/${analysisCount}개 검토`,
      },
      {
        label: "보완 질문 답변",
        done: unansweredQuestions === 0,
        description: unansweredQuestions
          ? `${unansweredQuestions}개 미답변`
          : "모든 보완 질문 답변 완료",
      },
      {
        label: "지원 직무 맞춤",
        done: Boolean(workspace.userProfile.targetRole),
        description: workspace.userProfile.targetRole || "목표 직무 미설정",
      },
      {
        label: "정확도 검증",
        done:
          analysisCount > 0 &&
          projectAudits.every((audit) => audit.accuracy.score >= 62),
        description: lowAccuracyProjects.length
          ? `${lowAccuracyProjects.length}개 프로젝트 보완 필요`
          : "주요 주장 정확도 검토 완료",
      },
      {
        label: "브랜딩/스킬 분석",
        done: Boolean(workspace.personalBrand && workspace.skillAnalysis),
        description:
          workspace.personalBrand && workspace.skillAnalysis
            ? "개인 브랜드와 스킬 분석 반영"
            : "개인 브랜드 또는 스킬 분석 필요",
      },
    ],
  };
}
