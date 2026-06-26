import type {
  DetailedReviewConfidence,
  ProjectAnalysis,
  UploadedFile,
} from "../../types/proofolio";
import type { AnalyzeFileOptions } from "./contracts";
import { getAccuracyReportForAnalysis } from "../analysis/accuracy-review";
import { getAnalysisProfile } from "./mock-profiles";
import { runOpenAiMock } from "./openai-mock-provider";
import {
  cleanProjectTitle,
  createStableId,
  hasQuantitativeEvidence,
  joinKoreanList,
  sentenceFragment,
} from "./shared";

function formatBytes(size: number) {
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
}

function summarizePreview(value?: string) {
  const normalized = value?.replace(/\s+/g, " ").trim() ?? "";

  if (!normalized) {
    return "원문 텍스트 미리보기 없음. 파일명, 형식, 용량과 프로젝트 맥락을 기준으로 mock 분석을 수행했습니다.";
  }

  return normalized.length > 360
    ? `${normalized.slice(0, 360)}...`
    : normalized;
}

type AnalysisProfile = ReturnType<typeof getAnalysisProfile>;

type DetailedReviewSource = {
  sourceLabel: string;
  sourceExcerpt: string;
  analysisFocus: string;
  fromContentPreview: boolean;
};

function truncateText(value: string, maximum = 260) {
  const normalized = value.replace(/\s+/g, " ").trim();

  return normalized.length > maximum
    ? `${normalized.slice(0, maximum - 3)}...`
    : normalized;
}

function chunkText(value: string, maximum = 220) {
  const chunks: string[] = [];
  let cursor = 0;

  while (cursor < value.length) {
    chunks.push(value.slice(cursor, cursor + maximum));
    cursor += maximum;
  }

  return chunks;
}

function splitPreviewIntoSegments(contentPreview?: string) {
  const normalized = contentPreview
    ?.replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .trim();

  if (!normalized) return [];

  const lineCandidates = normalized
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 16);
  const sentenceCandidates = lineCandidates.flatMap((line) => {
    if (line.length <= 260) return [line];

    const sentences = line
      .split(/(?<=[.!?。！？])\s+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length >= 16);

    return sentences.length ? sentences : chunkText(line);
  });
  const uniqueSegments = Array.from(new Set(sentenceCandidates));

  return uniqueSegments.slice(0, 10);
}

function inferAnalysisFocus(value: string, fallback = "핵심 근거 검토") {
  const normalized = value.toLocaleLowerCase("ko-KR");

  if (/문제|과제|장벽|이탈|불편|pain|problem|issue|challenge/.test(normalized)) {
    return "문제 정의";
  }
  if (/타깃|고객|소비자|유저|audience|target|segment/.test(normalized)) {
    return "타깃/고객 이해";
  }
  if (/인사이트|시사점|발견|패턴|insight|finding/.test(normalized)) {
    return "핵심 인사이트";
  }
  if (/전략|포지셔닝|메시지|콘셉트|strategy|positioning/.test(normalized)) {
    return "전략 방향";
  }
  if (/실행|운영|제작|캠페인|콘텐츠|execution|operation/.test(normalized)) {
    return "실행 내용";
  }
  if (/성과|결과|ctr|cpc|전환|조회|저장|공유|result|metric|kpi/.test(normalized)) {
    return "성과/검증 지표";
  }
  if (/역할|담당|기여|주도|role|contribution|owner/.test(normalized)) {
    return "본인 기여도";
  }

  return fallback;
}

function buildStructuredReviewSources(
  profile: AnalysisProfile,
): DetailedReviewSource[] {
  return [
    {
      sourceLabel: "프로젝트 배경",
      sourceExcerpt: profile.background,
      analysisFocus: "시장/상황 맥락",
      fromContentPreview: false,
    },
    {
      sourceLabel: "문제 정의",
      sourceExcerpt: profile.problemDefinition,
      analysisFocus: "문제 정의",
      fromContentPreview: false,
    },
    {
      sourceLabel: "타깃",
      sourceExcerpt: profile.targetAudience,
      analysisFocus: "타깃/고객 이해",
      fromContentPreview: false,
    },
    {
      sourceLabel: "핵심 인사이트",
      sourceExcerpt: profile.keyInsight,
      analysisFocus: "핵심 인사이트",
      fromContentPreview: false,
    },
    {
      sourceLabel: "전략 방향",
      sourceExcerpt: profile.strategy,
      analysisFocus: "전략 방향",
      fromContentPreview: false,
    },
    {
      sourceLabel: "실행 내용",
      sourceExcerpt: profile.execution,
      analysisFocus: "실행 내용",
      fromContentPreview: false,
    },
    {
      sourceLabel: "결과/기대효과",
      sourceExcerpt: profile.result,
      analysisFocus: "성과/검증 지표",
      fromContentPreview: false,
    },
    {
      sourceLabel: "본인 역할",
      sourceExcerpt: profile.userRole,
      analysisFocus: "본인 기여도",
      fromContentPreview: false,
    },
  ];
}

