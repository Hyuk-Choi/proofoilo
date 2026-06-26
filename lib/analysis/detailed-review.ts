import type {
  DetailedAnalysisReview,
  DetailedReviewConfidence,
  ProjectAnalysis,
} from "@/types/proofolio";
import {
  createStableId,
  hasQuantitativeEvidence,
  sentenceFragment,
} from "@/lib/ai/shared";

type ReviewSource = {
  label: string;
  excerpt: string;
  focus: string;
};

function truncateText(value: string, maximum = 260) {
  const normalized = value.replace(/\s+/g, " ").trim();

  return normalized.length > maximum
    ? `${normalized.slice(0, maximum - 3)}...`
    : normalized;
}

function getConfidence(excerpt: string): DetailedReviewConfidence {
  return hasQuantitativeEvidence(excerpt) ? "높음" : "낮음";
}

function getFallbackSources(analysis: ProjectAnalysis): ReviewSource[] {
  return [
    {
      label: "프로젝트 배경",
      excerpt: analysis.background,
      focus: "시장/상황 맥락",
    },
    {
      label: "문제 정의",
      excerpt: analysis.problemDefinition,
      focus: "문제 정의",
    },
    {
      label: "타깃",
      excerpt: analysis.targetAudience,
      focus: "타깃/고객 이해",
    },
    {
      label: "핵심 인사이트",
      excerpt: analysis.keyInsight,
      focus: "핵심 인사이트",
    },
    {
      label: "전략 방향",
      excerpt: analysis.strategy,
      focus: "전략 방향",
    },
    {
      label: "실행 내용",
      excerpt: analysis.execution,
      focus: "실행 내용",
    },
    {
      label: "결과/기대효과",
      excerpt: analysis.result,
      focus: "성과/검증 지표",
    },
    {
      label: "본인 역할",
      excerpt: analysis.userRole,
      focus: "본인 기여도",
    },
  ];
}

function getDiagnosis(source: ReviewSource, primarySkill: string) {
  const excerpt = truncateText(source.excerpt, 120);

  if (source.focus.includes("문제")) {
    return `"${excerpt}" 항목은 프로젝트의 출발점을 보여줍니다. 채용 문서에서는 이 문제가 왜 중요한지, 어떤 자료로 확인했는지, 본인이 무엇을 결정했는지를 분리해야 합니다.`;
  }
  if (source.focus.includes("인사이트")) {
    return `"${excerpt}" 항목은 ${primarySkill} 역량을 보여줄 수 있는 핵심 판단입니다. 원자료와 해석 결과를 함께 제시하면 분석의 신뢰도가 높아집니다.`;
  }
  if (source.focus.includes("전략")) {
    return `"${excerpt}" 항목은 방향성은 분명하지만, 제외한 대안과 선택 기준을 함께 보여줄 때 컨설턴트식 문제 해결 구조가 드러납니다.`;
  }
  if (source.focus.includes("성과")) {
    return hasQuantitativeEvidence(source.excerpt)
      ? `"${excerpt}" 항목은 성과 문장으로 전환할 수 있습니다. 수치의 기간, 모수, 비교 기준, 출처를 붙여 검증 가능성을 높이세요.`
      : `"${excerpt}" 항목은 아직 기대효과에 가깝습니다. 실제 성과로 쓰려면 수치, 피드백, 전후 비교 또는 테스트 계획이 필요합니다.`;
  }
  if (source.focus.includes("기여")) {
    return `"${excerpt}" 항목은 개인 역할을 설명합니다. 본인이 직접 만든 산출물, 주도한 판단, 협업에서 조율한 결정을 구분하면 기여도가 선명해집니다.`;
  }

  return `"${excerpt}" 항목은 프로젝트 맥락을 구성하는 근거입니다. 최종 산출물에서는 사실, 해석, 제안을 분리해 과장 없이 활용해야 합니다.`;
}

