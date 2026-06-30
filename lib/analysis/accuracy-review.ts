import type {
  AccuracyClaimCheck,
  AccuracyEvidenceLevel,
  AnalysisAccuracyReport,
  DetailedReviewConfidence,
  ProjectAnalysis,
} from "@/types/proofolio";
import {
  clampScore,
  createStableId,
  hasQuantitativeEvidence,
} from "@/lib/ai/shared";
import { getDetailedReviewForAnalysis } from "./detailed-review";

type ClaimDefinition = {
  label: string;
  claim: string;
  focusMatchers: string[];
};

const confidenceScore: Record<DetailedReviewConfidence, number> = {
  높음: 88,
  중간: 70,
  낮음: 42,
};

function getAccuracyLevel(score: number): DetailedReviewConfidence {
  if (score >= 80) return "높음";
  if (score >= 62) return "중간";
  return "낮음";
}

function compactList(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, maximum = 160) {
  const normalized = normalize(value);

  return normalized.length > maximum
    ? `${normalized.slice(0, maximum - 3)}...`
    : normalized;
}

function isDirectEvidenceLabel(label: string) {
  return label.startsWith("첨부 내용");
}

function getClaimDefinitions(analysis: ProjectAnalysis): ClaimDefinition[] {
  return [
    {
      label: "프로젝트 유형",
      claim: analysis.projectType,
      focusMatchers: ["시장", "프로젝트", "상황", "전략"],
    },
    {
      label: "문제 정의",
      claim: analysis.problemDefinition,
      focusMatchers: ["문제"],
    },
    {
      label: "타깃/고객",
      claim: analysis.targetAudience,
      focusMatchers: ["타깃", "고객"],
    },
    {
      label: "핵심 인사이트",
      claim: analysis.keyInsight,
      focusMatchers: ["인사이트"],
    },
    {
      label: "전략 방향",
      claim: analysis.strategy,
      focusMatchers: ["전략"],
    },
    {
      label: "실행 내용",
      claim: analysis.execution,
      focusMatchers: ["실행"],
    },
    {
      label: "성과/기대효과",
      claim: analysis.result,
      focusMatchers: ["성과", "검증", "결과"],
    },
    {
      label: "본인 역할",
      claim: analysis.userRole,
      focusMatchers: ["기여", "역할"],
    },
  ];
}

function getEvidenceLevel({
  hasDirectEvidence,
  hasAnyDirectEvidence,
  claim,
}: {
  hasDirectEvidence: boolean;
  hasAnyDirectEvidence: boolean;
  claim: string;
}): AccuracyEvidenceLevel {
  if (hasDirectEvidence && hasQuantitativeEvidence(claim)) return "직접 근거";
  if (hasDirectEvidence) return "부분 근거";
  if (hasAnyDirectEvidence) return "추론";
  return "검증 필요";
}

function getClaimConfidence(
  evidenceLevel: AccuracyEvidenceLevel,
  claim: string,
): DetailedReviewConfidence {
  if (evidenceLevel === "직접 근거") return "높음";
  if (evidenceLevel === "부분 근거") return "중간";
  if (evidenceLevel === "추론" && hasQuantitativeEvidence(claim)) return "중간";
  return "낮음";
}

function getClaimRisk(
  evidenceLevel: AccuracyEvidenceLevel,
  label: string,
) {
  if (evidenceLevel === "직접 근거") {
    return "원문 또는 정량 신호와 연결되어 있어 최종본에서 비교적 안정적으로 활용할 수 있습니다.";
  }

  if (evidenceLevel === "부분 근거") {
    return "원문 일부와 연결되지만 기간, 출처, 비교 기준이 빠지면 해석이 과장될 수 있습니다.";
  }

  if (evidenceLevel === "추론") {
    return `${label} 주장은 일부 첨부 맥락에서 재구성한 해석입니다. 최종본에서는 사실처럼 단정하지 말고 판단 근거를 함께 표시해야 합니다.`;
  }

  return `${label} 주장은 현재 mock 분석의 전문 가설에 가깝습니다. 제출 전 원문, 표, 이미지, 피드백 중 최소 1개 근거와 연결해야 합니다.`;
}

function getVerificationAction(
  evidenceLevel: AccuracyEvidenceLevel,
  label: string,
) {
  if (evidenceLevel === "직접 근거") {
    return "수치의 기간, 모수, 비교 기준과 출처를 괄호로 보강하세요.";
  }

  if (evidenceLevel === "부분 근거") {
    return `${label}를 뒷받침하는 원문 문장, 장표 번호, 표 제목 또는 사용자 답변을 추가하세요.`;
  }

  if (evidenceLevel === "추론") {
    return `${label}를 '분석 결과'로 쓰기 전, 첨부 파일의 원문 근거와 연결되는지 다시 확인하세요.`;
  }

  return `${label} 관련 자료를 My Inputs 또는 보완 질문 답변에 추가한 뒤 다시 생성하세요.`;
}

