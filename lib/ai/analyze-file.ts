import type {
  ProjectAnalysis,
  UploadedFile,
} from "../../types/proofolio";
import type { AnalyzeFileOptions } from "./contracts";
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

  return {
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