function getPortfolioUse(source: ReviewSource, projectTitle: string) {
  if (source.focus.includes("문제")) {
    return `${projectTitle}의 첫 장에서 고객 문제와 사업 영향을 나눠 보여주는 핵심 문장으로 활용하세요.`;
  }
  if (source.focus.includes("타깃")) {
    return "페르소나 카드나 고객 여정 표로 바꾸면 전략의 기준이 명확해집니다.";
  }
  if (source.focus.includes("전략")) {
    return "선택한 전략, 제외한 대안, 선택 기준을 비교표로 구성하세요.";
  }
  if (source.focus.includes("실행")) {
    return "실행 항목은 우선순위, 담당 범위, 산출물, 검증 방식의 순서로 재구성하세요.";
  }
  if (source.focus.includes("성과")) {
    return "확정 성과, 기대효과, 추가 검증 과제를 구분해 결과 슬라이드에 배치하세요.";
  }
  if (source.focus.includes("기여")) {
    return "나의 역할 섹션에서 단독 기여와 공동 기여를 나눠 bullet로 작성하세요.";
  }

  return "최종 포트폴리오의 근거 박스나 부록에서 핵심 주장과 연결해 사용하세요.";
}

function getFollowUp(source: ReviewSource) {
  if (source.focus.includes("성과")) {
    return "성과 수치, 정성 피드백, 전후 비교, 후속 테스트 지표 중 최소 1개를 추가하세요.";
  }
  if (source.focus.includes("기여")) {
    return "본인이 직접 작성하거나 결정한 산출물과 팀 전체 결과를 분리해 적어 주세요.";
  }
  if (source.focus.includes("전략")) {
    return "선택하지 않은 대안과 그 대안을 제외한 기준을 추가하세요.";
  }
  if (source.focus.includes("문제")) {
    return "문제를 확인한 출처와 판단 기준을 덧붙이세요.";
  }

  return "해당 항목을 뒷받침하는 원문, 이미지, 표, 피드백 또는 수치를 연결하세요.";
}

export function getDetailedReviewForAnalysis(
  analysis: ProjectAnalysis,
): DetailedAnalysisReview {
  if (analysis.detailedReview) return analysis.detailedReview;

  const sources = getFallbackSources(analysis);
  const primarySkill = analysis.competencyTags[0] ?? "직무 역량";
  const itemReviews = sources.map((source, index) => ({
    id: createStableId(
      "detail-fallback",
      `${analysis.id}-${source.label}-${index}`,
    ),
    order: index + 1,
    sourceLabel: source.label,
    sourceExcerpt: truncateText(source.excerpt, 320),
    analysisFocus: source.focus,
    consultantDiagnosis: getDiagnosis(source, primarySkill),
    portfolioImplication: getPortfolioUse(source, analysis.projectTitle),
    requiredFollowUp: getFollowUp(source),
    confidence: getConfidence(source.excerpt),
  }));

  return {
    reviewMethod:
      "기존 저장 분석에는 원문 조각별 상세 검토 필드가 없어, 현재 분석 리포트의 핵심 구성요소를 기준으로 항목별 정밀 검토를 재구성했습니다. 새로 분석하면 첨부 텍스트 미리보기까지 함께 반영됩니다.",
    coverageSummary:
      `${analysis.projectTitle}를 ${itemReviews.length}개 핵심 구성요소로 나누어 검토했습니다. 문제 정의, 인사이트, 전략, 실행, 결과, 본인 역할이 채용 산출물에서 어떻게 연결되는지 확인할 수 있습니다.`,
    itemReviews,
    synthesisPoints: [
      `${sentenceFragment(analysis.problemDefinition)}라는 문제에서 ${sentenceFragment(analysis.strategy)}라는 전략으로 이어지는 논리를 우선 검증했습니다.`,
      "성과로 단정할 수 있는 부분과 기대효과로 남겨야 하는 부분을 구분했습니다.",
      "본인의 역할이 역량 증거로 읽히도록 직접 기여와 추가 확인 근거를 분리했습니다.",
    ],
    missingEvidence: [
      {
        area: "원문 근거",
        issue: "기존 분석에는 파일 원문 조각이 저장되어 있지 않습니다.",
        requiredEvidence:
          "파일을 다시 분석하거나 핵심 원문, 표, 이미지, 피드백을 보완 질문 답변에 추가하세요.",
      },
      {
        area: "성과 검증",
        issue: "성과의 기준 시점과 비교 대상이 더 필요합니다.",
        requiredEvidence:
          "수치, 기간, 비교군, 출처 또는 제3자 피드백을 연결하세요.",
      },
      {
        area: "개인 기여",
        issue: "팀 결과와 개인 기여의 경계가 더 구체적이어야 합니다.",
        requiredEvidence:
          "직접 작성한 산출물, 주도한 판단, 조율한 의사결정을 별도 bullet로 정리하세요.",
      },
    ],
  };
}
