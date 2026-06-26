"use client";

import {
  BriefcaseBusiness,
  FileText,
  LayoutTemplate,
  MessageSquareText,
  NotebookTabs,
  Presentation,
  Sparkles,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import {
  AnalysisProjectPicker,
  ArtifactPageHeader,
  ArtifactResultActions,
  NextStepCard,
  NoAnalysisForArtifact,
  SectionGuide,
} from "@/components/artifacts/artifact-workspace";
import { useAnalysisSelection } from "@/hooks/use-analysis-selection";
import { useProofolioWorkspace } from "@/hooks/use-proofolio-workspace";
import { getProjectPortfolioAudit } from "@/lib/analysis/portfolio-output-audit";
import { generatePortfolio } from "@/lib/ai";
import type { PortfolioOutput } from "@/types/proofolio";

type PortfolioFormat = "onePage" | "ppt" | "notion" | "caseStudy";
type EditablePortfolioField =
  | "onePageSummary"
  | "pptCopy"
  | "notionCopy"
  | "caseStudy";

const outputFormats = [
  {
    id: "onePage",
    label: "1페이지 프로젝트 요약",
    description: "핵심 내용만 빠르게 검토할 수 있는 압축형",
    example: "예: 문제 정의, 인사이트, 역할, 결과를 한 화면에 정리",
    icon: LayoutTemplate,
  },
  {
    id: "ppt",
    label: "PPT 슬라이드용 문구",
    description: "슬라이드 순서와 제목에 맞춘 발표 자료형",
    example: "예: 상황 분석 → 타깃 → 전략 → 실행안 순서의 슬라이드 카피",
    icon: Presentation,
  },
  {
    id: "notion",
    label: "Notion용 정리본",
    description: "마크다운 구조로 바로 옮길 수 있는 문서형",
    example: "예: 프로젝트 개요와 근거 자료를 섹션별 문서로 정리",
    icon: NotebookTabs,
  },
  {
    id: "caseStudy",
    label: "상세 케이스 스터디",
    description: "배경부터 역할과 성과까지 연결한 상세형",
    example: "예: 채용 담당자가 읽는 프로젝트 스토리 형태로 확장",
    icon: FileText,
  },
] as const;

const formatFields: Record<PortfolioFormat, EditablePortfolioField> = {
  onePage: "onePageSummary",
  ppt: "pptCopy",
  notion: "notionCopy",
  caseStudy: "caseStudy",
};

const structureLabels = [
  {
    label: "프로젝트명",
    description: "채용 담당자가 프로젝트 성격을 즉시 파악하는 제목입니다.",
  },
  {
    label: "한 줄 요약",
    description: "문제, 행동, 결과를 한 문장으로 압축한 첫인상입니다.",
  },
  {
    label: "문제 정의",
    description: "왜 이 프로젝트가 필요했는지 보여주는 출발점입니다.",
  },
  {
    label: "핵심 인사이트",
    description: "자료를 분석해 도출한 판단 근거와 차별점입니다.",
  },
  {
    label: "전략",
    description: "인사이트를 실행 방향으로 바꾼 의사결정입니다.",
  },
  {
    label: "실행",
    description: "직접 수행한 산출물, 조율, 운영 내용을 보여줍니다.",
  },
  {
    label: "결과",
    description: "성과 수치 또는 검증 가능한 기대효과를 정리합니다.",
  },
  {
    label: "나의 역할",
    description: "팀 활동 속 본인의 직접 기여 범위를 분리합니다.",
  },
  {
    label: "직무 역량",
    description: "지원 직무와 연결되는 키워드를 명확히 남깁니다.",
  },
  {
    label: "핵심 문장",
    description: "PPT, Notion, 면접 답변에 반복 활용할 대표 문장입니다.",
  },
];

function getLegacyCaseStudy(output: PortfolioOutput) {
  return `# ${output.portfolioTitle}

## 프로젝트명
${output.projectTitle}

## 한 줄 요약
${output.summary}

## 문제 정의
${output.problem}

## 핵심 인사이트
${output.insight}

## 전략
${output.strategy}

## 실행
${output.execution}

## 결과
${output.result}

## 나의 역할
${output.role}

## 직무 역량
${output.skills.map((skill) => `- ${skill}`).join("\n")}

## 포트폴리오용 핵심 문장
${output.keyMessage ?? output.summary}`;
}

function getPortfolioContent(
  output: PortfolioOutput | undefined,
  format: PortfolioFormat,
) {
  if (!output) return "";
  if (format === "caseStudy") {
    return output.caseStudy ?? getLegacyCaseStudy(output);
  }
  return output[formatFields[format]] ?? "";
}

function getAuditTone(status: string) {
  if (status === "통과") {
    return "bg-[#e5f6ef] text-[#168765]";
  }
  if (status === "보완 필요") {
    return "bg-[#fff1d8] text-[#a96a0d]";
  }
  return "bg-[#ffe8ec] text-[#c24b5a]";
}

export function PortfolioView({
  initialAnalysisId,
}: {
  initialAnalysisId?: string;
}) {
  const { workspace, setWorkspace } = useProofolioWorkspace();
  const analyses = useMemo(() => workspace.analyses, [workspace.analyses]);
  const { selectedId, selectedAnalysis, selectAnalysis } =
    useAnalysisSelection(analyses, initialAnalysisId);
  const [format, setFormat] = useState<PortfolioFormat>("onePage");
  const [isGenerating, setIsGenerating] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  if (!selectedAnalysis) {
    return <NoAnalysisForArtifact artifactName="포트폴리오" />;
  }

  const output = workspace.portfolioOutputs[selectedAnalysis.id];
  const content = getPortfolioContent(output, format);
  const portfolioAudit = getProjectPortfolioAudit({
    analysis: selectedAnalysis,
    output,
    workspace,
  });
  const selectedFormat =
    outputFormats.find((option) => option.id === format) ?? outputFormats[0];

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const generated = await generatePortfolio(selectedAnalysis, {
        targetRole: workspace.userProfile.targetRole || "마케팅 직무",
        userAnswers: workspace.questionAnswers[selectedAnalysis.id],
      });

      setWorkspace((current) => ({
        ...current,
        portfolioOutputs: {
          ...current.portfolioOutputs,
          [selectedAnalysis.id]: generated,
        },
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const updateContent = (value: string) => {
    const field = formatFields[format];

    setWorkspace((current) => {
      const currentOutput = current.portfolioOutputs[selectedAnalysis.id];
      if (!currentOutput) return current;

      return {
        ...current,
        portfolioOutputs: {
          ...current.portfolioOutputs,
          [selectedAnalysis.id]: {
            ...currentOutput,
            [field]: value,
          },
        },
      };
    });
  };

  return (
    <div className="space-y-7">
      <ArtifactPageHeader
        eyebrow="ANALYSIS TO STORY"
        title="채용 담당자가 이해하는 포트폴리오"
        description="분석 리포트의 문제 정의, 인사이트, 실행과 역할을 하나의 설득력 있는 프로젝트 스토리로 변환합니다."
        icon={BriefcaseBusiness}
        completedCount={analyses.length}
        resultCount={Object.keys(workspace.portfolioOutputs).length}
        resultLabel="생성 완료"
        example="예: 66°North 시장 진입 전략을 문제 정의 → 인사이트 → 실행 → 결과 순서로 정리합니다."
      />

      <section className="grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)]">
        <AnalysisProjectPicker
          analyses={analyses}
          selectedId={selectedId}
          onSelect={selectAnalysis}
          generatedIds={new Set(Object.keys(workspace.portfolioOutputs))}
          generatedLabel="포트폴리오"
        />

        <div className="space-y-5">
          <section className="pf-card overflow-hidden">
            <div className="border-b border-[#e3e9f1] bg-[linear-gradient(135deg,#f8fbff_0%,#eef4ff_100%)] px-6 py-6 sm:px-7">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div>
                  <span className="rounded-full bg-[#2563eb] px-3 py-1.5 text-[9px] font-black text-white">
                    {selectedAnalysis.projectType}
                  </span>
                  <h3 className="mt-4 text-[21px] font-black tracking-[-0.035em] text-[#10213d]">
                    {selectedAnalysis.projectTitle}
                  </h3>
                  <p className="mt-2 max-w-2xl text-[11px] leading-5 text-[#63758c]">
                    {selectedAnalysis.oneLineSummary}
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-xl border border-[#d8e4f5] bg-white px-3 py-2 text-[9px] font-extrabold text-[#3c659a] shadow-sm">
                  <Sparkles size={13} />
                  분석 근거 {selectedAnalysis.competencyTags.length}개 반영
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-7">
              <SectionGuide title="형식 선택 기준">
                <strong>1페이지 요약</strong>은 빠른 검토용, <strong>PPT 문구</strong>는
                발표·제출 덱용, <strong>Notion 정리본</strong>은 웹 포트폴리오용,
                <strong>상세 케이스 스터디</strong>는 면접 전 깊이 있는 설명 준비에 적합합니다.
              </SectionGuide>
              <div>
                <p className="text-[9px] font-black tracking-[0.14em] text-[#7a8ba3]">
                  OUTPUT FORMAT
                </p>
                <h4 className="mt-1.5 text-[14px] font-black text-[#263853]">
                  사용할 포트폴리오 형식을 선택하세요
                </h4>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {outputFormats.map((option) => {
                  const Icon = option.icon;
                  const active = option.id === format;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setFormat(option.id)}
                      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-[#90b0f3] bg-[#eef4ff]"
                          : "border-[#e2e8f0] bg-[#fafbfd] hover:border-[#c6d3e4] hover:bg-white"
                      }`}
                    >
                      <span
                        className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                          active
                            ? "bg-[#2563eb] text-white"
                            : "bg-white text-[#687b94] shadow-sm"
                        }`}
                      >
                        <Icon size={17} />
                      </span>
                      <span>
                        <strong className="block text-[12px] font-extrabold text-[#30425c]">
                          {option.label}
                        </strong>
                        <span className="mt-1 block text-[11px] leading-5 text-[#8b98aa]">
                          {option.description}
                        </span>
                        <span className="mt-2 block text-[10px] leading-5 text-[#6b7c92]">
                          {option.example}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="pf-card overflow-hidden">
            <div className="flex flex-col justify-between gap-4 border-b border-[#e7ecf2] px-6 py-5 sm:flex-row sm:items-center sm:px-7">
              <div>
                <p className="text-[9px] font-black tracking-[0.14em] text-[#2563eb]">
                  GENERATED PORTFOLIO
                </p>
                <h3 className="mt-1.5 text-[15px] font-black text-[#263853]">
                  {selectedFormat.label}
                </h3>
              </div>
              <ArtifactResultActions
                content={content}
                hasResult={Boolean(output)}
                isGenerating={isGenerating}
                onGenerate={handleGenerate}
                onEdit={() => editorRef.current?.focus()}
              />
            </div>

            {output ? (
              <div className="p-6 sm:p-7">
                <section
                  className={`mb-5 rounded-2xl border p-5 ${
                    portfolioAudit.readyForPortfolio
                      ? "border-[#cfe8df] bg-[#f3fbf8]"
                      : portfolioAudit.score >= 68
                        ? "border-[#eadfc5] bg-[#fffbf2]"
                        : "border-[#f1d7dc] bg-[#fff7f8]"
                  }`}
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div>
                      <p className="text-[9px] font-black tracking-[0.14em] text-[#2563eb]">
                        PORTFOLIO QUALITY AUDIT
                      </p>
                      <h4 className="mt-1.5 text-[15px] font-black text-[#263853]">
                        포트폴리오 구조 완성도
                      </h4>
                      <p className="mt-2 text-[12px] leading-6 text-[#68788e]">
                        {portfolioAudit.summary}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-5 py-4 text-center shadow-sm">
                      <strong className="block text-[26px] font-black tracking-[-0.05em] text-[#10213d]">
                        {portfolioAudit.score}
                        <span className="ml-1 text-[12px] text-[#9aa6b7]">
                          /100
                        </span>
                      </strong>
                      <p className="text-[11px] font-black text-[#52657d]">
                        {portfolioAudit.level}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {portfolioAudit.criteria.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-[11px] font-black text-[#40536d]">
                            {item.label}
                          </strong>
                          <span
                            className={`rounded-full px-2 py-1 text-[9px] font-black ${getAuditTone(item.status)}`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="mt-1 text-[14px] font-black text-[#10213d]">
                          {item.score}/100
                        </p>
                        <p className="mt-1 text-[10px] font-semibold leading-5 text-[#7d8da2]">
                          {item.evidence}
                        </p>
                      </div>
                    ))}
                  </div>

                  {portfolioAudit.blockers.length ||
                  portfolioAudit.improvements.length ? (
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      {portfolioAudit.blockers.length ? (
                        <div className="rounded-2xl bg-white p-4 shadow-sm">
                          <strong className="text-[12px] font-black text-[#c24b5a]">
                            반드시 보완
                          </strong>
                          <ul className="mt-2 space-y-1.5 text-[11px] font-semibold leading-5 text-[#8a4a54]">
                            {portfolioAudit.blockers.map((item) => (
                              <li key={item}>- {item}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {portfolioAudit.improvements.length ? (
                        <div className="rounded-2xl bg-white p-4 shadow-sm">
                          <strong className="text-[12px] font-black text-[#2563eb]">
                            권장 보완
                          </strong>
                          <ul className="mt-2 space-y-1.5 text-[11px] font-semibold leading-5 text-[#55739b]">
                            {portfolioAudit.improvements.map((item) => (
                              <li key={item}>- {item}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </section>
                <div className="mb-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                  {structureLabels.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-[#e4eaf2] bg-[#f8fafc] px-3 py-2.5"
                    >
                      <strong className="block text-[11px] font-black text-[#40536d]">
                        {item.label}
                      </strong>
                      <span className="mt-1 block text-[10px] font-semibold leading-4 text-[#7d8da2]">
                        {item.description}
                      </span>
                    </div>
                  ))}
                </div>
                <textarea
                  ref={editorRef}
                  value={content}
                  onChange={(event) => updateContent(event.target.value)}
                  aria-label={`${selectedFormat.label} 편집기`}
                  className="pf-editor min-h-[560px] p-5 text-[13px] font-medium leading-[1.9]"
                />
                <div className="mt-3 flex items-center justify-between text-[11px] text-[#929eae]">
                  <span>내용을 직접 수정하면 브라우저에 자동 저장됩니다.</span>
                  <span>{content.length.toLocaleString("ko-KR")}자</span>
                </div>
              </div>
            ) : (
              <div className="grid min-h-[420px] place-items-center px-6 py-14 text-center">
                <div className="max-w-md">
                  <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#eaf1ff] text-[#2563eb]">
                    <BriefcaseBusiness size={23} />
                  </span>
                  <h4 className="mt-5 text-[16px] font-black text-[#263853]">
                    아직 생성된 포트폴리오가 없습니다
                  </h4>
                  <p className="mt-2 text-[12px] leading-6 text-[#8996a8]">
                    선택한 분석 결과를 바탕으로 네 가지 형식의 문안을 한 번에
                    생성합니다. 생성 후 원하는 형식을 선택해 수정할 수 있습니다.
                  </p>
                </div>
              </div>
            )}
          </section>

          {output && (
            <NextStepCard
              title="전문가 피드백으로 설득력을 점검하세요"
              description="현재 편집한 포트폴리오를 기준으로 역할 선명도, 근거 강도와 전체 흐름을 구체적으로 진단합니다."
              primaryHref={`/feedback?analysis=${selectedAnalysis.id}&target=portfolio`}
              primaryLabel="포트폴리오 피드백 보기"
              primaryIcon={MessageSquareText}
              secondaryHref={`/cover-letter?analysis=${selectedAnalysis.id}`}
              secondaryLabel="자기소개서로 확장"
            />
          )}
        </div>
      </section>
    </div>
  );
}
