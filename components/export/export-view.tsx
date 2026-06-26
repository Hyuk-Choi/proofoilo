"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
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
  SectionGuide,
} from "@/components/artifacts/artifact-workspace";
import { useAnalysisSelection } from "@/hooks/use-analysis-selection";
import { useProofolioWorkspace } from "@/hooks/use-proofolio-workspace";
import { getWorkspaceFinalReadiness } from "@/lib/analysis/evidence-audit";
import { getFinalPortfolioAudit } from "@/lib/analysis/final-output-audit";
import { getWorkspacePortfolioAudit } from "@/lib/analysis/portfolio-output-audit";
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
    label: "최종 포트폴리오 PPTX",
    description: "모든 분석 내용과 입력 경험을 지원 직무 방향에 맞춘 완성형 포트폴리오 덱으로 묶기",
    example: "예: 직무 맞춤 방향, 핵심 역량, 프로젝트 케이스, 전체 분석 요약, 전문가 진단, 최종 포트폴리오 문장으로 구성",
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
  const [format, setFormat] = useState<ExportFormat>("portfolioDeck");

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
  const readiness = getWorkspaceFinalReadiness(workspace);
  const finalAudit = getFinalPortfolioAudit(workspace);
  const portfolioAudit = getWorkspacePortfolioAudit(workspace);
  const averageAccuracy = readiness.projectAudits.length
    ? Math.round(
        readiness.projectAudits.reduce(
          (total, audit) => total + audit.accuracy.score,
          0,
        ) / readiness.projectAudits.length,
      )
    : 0;
  const directEvidenceItems = readiness.projectAudits.reduce(
    (total, audit) => total + audit.accuracy.directEvidenceItems,
    0,
  );
  const verifiedClaims = readiness.projectAudits.reduce(
    (total, audit) => total + audit.accuracy.verifiedClaims,
    0,
  );
  const totalClaims = readiness.projectAudits.reduce(
    (total, audit) => total + audit.accuracy.totalClaims,
    0,
  );
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
        title="최종 포트폴리오 PPT 완성본을 내보내세요"
        description="분석된 파일, 직접 입력한 경험, 포트폴리오 문장과 전문가 피드백을 지원 직무 방향에 맞춰 하나의 읽기 쉬운 PPTX 덱으로 정리합니다. 최종 파일에는 프로젝트별 분석 내용, 첨부 검토, 항목별 정밀 분석, 전문가 진단과 최종 포트폴리오 문장이 포함됩니다."
        icon={FileOutput}
        completedCount={analyses.length}
        resultCount={totalExportCount}
        resultLabel="내보내기 가능"
        example="예: 브랜드 마케터 지원이면 시장 이해, 포지셔닝, 고객 인사이트가 먼저 보이고, 퍼포먼스 마케터 지원이면 타깃·지표·개선안이 먼저 보이도록 구성합니다."
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
          <section
            className={`pf-card overflow-hidden border ${
              finalAudit.readyForSubmission
                ? "border-[#cfe8df]"
                : "border-[#eadfc5]"
            }`}
          >
            <div
              className={`grid gap-5 p-6 sm:p-7 lg:grid-cols-[220px_minmax(0,1fr)] ${
                finalAudit.readyForSubmission
                  ? "bg-[#f3fbf8]"
                  : "bg-[#fffbf2]"
              }`}
            >
              <div className="flex items-center gap-4 lg:block">
                <span
                  className={`grid size-12 place-items-center rounded-2xl ${
                    finalAudit.readyForSubmission
                      ? "bg-white text-[#15966f]"
                      : "bg-white text-[#c77b0d]"
                  } shadow-sm`}
                >
                  {finalAudit.readyForSubmission ? (
                    <CheckCircle2 size={22} />
                  ) : (
                    <AlertTriangle size={22} />
                  )}
                </span>
                <div className="lg:mt-4">
                  <p className="text-[10px] font-black tracking-[0.14em] text-[#2563eb]">
                    FINAL READINESS
                  </p>
                  <strong className="mt-1 block text-[30px] font-black tracking-[-0.05em] text-[#10213d]">
                    {finalAudit.score}
                    <span className="ml-1 text-[13px] text-[#7d8da2]">
                      /100
                    </span>
                  </strong>
                  <p className="mt-1 text-[12px] font-extrabold text-[#52657d]">
                    {finalAudit.level} ·{" "}
                    {finalAudit.readyForSubmission
                      ? "최종 제출 가능"
                      : "보완 후 제출 권장"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-[16px] font-black text-[#263853]">
                  최종본 다운로드 전 QA 기준을 확인하세요
                </h3>
                <p className="mt-2 text-[12px] leading-6 text-[#68788e]">
                  {finalAudit.executiveSummary}
                </p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {[
                    {
                      label: "포트폴리오 품질",
                      value: `${portfolioAudit.score}/100`,
                      description:
                        "문제-인사이트-전략-실행-역할-결과 구조가 채용 포트폴리오로 읽히는지 평가합니다.",
                    },
                    {
                      label: "평균 정확도",
                      value: `${averageAccuracy}/100`,
                      description:
                        "프로젝트별 핵심 주장이 원문/정량 근거와 얼마나 연결됐는지 보여줍니다.",
                    },
                    {
                      label: "직접 근거",
                      value: `${directEvidenceItems}개`,
                      description:
                        "첨부 텍스트 미리보기에서 직접 확인한 근거 항목입니다.",
                    },
                    {
                      label: "검증된 주장",
                      value: `${verifiedClaims}/${totalClaims}`,
                      description:
                        "최종본에 확정 표현으로 쓰기 쉬운 주장 비율입니다.",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/80 bg-white/75 p-3 shadow-sm"
                    >
                      <strong className="text-[12px] font-black text-[#40536d]">
                        {item.label}
                      </strong>
                      <p className="mt-1 text-[15px] font-black text-[#10213d]">
                        {item.value}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold leading-5 text-[#7d8da2]">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {finalAudit.criteria.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/80 bg-white/75 p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-[12px] font-black text-[#40536d]">
                          {item.label}
                        </strong>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-black ${
                            item.status === "통과"
                              ? "bg-[#e5f6ef] text-[#168765]"
                              : item.status === "보완 필요"
                                ? "bg-[#fff1d8] text-[#a96a0d]"
                                : "bg-[#ffe8ec] text-[#c24b5a]"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-1 text-[15px] font-black text-[#10213d]">
                        {item.score}/100
                      </p>
                      <p className="mt-1 text-[11px] font-semibold leading-5 text-[#7d8da2]">
                        {item.evidence}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {readiness.checklist.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/80 bg-white/75 p-3 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2 rounded-full ${
                            item.done ? "bg-[#15966f]" : "bg-[#c77b0d]"
                          }`}
                        />
                        <strong className="text-[12px] font-black text-[#40536d]">
                          {item.label}
                        </strong>
                      </div>
                      <p className="mt-1 text-[11px] font-semibold leading-5 text-[#7d8da2]">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>

                {finalAudit.blockers.length || finalAudit.improvements.length ? (
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {finalAudit.blockers.length ? (
                      <div className="rounded-2xl border border-[#f0dfc2] bg-white p-4">
                        <strong className="text-[12px] font-black text-[#a96a0d]">
                          우선 보완 필요
                        </strong>
                        <ul className="mt-2 space-y-1.5 text-[11px] font-semibold leading-5 text-[#806b4e]">
                          {finalAudit.blockers.map((blocker) => (
                            <li key={blocker}>- {blocker}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {finalAudit.improvements.length ? (
                      <div className="rounded-2xl border border-[#dbe7f8] bg-white p-4">
                        <strong className="text-[12px] font-black text-[#2563eb]">
                          권장 보완
                        </strong>
                        <ul className="mt-2 space-y-1.5 text-[11px] font-semibold leading-5 text-[#55739b]">
                          {finalAudit.improvements.map((warning) => (
                            <li key={warning}>- {warning}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="pf-card p-6 sm:p-7">
            <div>
              <p className="text-[10px] font-black tracking-[0.14em] text-[#2563eb]">
                EXPORT FORMAT
              </p>
              <h3 className="mt-1.5 text-[16px] font-black text-[#263853]">
                출력할 결과물 형식을 선택하세요
              </h3>
              <p className="mt-1.5 text-[12px] leading-6 text-[#8996a8]">
                기본 선택은 최종 포트폴리오 PPTX입니다. 텍스트 미리보기로
                지원 직무 맞춤 흐름과 모든 분석 반영 여부를 확인한 뒤 PPTX
                파일을 다운로드하세요. 실제 OpenAI API는 아직 연결하지 않고
                mock provider로 컨설턴트 수준의 구조를 만듭니다.
              </p>
            </div>

            <div className="mt-5">
              <SectionGuide title="출력 형식 선택 기준">
                <strong>최종 포트폴리오 PPTX</strong>는 제출·공유용 완성본,
                <strong>Notion/PDF/PPT 텍스트</strong>는 다른 도구로 옮길 원고,
                <strong>자기소개서·이력서·면접 자료</strong>는 지원서와 면접
                준비용으로 사용합니다.
              </SectionGuide>
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
                      <span className="mt-2 block rounded-xl bg-white px-3 py-2 text-[10px] font-semibold leading-5 text-[#66758c] shadow-sm">
                        사용처: {option.source}에서 생성하거나 수정한 최신 내용이 반영됩니다.
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
                  className={`h-10 px-4 ${
                    finalAudit.readyForSubmission
                      ? "pf-button-primary"
                      : "pf-button-secondary"
                  }`}
                >
                  <Download size={14} />
                  {finalAudit.readyForSubmission
                    ? "최종 PPTX 다운로드"
                    : "보완 필요 PPTX 다운로드"}
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