function getDetailedReviewConfidence({
  source,
  hasTextPreview,
}: {
  source: DetailedReviewSource;
  hasTextPreview: boolean;
}): DetailedReviewConfidence {
  if (hasQuantitativeEvidence(source.sourceExcerpt)) return "높음";
  if (source.fromContentPreview && hasTextPreview) return "중간";
  return "낮음";
}

function buildConsultantDiagnosis({
  focus,
  excerpt,
  primarySkill,
}: {
  focus: string;
  excerpt: string;
  primarySkill: string;
}) {
  const compactExcerpt = truncateText(excerpt, 120);

  if (focus.includes("문제")) {
    return `"${compactExcerpt}" 항목은 프로젝트의 출발점을 보여주지만, 채용 문서에서는 문제의 원인, 영향, 이번 프로젝트에서 실제로 결정한 과제를 분리해야 설득력이 높아집니다.`;
  }
  if (focus.includes("타깃")) {
    return `"${compactExcerpt}" 항목은 고객 범위를 제시합니다. 다만 타깃을 넓게 쓰면 전략 판단이 약해지므로 구매 장벽, 행동 맥락, 우선순위 세그먼트를 함께 좁혀야 합니다.`;
  }
  if (focus.includes("인사이트")) {
    return `"${compactExcerpt}" 항목은 단순 관찰보다 의사결정으로 전환될 수 있는 신호입니다. 이 인사이트가 어떤 자료 비교에서 나왔는지 밝히면 ${primarySkill} 역량 근거가 강화됩니다.`;
  }
  if (focus.includes("전략")) {
    return `"${compactExcerpt}" 항목은 방향성은 명확하지만, 선택한 전략과 제외한 대안을 비교하지 않으면 일반적인 제안처럼 보일 수 있습니다.`;
  }
  if (focus.includes("실행")) {
    return `"${compactExcerpt}" 항목은 실행 범위를 설명합니다. 포트폴리오에서는 실행 목록보다 우선순위, 담당 범위, 검증 방식이 함께 보여야 합니다.`;
  }
  if (focus.includes("성과") || focus.includes("검증")) {
    return hasQuantitativeEvidence(excerpt)
      ? `"${compactExcerpt}" 항목에는 정량 신호가 있어 성과 문장으로 전환할 수 있습니다. 단, 기간, 모수, 비교 기준과 출처를 붙여야 합니다.`
      : `"${compactExcerpt}" 항목은 성과보다 기대효과에 가깝습니다. 실제 결과로 쓰려면 수치, 피드백, 전후 비교 또는 테스트 계획을 보강해야 합니다.`;
  }
  if (focus.includes("기여")) {
    return `"${compactExcerpt}" 항목은 본인의 역할을 보여줍니다. 단독 작성, 공동 의사결정, 지원 업무를 구분하면 개인 기여도가 더 명확해집니다.`;
  }

  return `"${compactExcerpt}" 항목은 프로젝트 맥락을 보완하는 근거입니다. 채용 산출물에서는 사실, 해석, 제안을 구분해 과장 없이 활용하는 것이 적합합니다.`;
}

