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
