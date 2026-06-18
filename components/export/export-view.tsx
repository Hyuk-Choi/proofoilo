"use client";

import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  Download,
  FileOutput,
  FileText,
  ListChecks,
  NotebookTabs,
  Presentation,
  ScanText,
  UserRoundSearch,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  AnalysisProjectPicker,
  ArtifactPageHeader,
  CopyTextButton,
  NoAnalysisForArtifact,
} from "@/components/artifacts/artifact-workspace";
import { useAnalysisSelection } from "@/hooks/use-analysis-selection";
import { useProofolioWorkspace } from "@/hooks/use-proofolio-workspace";
import {
  buildPortfolioPptx,
  buildExportContent,
  getPortfolioPptxFileName,
  getGeneratedExportCount,
  type ExportFormat,
} from "@/lib/export";

const exportFormats: Array<{
  id: ExportFormat;
  label: string;
  description: string;
  example: string;
  icon: LucideIcon;
  source: string;
  href: string;
}> = [
  {
    id: "portfolioDeck",
    label: "통합 포트폴리오 PPTX",
    description: "분석된 모든 파일을 하나의 채용 포트폴리오 덱으로 묶기",
    example: "예: 전체 프로젝트를 커버, 케이스, 역량, 보완 과제 슬라이드로 구성",
    icon: Presentation,
    source: "Analysis",
    href: "/analysis",
  },
  {
    id: "notion",
    label: "Notion용 텍스트",
    description: "마크다운 제목과 섹션을 유지한 정리본",
    example: "예: 포트폴리오 페이지에 바로 붙여넣는 섹션 구조",
    icon: NotebookTabs,
    source: "Portfolio",
    href: "/portfolio",
  },
  {
    id: "pdf",
    label: "PDF용 정리본",
    description: "문서 배치에 적합한 1페이지 프로젝트 요약",
    example: "예: PDF 한 장에 들어갈 프로젝트 개요와 핵심 문장",
    icon: ScanText,
    source: "Portfolio",
    href: "/portfolio",
  },
  {
    id: "ppt",
    label: "PPT 슬라이드용 문구",
    description: "슬라이드 순서에 맞춘 제목과 핵심 문장",
    example: "예: 문제, 인사이트, 전략, 실행 슬라이드 카피",
    icon: Presentation,
    source: "Portfolio",
    href: "/portfolio",
  },
  {
    id: "coverLetter",
    label: "자기소개서 텍스트",
    description: "여섯 가지 자기소개서 항목 통합본",
    example: "예: 지원동기부터 입사 후 포부까지 한 번에 검토",
    icon: FileText,
    source: "Cover Letter",
    href: "/cover-letter",
  },
  {
    id: "resume",
    label: "이력서 bullet point",
    description: "프로젝트 경험 불릿과 핵심 키워드",
    example: "예: 직무 역량이 드러나는 3~5개 경력 문장",
    icon: ListChecks,
    source: "Resume",
    href: "/resume",
  },
  {
    id: "interview",
    label: "면접 준비 자료",
    description: "대표 질문, 꼬리질문과 답변 가이드",
    example: "예: 예상 질문과 약점 방어 답변을 한 문서로 정리",
    icon: UserRoundSearch,
    source: "Interview",
    href: "/interview",
  },
];