function buildPortfolioImplication({
  focus,
  projectTitle,
  primarySkill,
}: {
  focus: string;
  projectTitle: string;
  primarySkill: string;
}) {
  if (focus.includes("문제")) {
    return `${projectTitle}의 첫 장에는 문제를 한 문장으로 압축하고, 바로 아래에 고객 문제와 사업 영향을 나눠 제시하세요.`;
  }
  if (focus.includes("타깃")) {
    return "타깃은 연령·속성보다 행동 장면, 구매 장벽, 선택 기준 중심의 페르소나 카드로 전환하는 것이 좋습니다.";
  }
  if (focus.includes("인사이트")) {
    return `이 항목은 ${primarySkill} 역량을 보여주는 핵심 근거로 사용할 수 있으므로, 원자료와 해석 결과를 나란히 배치하세요.`;
  }
  if (focus.includes("전략")) {
    return "전략 슬라이드에는 선택 기준, 선택한 안, 제외한 안, 예상 효과를 2x2 또는 비교표로 구성하세요.";
  }
  if (focus.includes("실행")) {
    return "실행 내용은 To-do 목록이 아니라 우선순위, 담당 범위, 산출물, 검증 지표의 흐름으로 정리하세요.";
  }
  if (focus.includes("성과") || focus.includes("검증")) {
    return "결과 슬라이드에는 확정 성과, 기대효과, 추가 검증 과제를 색상이나 라벨로 분리해 신뢰도를 높이세요.";
  }
  if (focus.includes("기여")) {
    return "나의 역할 섹션에는 직접 만든 산출물, 주도한 판단, 팀과 조율한 결정을 별도 bullet로 제시하세요.";
  }

  return "부가 근거로 활용하되, 최종 포트폴리오에서는 핵심 주장과 직접 연결되는 항목만 선별해 배치하세요.";
}

function buildRequiredFollowUp({
  focus,
  source,
}: {
  focus: string;
  source: DetailedReviewSource;
}) {
  if (focus.includes("성과") || focus.includes("검증")) {
    return hasQuantitativeEvidence(source.sourceExcerpt)
      ? "수치의 기간, 비교 기준, 데이터 출처를 확인하세요."
      : "성과 수치, 정성 피드백, 후속 테스트 지표 중 최소 1개를 추가하세요.";
  }
  if (focus.includes("기여")) {
    return "본인이 직접 결정·작성·조율한 범위를 팀 전체 결과와 분리해 적어 주세요.";
  }
  if (focus.includes("전략")) {
    return "선택하지 않은 대안과 해당 대안을 제외한 기준을 함께 정리하세요.";
  }
  if (focus.includes("문제")) {
    return "문제를 확인한 자료 출처와 이 문제가 중요하다고 판단한 근거를 추가하세요.";
  }
  if (source.fromContentPreview) {
    return "원문 항목이 최종 산출물의 어느 주장에 연결되는지 표시하세요.";
  }

  return "실제 첨부 자료에서 이 항목을 뒷받침하는 원문, 표, 이미지 또는 피드백을 연결하세요.";
}