function buildClaimChecks(analysis: ProjectAnalysis): AccuracyClaimCheck[] {
  const detailedReview = getDetailedReviewForAnalysis(analysis);
  const directItems = detailedReview.itemReviews.filter((item) =>
    isDirectEvidenceLabel(item.sourceLabel),
  );
  const hasAnyDirectEvidence = directItems.length > 0;

  return getClaimDefinitions(analysis).map((definition, index) => {
    const support =
      directItems.find((item) =>
        definition.focusMatchers.some((matcher) =>
          item.analysisFocus.includes(matcher),
        ),
      ) ??
      directItems.find((item) =>
        definition.claim
          .split(/\s+/)
          .filter((word) => word.length >= 3)
          .slice(0, 5)
          .some((word) => item.sourceExcerpt.includes(word)),
      );
    const evidenceLevel = getEvidenceLevel({
      hasDirectEvidence: Boolean(support),
      hasAnyDirectEvidence,
      claim: definition.claim,
    });
    const confidence = getClaimConfidence(evidenceLevel, definition.claim);

    return {
      id: createStableId(
        "accuracy",
        `${analysis.id}-${definition.label}-${index}`,
      ),
      label: definition.label,
      claim: truncate(definition.claim, 220),
      evidenceSource: support
        ? `${support.sourceLabel}: ${truncate(support.sourceExcerpt, 120)}`
        : hasAnyDirectEvidence
          ? "첨부 일부는 확인되었지만 이 주장과 직접 연결되는 근거는 부족합니다."
          : "원문 미리보기/OCR이 없어 파일명과 프로젝트 유형 기반으로 추론했습니다.",
      evidenceLevel,
      confidence,
      accuracyRisk: getClaimRisk(evidenceLevel, definition.label),
      verificationAction: getVerificationAction(
        evidenceLevel,
        definition.label,
      ),
    };
  });
}

export function getAccuracyReportForAnalysis(
  analysis: ProjectAnalysis,
): AnalysisAccuracyReport {
  if (analysis.accuracyReport) return analysis.accuracyReport;

  const detailedReview = getDetailedReviewForAnalysis(analysis);
  const claimChecks = buildClaimChecks(analysis);
  const directEvidenceItems = detailedReview.itemReviews.filter((item) =>
    isDirectEvidenceLabel(item.sourceLabel),
  ).length;
  const quantitativeEvidenceItems = detailedReview.itemReviews.filter((item) =>
    hasQuantitativeEvidence(item.sourceExcerpt),
  ).length;
  const inferredItems = Math.max(
    0,
    detailedReview.itemReviews.length - directEvidenceItems,
  );
  const verifiedClaims = claimChecks.filter((check) =>
    ["직접 근거", "부분 근거"].includes(check.evidenceLevel),
  ).length;
  const textPreviewCharacters = detailedReview.itemReviews
    .filter((item) => isDirectEvidenceLabel(item.sourceLabel))
    .reduce((total, item) => total + item.sourceExcerpt.length, 0);
  const claimAverage =
    claimChecks.reduce(
      (total, check) => total + confidenceScore[check.confidence],
      0,
    ) / Math.max(1, claimChecks.length);
  const directCoverage =
    directEvidenceItems / Math.max(1, detailedReview.itemReviews.length);
  const verifiedCoverage = verifiedClaims / Math.max(1, claimChecks.length);
  const quantitativeCoverage =
    quantitativeEvidenceItems / Math.max(1, detailedReview.itemReviews.length);
  const overallScore = clampScore(
    claimAverage * 0.58 +
      directCoverage * 18 +
      verifiedCoverage * 16 +
      quantitativeCoverage * 8,
  );
  const level = getAccuracyLevel(overallScore);
  const limitations = compactList([
    directEvidenceItems
      ? ""
      : "첨부 파일의 본문, 표, 이미지, 슬라이드별 OCR이 직접 확인되지 않아 분석 일부는 프로젝트 유형 기반 추론입니다.",
    quantitativeEvidenceItems
      ? ""
      : "성과 수치 또는 비교 기준이 부족해 결과 문장은 확정 성과보다 기대효과/검증 과제로 표현해야 합니다.",
    verifiedClaims < claimChecks.length
      ? `주요 주장 ${claimChecks.length}개 중 ${claimChecks.length - verifiedClaims}개는 직접 근거 연결이 부족합니다.`
      : "",
    "현재 MVP는 내부 분석 로직 기준이므로 외부 생성 API 연결 전에는 사용자가 제공한 원문과 답변을 기준으로 보수적으로 해석합니다.",
  ]);
  const verificationActions = compactList([
    ...claimChecks
      .filter((check) => check.confidence !== "높음")
      .map((check) => check.verificationAction),
    quantitativeEvidenceItems
      ? ""
      : "성과 항목에는 수치, 기간, 모수, 비교 대상, 출처 또는 정성 피드백을 추가하세요.",
    directEvidenceItems
      ? ""
      : "PPT/PDF/DOCX/이미지의 핵심 내용을 텍스트로 붙여 넣거나 My Inputs에 경험 기록을 추가하세요.",
  ]);

  return {
    overallScore,
    level,
    summary:
      level === "높음"
        ? "주요 주장 상당수가 원문 또는 정량 신호와 연결되어 있어 최종 산출물에 활용 가능한 수준입니다. 다만 출처와 기준 시점 표기는 유지해야 합니다."
        : level === "중간"
          ? "분석 구조는 타당하지만 일부 주장이 원문 근거보다 컨설턴트 해석에 의존합니다. 제출 전 근거 연결과 수치 보강이 필요합니다."
          : "현재 분석은 예비 진단 성격이 강합니다. 최종본에서 확정 표현을 쓰기 전에 원문, 수치, 본인 기여 범위를 추가로 검증해야 합니다.",
    sourceCoverage: {
      reviewedItems: detailedReview.itemReviews.length,
      directEvidenceItems,
      inferredItems,
      quantitativeEvidenceItems,
      verifiedClaims,
      totalClaims: claimChecks.length,
      textPreviewCharacters,
    },
    claimChecks,
    limitations,
    verificationActions,
  };
}