export function ExportView({
  initialAnalysisId,
}: {
  initialAnalysisId?: string;
}) {
  const { workspace } = useProofolioWorkspace();
  const analyses = useMemo(() => workspace.analyses, [workspace.analyses]);
  const { selectedId, selectedAnalysis, selectAnalysis } =
    useAnalysisSelection(analyses, initialAnalysisId);
  const [format, setFormat] = useState<ExportFormat>("notion");

  const downloadPortfolioDeck = () => {
    const blob = buildPortfolioPptx(workspace);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = getPortfolioPptxFileName(workspace);
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  if (!selectedAnalysis) {
    return <NoAnalysisForArtifact artifactName="내보내기 결과물" />;
  }

  const selectedFormat =
    exportFormats.find((option) => option.id === format) ?? exportFormats[0];
  const content = buildExportContent(workspace, selectedAnalysis, format);
  const generatedAnalysisIds = new Set(
    analyses
      .filter(
        (analysis) =>
          getGeneratedExportCount(workspace, analysis.id) > 0,
      )
      .map((analysis) => analysis.id),
  );
  const totalExportCount = analyses.reduce(
    (total, analysis) =>
      total + getGeneratedExportCount(workspace, analysis.id),
    0,
  );
  const lineCount = content ? content.split("\n").length : 0;

  return (
    <div className="space-y-7">
      <ArtifactPageHeader
        eyebrow="FINAL OUTPUT"
        title="완성된 커리어 문서를 내보내세요"
        description="생성하고 수정한 최신 결과물을 목적에 맞는 텍스트 형식으로 미리 확인하고 바로 복사할 수 있습니다."
        icon={FileOutput}
        completedCount={analyses.length}
        resultCount={totalExportCount}
        resultLabel="내보내기 가능"
        example="예: Notion용 텍스트는 제목과 섹션 구조를 유지해 바로 붙여넣을 수 있습니다."
      />

      <section className="grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)]">
        <AnalysisProjectPicker
          analyses={analyses}
          selectedId={selectedId}
          onSelect={selectAnalysis}
          generatedIds={generatedAnalysisIds}
          generatedLabel="결과물 있음"
        />

        <div className="space-y-5">
          <section className="pf-card p-6 sm:p-7">
            <div>
              <p className="text-[10px] font-black tracking-[0.14em] text-[#2563eb]">
                EXPORT FORMAT
              </p>
              <h3 className="mt-1.5 text-[16px] font-black text-[#263853]">
                출력할 결과물 형식을 선택하세요
              </h3>
              <p className="mt-1.5 text-[12px] leading-6 text-[#8996a8]">
                텍스트 미리보기와 함께 통합 포트폴리오 PPTX 파일을 생성할 수
                있습니다. 실제 OpenAI API는 아직 연결하지 않고 mock provider로
                컨설턴트 수준의 구조를 만듭니다.
              </p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {exportFormats.map((option) => {
                const Icon = option.icon;
                const active = option.id === format;
                const optionContent = buildExportContent(
                  workspace,
                  selectedAnalysis,
                  option.id,
                );

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFormat(option.id)}
                    className={`flex min-h-[128px] flex-col justify-between rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-[#90b0f3] bg-[#eef4ff]"
                        : "border-[#e3e8ef] bg-[#fafbfd] hover:border-[#c8d4e5] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`grid size-10 place-items-center rounded-xl ${
                          active
                            ? "bg-[#2563eb] text-white"
                            : "bg-white text-[#687b94] shadow-sm"
                        }`}
                      >
                        <Icon size={17} />
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-extrabold ${
                          optionContent
                            ? "bg-[#e5f6ef] text-[#168765]"
                            : "bg-[#eef1f5] text-[#8794a6]"
                        }`}
                      >
                        {optionContent ? "준비 완료" : "미생성"}
                      </span>
                    </div>
                    <div className="mt-4">
                      <strong className="block text-[12px] font-extrabold text-[#30425c]">
                        {option.label}
                      </strong>
                      <span className="mt-1 block text-[10px] leading-5 text-[#8e9aab]">
                        {option.description}
                      </span>
                      <span className="mt-2 block text-[10px] leading-5 text-[#6b7c92]">
                        {option.example}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="pf-card overflow-hidden">
            <div className="flex flex-col justify-between gap-4 border-b border-[#e7ecf2] px-6 py-5 sm:flex-row sm:items-center sm:px-7">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-[#eaf1ff] text-[#2563eb]">
                  <ClipboardList size={17} />
                </span>
                <div>
                  <p className="text-[10px] font-black tracking-[0.13em] text-[#2563eb]">
                    TEXT PREVIEW
                  </p>
                  <h3 className="mt-1 text-[14px] font-black text-[#263853]">
                    {selectedFormat.label}
                  </h3>
                </div>
              </div>
              <CopyTextButton
                content={content}
                label={`${selectedFormat.label} 복사`}
                className="pf-button-primary h-10 px-4"
              />
              {format === "portfolioDeck" ? (
                <button
                  type="button"
                  onClick={downloadPortfolioDeck}
                  className="pf-button-secondary h-10 px-4"
                >
                  <Download size={14} />
                  PPTX 다운로드
                </button>
              ) : null}
            </div>

            {content ? (
              <div className="p-6 sm:p-7">
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="rounded-lg bg-[#f1f4f8] px-2.5 py-1.5 text-[11px] font-extrabold text-[#687a91]">
                    {selectedAnalysis.projectTitle}
                  </span>
                  <span className="rounded-lg bg-[#f1f4f8] px-2.5 py-1.5 text-[11px] font-extrabold text-[#687a91]">
                    출처 {selectedFormat.source}
                  </span>
                  <span className="rounded-lg bg-[#f1f4f8] px-2.5 py-1.5 text-[11px] font-extrabold text-[#687a91]">
                    {lineCount}줄 · {content.length.toLocaleString("ko-KR")}자
                  </span>
                </div>
                <textarea
                  readOnly
                  value={content}
                  aria-label={`${selectedFormat.label} 미리보기`}
                  className="pf-editor min-h-[580px] p-5 text-[13px] font-medium leading-[1.9]"
                />
                <p className="mt-3 text-[11px] text-[#929eae]">
                  각 생성 페이지에서 수정한 최신 내용이 이 미리보기에 반영됩니다.
                </p>
              </div>
            ) : (
              <div className="grid min-h-[430px] place-items-center px-8 py-14 text-center">
                <div className="max-w-md">
                  <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#eef2f7] text-[#728198]">
                    <selectedFormat.icon size={23} />
                  </span>
                  <h3 className="mt-5 text-[16px] font-black text-[#263853]">
                    {selectedFormat.label}이 아직 준비되지 않았습니다
                  </h3>
                  <p className="mt-2 text-[12px] leading-6 text-[#8996a8]">
                    원본 결과물을 먼저 생성하면 이곳에서 최신 편집본을 확인하고
                    복사할 수 있습니다.
                  </p>
                  <Link
                    href={`${selectedFormat.href}?analysis=${selectedAnalysis.id}`}
                    className="pf-button-primary mt-5"
                  >
                    {selectedFormat.source} 생성하기
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