function buildDetailedReview({
  projectTitle,
  file,
  profile,
  hasTextPreview,
  contentPreview,
  contentSummary,
}: {
  projectTitle: string;
  file: UploadedFile;
  profile: AnalysisProfile;
  hasTextPreview: boolean;
  contentPreview?: string;
  contentSummary?: string;
}) {
  const contentSources: DetailedReviewSource[] = splitPreviewIntoSegments(
    contentPreview,
  ).map((segment, index) => ({
    sourceLabel: `첨부 내용 ${index + 1}`,
    sourceExcerpt: segment,
    analysisFocus: inferAnalysisFocus(segment),
    fromContentPreview: true,
  }));
  const structuredSources = buildStructuredReviewSources(profile);
  const sources = [...contentSources, ...structuredSources];
  const primarySkill = profile.competencyTags[0] ?? "직무 역량";
  const itemReviews = sources.map((source, index) => {
    const focus = source.analysisFocus;
    const excerpt = truncateText(source.sourceExcerpt, 320);

    return {
      id: createStableId(
        "detail",
        `${file.id}-${projectTitle}-${source.sourceLabel}-${index}`,
      ),
      order: index + 1,
      sourceLabel: source.sourceLabel,
      sourceExcerpt: excerpt,
      analysisFocus: focus,
      consultantDiagnosis: buildConsultantDiagnosis({
        focus,
        excerpt,
        primarySkill,
      }),
      portfolioImplication: buildPortfolioImplication({
        focus,
        projectTitle,
        primarySkill,
      }),
      requiredFollowUp: buildRequiredFollowUp({ focus, source }),
      confidence: getDetailedReviewConfidence({
        source,
        hasTextPreview,
      }),
    };
  });

  return {
    reviewMethod: hasTextPreview
      ? `추출 가능한 텍스트 미리보기(${contentSummary ?? "요약 없음"})를 먼저 조각별로 검토한 뒤, 프로젝트 필수 구성요소 8개를 다시 대조했습니다.`
      : "원문 텍스트가 직접 추출되지 않아 파일 메타데이터와 프로젝트 유형별 컨설턴트 체크리스트를 기준으로 필수 구성요소 8개를 항목별 검토했습니다.",
    coverageSummary:
      `${projectTitle}는 총 ${itemReviews.length}개 검토 단위로 나누어 확인했습니다. ` +
      `각 항목은 원문/구성요소, 진단, 포트폴리오 활용 방식, 추가 확인 질문으로 분리되어 최종 산출물의 근거로 재사용할 수 있습니다.`,
    itemReviews,
    synthesisPoints: [
      "각 항목의 사실 정보와 컨설턴트 해석을 분리해 과장된 성과 표현을 방지했습니다.",
      "문제 정의, 인사이트, 전략, 실행, 결과, 본인 기여도가 끊기지 않는지 순서대로 대조했습니다.",
      "채용 담당자가 확인할 수 있는 역량 근거로 전환 가능한 항목과 추가 검증이 필요한 항목을 구분했습니다.",
    ],
    missingEvidence: [
      {
        area: "자료 출처",
        issue: hasTextPreview
          ? "일부 원문은 확인되지만 전체 파일의 출처, 작성 시점, 검토 범위가 아직 분리되어 있지 않습니다."
          : "원문 본문을 직접 파싱하지 못해 파일 내부의 표, 이미지, 슬라이드별 근거를 확인하지 못했습니다.",
        requiredEvidence:
          "사용한 리포트, 광고 지표, 기사, 내부 피드백, 이미지/표의 출처와 기준 시점을 추가하세요.",
      },
      {
        area: "성과 검증",
        issue: hasQuantitativeEvidence(`${profile.result} ${contentPreview ?? ""}`)
          ? "정량 신호는 있으나 비교 기준과 해석 조건이 추가로 필요합니다."
          : "성과를 확정적으로 말하기에는 수치 또는 제3자 피드백이 부족합니다.",
        requiredEvidence:
          "CTR, CPC, 조회, 저장, 공유, 전환율, 평가 점수, 면담 피드백 등 프로젝트 유형에 맞는 검증 지표를 연결하세요.",
      },
      {
        area: "개인 기여",
        issue: "팀 전체 결과와 본인이 직접 만든 산출물의 경계가 더 선명해야 합니다.",
        requiredEvidence:
          "본인이 작성한 장표, 분석표, 카피, 리서치 메모, 의사결정 기준을 별도 항목으로 표시하세요.",
      },
    ],
  };
}

