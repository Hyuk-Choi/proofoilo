"use client";

import {
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  KeyRound,
  MessageSquareText,
  Sparkles,
  Target,
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
import { generateResumeBullets } from "@/lib/ai";

export function ResumeView({
  initialAnalysisId,
}: {
  initialAnalysisId?: string;
}) {
  const { workspace, setWorkspace } = useProofolioWorkspace();
  const analyses = useMemo(() => workspace.analyses, [workspace.analyses]);
  const { selectedId, selectedAnalysis, selectAnalysis } =
    useAnalysisSelection(analyses, initialAnalysisId);
  const [isGenerating, setIsGenerating] = useState(false);
  const firstBulletRef = useRef<HTMLTextAreaElement>(null);

  if (!selectedAnalysis) {
    return <NoAnalysisForArtifact artifactName="이력서 문장" />;
  }

  const output = workspace.resumeBullets[selectedAnalysis.id];
  const visibleBullets = (output ?? [])
    .flatMap((group, groupIndex) =>
      group.bullets.map((bullet, bulletIndex) => ({
        bullet,
        groupIndex,
        bulletIndex,
      })),
    )
    .slice(0, 5);
  const keywords = Array.from(
    new Set((output ?? []).flatMap((group) => group.keywords)),
  ).slice(0, 10);
  const copyContent = output
    ? [
        output[0]?.title ?? selectedAnalysis.projectTitle,
        ...visibleBullets.map(({ bullet }) => `- ${bullet}`),
        "",
        `핵심 키워드: ${keywords.join(", ")}`,
      ].join("\n")
    : "";

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const generated = await generateResumeBullets(
        selectedAnalysis,
        workspace,
      );

      setWorkspace((current) => ({
        ...current,
        resumeBullets: {
          ...current.resumeBullets,
          [selectedAnalysis.id]: generated,
        },
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const updateBullet = (
    groupIndex: number,
    bulletIndex: number,
    value: string,
  ) => {
    setWorkspace((current) => {
      const currentOutput = current.resumeBullets[selectedAnalysis.id];
      if (!currentOutput) return current;

      return {
        ...current,
        resumeBullets: {
          ...current.resumeBullets,
          [selectedAnalysis.id]: currentOutput.map((group, index) => {
            if (index !== groupIndex) return group;
            return {
              ...group,
              bullets: group.bullets.map((bullet, currentBulletIndex) =>
                currentBulletIndex === bulletIndex ? value : bullet,
              ),
            };
          }),
        },
      };
    });
  };

  return (
    <div className="space-y-7">
      <ArtifactPageHeader
        eyebrow="EXPERIENCE TO IMPACT"
        title="성과 중심의 이력서 문장을 완성하세요"
        description="분석된 프로젝트의 문제, 행동, 결과와 기여도를 채용 담당자가 빠르게 읽을 수 있는 불릿 문장으로 압축합니다."
        icon={ClipboardCheck}
        completedCount={analyses.length}
        resultCount={Object.keys(workspace.resumeBullets).length}
        resultLabel="정리 완료"
        example="예: 시장 조사 경험을 ‘경쟁 구도 분석 및 포지셔닝 전략 수립’ 불릿으로 압축합니다."
      />

      <section className="grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)]">
        <AnalysisProjectPicker
          analyses={analyses}
          selectedId={selectedId}
          onSelect={selectAnalysis}
          generatedIds={new Set(Object.keys(workspace.resumeBullets))}
          generatedLabel="이력서"
        />

        <div className="space-y-5">
          <section className="pf-card overflow-hidden">
            <div className="border-b border-[#e3e9f1] bg-[linear-gradient(135deg,#f8fbff_0%,#eef4ff_100%)] px-6 py-6 sm:px-7">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div>
                  <span className="rounded-full bg-[#2563eb] px-3 py-1.5 text-[11px] font-black text-white">
                    {selectedAnalysis.projectType}
                  </span>
                  <h3 className="mt-4 text-[21px] font-black tracking-[-0.035em] text-[#10213d]">
                    {selectedAnalysis.projectTitle}
                  </h3>
                  <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#63758c]">
                    {selectedAnalysis.oneLineSummary}
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-xl border border-[#d8e4f5] bg-white px-3 py-2 text-[11px] font-extrabold text-[#3c659a] shadow-sm">
                  <Sparkles size={13} />
                  3~5개 성과 불릿 생성
                </span>
              </div>
            </div>

            <div className="grid gap-3 p-6 sm:grid-cols-3 sm:p-7">
              {[
                {
                  icon: Target,
                  title: "문제 정의",
                  description: "무엇을 해결했는지 명확하게",
                },
                {
                  icon: CheckCircle2,
                  title: "행동과 기여",
                  description: "직접 수행한 역할을 구체적으로",
                },
                {
                  icon: BarChart3,
                  title: "결과와 영향",
                  description: "성과 또는 기대효과를 근거로",
                },
              ].map((guide) => {
                const Icon = guide.icon;
                return (
                  <div
                    key={guide.title}
                    className="rounded-2xl border border-[#e4e9f0] bg-[#fafbfd] p-4"
                  >
                    <span className="grid size-9 place-items-center rounded-xl bg-white text-[#2563eb] shadow-sm">
                      <Icon size={15} />
                    </span>
                    <strong className="mt-3 block text-[12px] font-extrabold text-[#40536d]">
                      {guide.title}
                    </strong>
                    <p className="mt-1 text-[11px] leading-5 text-[#8f9bab]">
                      {guide.description}
                    </p>
                    <p className="mt-2 text-[10px] leading-5 text-[#66758c]">
                      예: {guide.title === "문제 정의"
                        ? "핵심 타깃의 구매 장벽을 정의"
                        : guide.title === "행동과 기여"
                          ? "자료 비교 기준을 세우고 메시지 방향 제안"
                          : "포트폴리오에서 검증 가능한 영향으로 표현"}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <SectionGuide title="이력서 문장 점검 기준">
            좋은 불릿은 <strong>무엇을 분석했는지</strong>,
            <strong>어떤 판단을 내렸는지</strong>, <strong>어떤 산출물 또는
            효과로 이어졌는지</strong>가 한 문장 안에서 보입니다. 수치가 없을
            때는 기대효과와 검증 과제를 분리해 쓰는 것이 안전합니다.
          </SectionGuide>

          <section className="pf-card overflow-hidden">
            <div className="flex flex-col justify-between gap-4 border-b border-[#e7ecf2] px-6 py-5 sm:flex-row sm:items-center sm:px-7">
              <div>
                <p className="text-[10px] font-black tracking-[0.14em] text-[#2563eb]">
                  GENERATED RESUME BULLETS
                </p>
                <h3 className="mt-1.5 text-[15px] font-black text-[#263853]">
                  프로젝트 경험 · 이력서용 문장
                </h3>
              </div>
              <ArtifactResultActions
                content={copyContent}
                hasResult={Boolean(output)}
                isGenerating={isGenerating}
                onGenerate={handleGenerate}
                onEdit={() => firstBulletRef.current?.focus()}
              />
            </div>

            {output ? (
              <div className="p-6 sm:p-7">
                <div className="rounded-2xl border border-[#dfe6ef] bg-[#fbfcfe] p-5">
                  <div className="flex flex-col justify-between gap-2 border-b border-[#e7ecf2] pb-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-[10px] font-black tracking-[0.13em] text-[#8a98aa]">
                        PROJECT EXPERIENCE
                      </p>
                      <h4 className="mt-1.5 text-[13px] font-black text-[#30425c]">
                        {output[0]?.title ?? selectedAnalysis.projectTitle}
                      </h4>
                    </div>
                    <span className="w-fit rounded-full bg-[#e8f7f1] px-3 py-1.5 text-[11px] font-extrabold text-[#168765]">
                      {visibleBullets.length}개 문장
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {visibleBullets.map(
                      ({ bullet, groupIndex, bulletIndex }, index) => (
                        <div
                          key={`${groupIndex}-${bulletIndex}`}
                          className="grid gap-3 rounded-2xl border border-[#e4e9f0] bg-white p-4 sm:grid-cols-[32px_minmax(0,1fr)]"
                        >
                          <span className="grid size-8 place-items-center rounded-lg bg-[#eaf1ff] text-[11px] font-black text-[#2563eb]">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div className="rounded-xl bg-[#f8fbff] px-3 py-2 text-[11px] font-semibold leading-5 text-[#61728a] sm:col-start-2">
                            이 문장은 이력서에서 바로 읽히는 성과 문장입니다. 행동
                            동사, 분석 대상, 결과 또는 영향이 드러나는지 확인하세요.
                          </div>
                          <textarea
                            ref={index === 0 ? firstBulletRef : undefined}
                            value={bullet}
                            onChange={(event) =>
                              updateBullet(
                                groupIndex,
                                bulletIndex,
                                event.target.value,
                              )
                            }
                            aria-label={`이력서 문장 ${index + 1}`}
                            rows={3}
                            className="w-full resize-y border-0 bg-transparent text-[13px] font-semibold leading-[1.85] text-[#43566f] outline-none sm:col-start-2"
                          />
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-[#e4e9f0] bg-white p-5">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-xl bg-[#f0edff] text-[#7157d9]">
                      <KeyRound size={14} />
                    </span>
                    <div>
                      <h4 className="text-[12px] font-black text-[#40536d]">
                        핵심 키워드
                      </h4>
                      <p className="mt-0.5 text-[11px] text-[#929eae]">
                        이력서의 역량 및 스킬 영역에 활용할 수 있습니다.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full border border-[#ddd7fa] bg-[#f6f4ff] px-3 py-1.5 text-[11px] font-extrabold text-[#6552bd]"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="mt-3 text-[11px] text-[#929eae]">
                  문장을 직접 수정하면 브라우저에 자동 저장됩니다.
                </p>
              </div>
            ) : (
              <div className="grid min-h-[420px] place-items-center px-6 py-14 text-center">
                <div className="max-w-md">
                  <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#eaf1ff] text-[#2563eb]">
                    <ClipboardCheck size={23} />
                  </span>
                  <h4 className="mt-5 text-[16px] font-black text-[#263853]">
                    아직 생성된 이력서 문장이 없습니다
                  </h4>
                  <p className="mt-2 text-[12px] leading-6 text-[#8996a8]">
                    선택한 프로젝트의 문제, 행동, 결과와 역할을 3~5개의 짧고
                    구체적인 불릿 문장으로 변환합니다.
                  </p>
                </div>
              </div>
            )}
          </section>

          {output && (
            <NextStepCard
              title="이력서 문장의 근거와 기여도를 다시 확인하세요"
              description="프로젝트 설명과 본인의 직접 기여가 분리되어 보이는지 피드백에서 점검하고 면접 답변까지 연결할 수 있습니다."
              primaryHref={`/feedback?analysis=${selectedAnalysis.id}&target=portfolio`}
              primaryLabel="전문가 피드백 보기"
              primaryIcon={MessageSquareText}
              secondaryHref={`/interview?analysis=${selectedAnalysis.id}`}
              secondaryLabel="면접 질문 준비"
            />
          )}
        </div>
      </section>
    </div>
  );
}