function buildExpertReview({
  projectTitle,
  file,
  profile,
  hasTextPreview,
  contentPreview,
}: {
  projectTitle: string;
  file: UploadedFile;
  profile: ReturnType<typeof getAnalysisProfile>;
  hasTextPreview: boolean;
  contentPreview?: string;
}) {
  const primarySkills = profile.competencyTags.slice(0, 3);
  const problem = sentenceFragment(profile.problemDefinition);
  const insight = sentenceFragment(profile.keyInsight);
  const strategy = sentenceFragment(profile.strategy);
  const resultHasMetrics = hasQuantitativeEvidence(
    `${profile.result} ${contentPreview ?? ""}`,
  );
  const sourceStrength = hasTextPreview
    ? "일부 원문 텍스트가 확인되어 프로젝트의 표현 방향과 문제 정의를 직접 점검할 수 있습니다."
    : "원문 본문은 아직 직접 추출되지 않았으므로 파일명·형식·프로젝트 맥락 기반의 예비 진단으로 해석해야 합니다.";

  return {
    executiveDiagnosis:
      `${projectTitle}는 활동 기록을 단순 요약하기보다 "${problem}"라는 과제를 어떤 기준으로 정의했고, "${insight}"라는 판단을 어떤 실행 전략으로 전환했는지가 평가의 핵심입니다. 전문가 관점에서는 산출물의 완성도보다 문제를 정의한 기준, 대안을 비교한 흔적, 본인이 책임진 의사결정 범위와 검증 가능한 결과가 더 중요합니다.`,
    hiringRelevance:
      `${joinKoreanList(primarySkills)} 역량을 보여줄 수 있는 프로젝트입니다. 다만 채용 담당자는 좋은 아이디어 자체보다 지원자가 실제 업무에서 재현할 수 있는 판단 방식과 실행 품질을 보므로, ${primarySkills[0] ?? "핵심 역량"}이 어떤 자료 검토, 선택 기준, 결과 확인 방식으로 나타났는지 구체화해야 합니다.`,
    evidenceReviews: [
      {
        label: "자료 신뢰도",
        finding: sourceStrength,
        recommendation:
          "최종 포트폴리오에는 사용한 자료 출처, 검토 범위, 제외한 자료와 이유를 한 줄로 명시해 분석의 신뢰도를 높이세요.",
      },
      {
        label: "문제 정의 수준",
        finding:
          `현재 문제 정의는 "${problem}"로 요약됩니다. 고객 문제와 사업 과제가 함께 들어 있어 방향성은 보이지만, 의사결정해야 할 핵심 질문을 더 날카롭게 분리할 여지가 있습니다.`,
        recommendation:
          "문제 정의를 고객 행동 변화, 사업 영향, 이번 프로젝트에서 결정한 항목의 세 문장으로 나누면 전략의 설득력이 높아집니다.",
      },
      {
        label: "전략 연결성",
        finding:
          `핵심 인사이트가 "${strategy}"로 연결되어 전략 흐름은 형성되어 있습니다. 다만 선택하지 않은 대안과 트레이드오프가 없으면 일반적인 제안처럼 보일 수 있습니다.`,
        recommendation:
          "최종본에는 선택한 전략 1개와 제외한 대안 1개를 비교하고, 선택 기준과 예상 효과를 함께 제시하세요.",
      },
      {
        label: "성과 근거",
        finding: resultHasMetrics
          ? "결과 또는 첨부 내용에서 일부 정량 신호가 확인됩니다. 기준 시점과 비교 대상만 보강하면 성과 문장으로 전환할 수 있습니다."
          : "현재 결과는 정성적 기대효과 중심입니다. 성과로 단정하기보다 제안 결과, 기대효과, 후속 검증 지표로 구분해야 합니다.",
        recommendation: resultHasMetrics
          ? "수치 바로 뒤에 기간, 모수, 비교 기준과 출처를 붙여 성과의 해석 가능성을 높이세요."
          : "CTR, CPC, 조회·저장·공유, 전환율, 피드백, 평가 점수 등 프로젝트 유형에 맞는 최소 1개 검증 지표를 추가하세요.",
      },
      {
        label: "본인 기여도",
        finding:
          `현재 역할은 "${sentenceFragment(profile.userRole)}"로 정리됩니다. 수행 범위는 보이지만 단독 결정, 공동 기여, 검토 지원을 더 구분하면 신뢰도가 올라갑니다.`,
        recommendation:
          "본인이 직접 작성한 산출물, 주도한 판단 기준, 팀과 합의한 영역을 분리해 개인 기여도를 명확히 하세요.",
      },
    ],
    strengths: [
      "프로젝트를 활동 목록이 아니라 채용 담당자가 이해할 수 있는 문제-판단-실행 구조로 전환할 수 있습니다.",
      `핵심 역량 후보가 ${joinKoreanList(primarySkills)}로 비교적 명확해 직무 연결 문장을 만들기 쉽습니다.`,
      "전략과 실행안이 분리되어 있지 않아 포트폴리오 케이스 스터디로 확장하기 좋습니다.",
    ],
    risks: [
      "원문 자료의 출처와 검토 범위가 불명확하면 분석의 신뢰도가 낮아질 수 있습니다.",
      "성과 수치가 없는 결과를 성과처럼 표현하면 면접에서 검증 질문에 취약해질 수 있습니다.",
      "팀 프로젝트인 경우 본인의 직접 기여가 흐려지면 좋은 프로젝트도 개인 역량 근거로 약해질 수 있습니다.",
    ],
    validationChecklist: [
      `분석 파일: ${file.name} / ${file.type || "형식 미확인"} / ${formatBytes(file.size)}`,
      "사용한 자료 출처와 검토 기간을 확인했는가?",
      "선택한 전략과 제외한 대안을 같은 기준으로 비교했는가?",
      "본인이 직접 결정하거나 작성한 산출물을 명확히 표시했는가?",
      "성과 문장에 기준 시점, 비교 대상, 수치 또는 정성 피드백을 붙였는가?",
      ...profile.missingQuestions.slice(0, 3),
    ],
    portfolioAngles: [
      "Before/After: 기존 문제 인식과 최종 전략 방향의 차이를 한 장으로 비교",
      "Decision Logic: 핵심 인사이트, 선택 기준, 제외한 대안을 표로 정리",
      "My Contribution: 조사, 판단, 실행, 결과 검증 중 본인이 책임진 범위를 타임라인으로 표시",
      "Evidence Status: 확인된 사실, 해석한 가설, 추가 검증 과제를 색상으로 구분",
    ],
  };
}

export function createMockAnalysis(
  file: UploadedFile,
  options: AnalyzeFileOptions = {},
): ProjectAnalysis {
  const projectTitle =
    options.projectName?.trim() || cleanProjectTitle(file.name);
  const contentPreview = options.contentPreview ?? file.contentPreview;
  const contentSummary = options.contentSummary ?? file.contentSummary;
  const sourceContext = [
    file.name,
    projectTitle,
    file.type,
    contentPreview,
    contentSummary,
  ].join(" ");
  const profile = getAnalysisProfile(sourceContext);
  const previewSummary = summarizePreview(contentPreview);
  const hasTextPreview = Boolean(contentPreview?.trim());
  const fileType = file.type || "확장자 기반 파일";
  const expertReview = buildExpertReview({
    projectTitle,
    file,
    profile,
    hasTextPreview,
    contentPreview,
  });
  const detailedReview = buildDetailedReview({
    projectTitle,
    file,
    profile,
    hasTextPreview,
    contentPreview,
    contentSummary,
  });

  const analysis: ProjectAnalysis = {
    id: createStableId("analysis", `${file.id}-${projectTitle}`),
    sourceFileName: file.name,
    projectTitle,
    ...profile,
    competencyTags: [...profile.competencyTags],
    improvementPoints: [...profile.improvementPoints],
    missingQuestions: [...profile.missingQuestions],
    sourceReview: {
      reviewScope: hasTextPreview
        ? `파일명, 형식, 용량(${formatBytes(file.size)})과 추출 가능한 텍스트 미리보기를 함께 검토했습니다.`
        : `MVP mock 분석 단계에서는 ${fileType} 원문 바이너리 전체를 직접 파싱하지 않고 파일명, 형식, 용량(${formatBytes(file.size)})과 프로젝트 유형별 컨설턴트 기준으로 검토했습니다.`,
      detectedSignals: [
        `파일 신호: ${file.name} · ${fileType} · ${formatBytes(file.size)}`,
        `내용 미리보기: ${previewSummary}`,
        `항목별 상세 검토: ${detailedReview.itemReviews.length}개 검토 단위 생성`,
        `프로젝트 유형 가설: ${profile.projectType}`,
        `역량 후보: ${profile.competencyTags.slice(0, 4).join(", ")}`,
      ],
      evidenceQuality: hasTextPreview
        ? "텍스트 일부가 확인되어 문제 정의와 표현 방향의 근거로 활용했습니다. 다만 성과 수치, 출처, 본인 기여도는 사용자의 추가 답변으로 검증해야 합니다."
        : "원문 세부 데이터가 아직 추출되지 않은 mock 분석이므로, 실제 OpenAI API 연결 시 문서 본문·표·이미지 OCR을 함께 검토해야 합니다.",
      consultantNotes: [
        "채용 문서에 반영할 때는 확인된 사실과 추론한 전략 제안을 분리해야 합니다.",
        "성과는 실행 후 수치가 확인된 경우에만 성과로 쓰고, 그 전에는 기대효과 또는 검증 계획으로 표기해야 합니다.",
        "포트폴리오에는 문제 정의, 본인 역할, 의사결정 기준, 결과 검증 상태가 한 흐름으로 드러나야 합니다.",
      ],
      recommendedPortfolioUse:
        "최종 통합 포트폴리오에서는 이 파일을 프로젝트 근거 자료로 묶고, 핵심 문제·인사이트·전략·역량 태그를 한 장의 케이스 슬라이드로 요약하는 구성이 적합합니다.",
    },
    expertReview,
    detailedReview,
  };

  return {
    ...analysis,
    accuracyReport: getAccuracyReportForAnalysis(analysis),
  };
}

export async function analyzeFile(
  file: UploadedFile,
  options: AnalyzeFileOptions = {},
): Promise<ProjectAnalysis> {
  return runOpenAiMock({
    task: "source-file-analysis",
    inputSummary: `${file.name} ${options.projectName ?? ""}`,
    resolver: () => createMockAnalysis(file, options),
  });
}
