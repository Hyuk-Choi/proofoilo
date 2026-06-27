"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  FileOutput,
  FileQuestion,
  FileText,
  Gauge,
  Lightbulb,
  MessageSquareText,
  Quote,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  UserRoundCheck,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  AnalysisProjectPicker,
  ArtifactPageHeader,
  ArtifactResultActions,
  NextStepCard,
  NoAnalysisForArtifact,
} from "@/components/artifacts/artifact-workspace";
import { useAnalysisSelection } from "@/hooks/use-analysis-selection";
import { useProofolioWorkspace } from "@/hooks/use-proofolio-workspace";
import { generateFeedback } from "@/lib/ai";
import type { FeedbackScore } from "@/types/proofolio";

export type FeedbackTarget = "portfolio" | "coverLetter";
type ScoreKey = Exclude<
  keyof FeedbackScore,
  "totalScore" | "comments" | "revisionSuggestions"
>;

const scoreItems: Array<{
  key: ScoreKey;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
}> = [
  {
    key: "jobFit",
    label: "직무 적합성",
    description: "지원 직무에서 요구하는 문제 해결 방식과 프로젝트 경험이 얼마나 맞물리는지 평가합니다.",
    icon: Target,
    color: "#2563eb",
  },
  {
    key: "problemClarity",
    label: "문제 정의 명확성",
    description: "무엇을 해결하려 했고 왜 중요한 문제였는지 채용 담당자가 즉시 이해할 수 있는지 봅니다.",
    icon: Lightbulb,
    color: "#7157d9",
  },
  {
    key: "roleClarity",
    label: "본인 역할 선명도",
    description: "팀 성과와 본인의 직접 기여가 분리되어 보이는지 확인합니다.",
    icon: UserRoundCheck,
    color: "#15966f",
  },
  {
    key: "evidenceStrength",
    label: "수치/근거 활용도",
    description: "성과, 비교 기준, 자료 출처 등 주장을 뒷받침하는 근거가 충분한지 평가합니다.",
    icon: BarChart3,
    color: "#d58a18",
  },
  {
    key: "differentiation",
    label: "차별화 포인트",
    description: "다른 지원자와 구분되는 관찰, 판단, 실행 방식이 드러나는지 봅니다.",
    icon: Sparkles,
    color: "#d05d8c",
  },
  {
    key: "writingPersuasiveness",
    label: "문장 설득력",
    description: "문장이 추상적이지 않고 행동과 결과 중심으로 읽히는지 평가합니다.",
    icon: MessageSquareText,
    color: "#287c9e",
  },
  {
    key: "portfolioFlow",
    label: "포트폴리오 흐름",
    description: "배경, 문제, 인사이트, 실행, 결과가 자연스러운 순서로 이어지는지 확인합니다.",
    icon: Scale,
    color: "#52657d",
  },
];

function getFeedbackKey(analysisId: string, target: FeedbackTarget) {
  return target === "coverLetter"
    ? `${analysisId}:coverLetter`
    : analysisId;
}

function buildFeedbackCopy(
  feedback: FeedbackScore,
  projectTitle: string,
  targetLabel: string,
) {
  return [
    `${projectTitle} | ${targetLabel} 전문가 피드백`,
    `총점: ${(feedback.totalScore / 10).toFixed(1)} / 10`,
    "",
    ...scoreItems.flatMap((item, index) => [
      `[${item.label}] ${(feedback[item.key] / 10).toFixed(1)} / 10`,
      feedback.comments[index + 1] ?? feedback.comments[index] ?? "",
      "",
    ]),
    "수정 제안",
    ...feedback.revisionSuggestions.map(
      (suggestion, index) => `${index + 1}. ${suggestion}`,
    ),
  ].join("\n");
}

export function FeedbackView({
  initialAnalysisId,
  initialTarget,
}: {
  initialAnalysisId?: string;
  initialTarget?: FeedbackTarget;
}) {
  const { workspace, setWorkspace } = useProofolioWorkspace();
  const analyses = useMemo(() => workspace.analyses, [workspace.analyses]);
  const { selectedId, selectedAnalysis, selectAnalysis } =
    useAnalysisSelection(analyses, initialAnalysisId);
  const [target, setTarget] = useState<FeedbackTarget>(
    initialTarget === "coverLetter" ? "coverLetter" : "portfolio",
  );
  const [isGenerating, setIsGenerating] = useState(false);

  if (!selectedAnalysis) {
    return <NoAnalysisForArtifact artifactName="전문가 피드백" />;
  }

  const portfolio = workspace.portfolioOutputs[selectedAnalysis.id];
  const coverLetter = workspace.coverLetterOutputs[selectedAnalysis.id];
  const feedbackKey = getFeedbackKey(selectedAnalysis.id, target);
  const feedback = workspace.feedbackScores[feedbackKey];
  const priorityScoreItem = feedback
    ? scoreItems.reduce((lowest, item) =>
        feedback[item.key] < feedback[lowest.key] ? item : lowest,
      )
    : undefined;
  const targetLabel =
    target === "coverLetter" ? "자기소개서" : "프로젝트/포트폴리오";
  const copyContent = feedback
    ? buildFeedbackCopy(
        feedback,
        selectedAnalysis.projectTitle,
        targetLabel,
      )
    : "";
  const generatedAnalysisIds = new Set(
    analyses
      .filter(
        (analysis) =>
          workspace.feedbackScores[analysis.id] ||
          workspace.feedbackScores[`${analysis.id}:coverLetter`],
      )
      .map((analysis) => analysis.id),
  );

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const generated = await generateFeedback(
        selectedAnalysis,
        target === "portfolio" ? portfolio : undefined,
        target === "coverLetter" ? coverLetter : undefined,
        workspace.questionAnswers[selectedAnalysis.id],
        workspace,
      );

      setWorkspace((current) => ({
        ...current,
        feedbackScores: {
          ...current.feedbackScores,
          [feedbackKey]: generated,
        },
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-7">
      <ArtifactPageHeader
        eyebrow="EXPERT REVIEW"
        title="전문 컨설턴트 피드백"
        description="진단, 평가 영향과 우선 권고안의 구조로 직무 적합성, 근거 강도, 역할 표현과 문장 흐름을 구체적으로 평가합니다."
        icon={MessageSquareText}
        completedCount={analyses.length}
        resultCount={Object.keys(workspace.feedbackScores).length}
        resultLabel="리뷰 완료"
        example="예: ‘시장 분석을 했다’를 ‘경쟁 브랜드와 검색 흐름을 비교해 타깃 구매 고려 요인을 도출했다’로 고칩니다."
      />

      <section className="grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)]">
        <AnalysisProjectPicker
          analyses={analyses}
          selectedId={selectedId}
          onSelect={selectAnalysis}
          generatedIds={generatedAnalysisIds}
          generatedLabel="피드백"
        />

        <div className="space-y-5">
          <section className="pf-card p-6 sm:p-7">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <p className="text-[10px] font-black tracking-[0.14em] text-[#2563eb]">
                  REVIEW TARGET
                </p>
                <h3 className="mt-1.5 text-[16px] font-black text-[#263853]">
                  평가할 결과물을 선택하세요
                </h3>
                <p className="mt-1.5 text-[12px] leading-6 text-[#8996a8]">
                  같은 프로젝트라도 포트폴리오 구조와 자기소개서 문장은 서로
                  다른 기준으로 진단합니다.
                </p>
              </div>
              <ArtifactResultActions
                content={copyContent}
                hasResult={Boolean(feedback)}
                isGenerating={isGenerating}
                onGenerate={handleGenerate}
              />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setTarget("portfolio")}
                className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                  target === "portfolio"
                    ? "border-[#90b0f3] bg-[#eef4ff]"
                    : "border-[#e3e8ef] bg-[#fafbfd] hover:border-[#c8d4e5]"
                }`}
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                    target === "portfolio"
                      ? "bg-[#2563eb] text-white"
                      : "bg-white text-[#687b94] shadow-sm"
                  }`}
                >
                  <BriefcaseBusiness size={17} />
                </span>
                <span>
                  <strong className="block text-[12px] font-extrabold text-[#30425c]">
                    프로젝트/포트폴리오
                  </strong>
                  <span className="mt-1 block text-[11px] leading-5 text-[#8b98aa]">
                    문제 정의, 역할, 근거와 케이스 스터디 흐름 평가
                  </span>
                  <span className="mt-2 block text-[10px] leading-5 text-[#6b7c92]">
                    예: 포트폴리오 흐름에서 내 역할과 근거가 충분한지 점검
                  </span>
                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-extrabold text-[#168765]">
                    <CheckCircle2 size={10} />
                    {portfolio ? "포트폴리오 반영" : "분석 리포트 기준"}
                  </span>
                </span>
              </button>

              <button
                type="button"
                disabled={!coverLetter}
                onClick={() => setTarget("coverLetter")}
                className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-55 ${
                  target === "coverLetter"
                    ? "border-[#90b0f3] bg-[#eef4ff]"
                    : "border-[#e3e8ef] bg-[#fafbfd] hover:border-[#c8d4e5]"
                }`}
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                    target === "coverLetter"
                      ? "bg-[#2563eb] text-white"
                      : "bg-white text-[#687b94] shadow-sm"
                  }`}
                >
                  <FileText size={17} />
                </span>
                <span>
                  <strong className="block text-[12px] font-extrabold text-[#30425c]">
                    생성된 자기소개서
                  </strong>
                  <span className="mt-1 block text-[11px] leading-5 text-[#8b98aa]">
                    항목별 경험 연결과 문장 설득력 중심 평가
                  </span>
                  <span className="mt-2 block text-[10px] leading-5 text-[#6b7c92]">
                    예: 직무역량 항목이 실제 프로젝트 행동으로 증명되는지 평가
                  </span>
                  <span className="mt-2 block text-[10px] font-extrabold text-[#7a8ba3]">
                    {coverLetter ? "평가 가능" : "자기소개서 생성 필요"}
                  </span>
                </span>
              </button>
            </div>
          </section>

          {feedback ? (
            <>
              <section className="pf-card overflow-hidden">
                <div className="grid bg-[#10213d] text-white lg:grid-cols-[260px_minmax(0,1fr)]">
                  <div className="grid place-items-center border-b border-white/10 p-7 lg:border-b-0 lg:border-r">
                    <div className="text-center">
                      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white/10 text-[#8eb5ff]">
                        <Gauge size={22} />
                      </span>
                      <p className="mt-4 text-[10px] font-black tracking-[0.15em] text-[#8eb5ff]">
                        TOTAL SCORE
                      </p>
                      <strong className="mt-2 block text-[44px] font-black tracking-[-0.06em]">
                        {(feedback.totalScore / 10).toFixed(1)}
                        <span className="ml-1 text-[14px] text-white/45">
                          / 10
                        </span>
                      </strong>
                      <p className="mt-2 text-[11px] text-white/50">
                        {targetLabel} 종합 평가
                      </p>
                    </div>
                  </div>
                  <div className="p-6 sm:p-7">
                    <p className="text-[10px] font-black tracking-[0.14em] text-[#8eb5ff]">
                      EXPERT SUMMARY
                    </p>
                    <h3 className="mt-2 text-[17px] font-black">
                      우선 개선 과제: {priorityScoreItem?.label ?? "근거와 기여도"}
                    </h3>
                    <p className="mt-3 max-w-3xl text-[13px] leading-[1.9] text-white/70">
                      {feedback.comments[0]}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {selectedAnalysis.competencyTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-extrabold text-white/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 p-6 sm:p-7 lg:grid-cols-2">
                  {scoreItems.map((item, index) => {
                    const Icon = item.icon;
                    const score = feedback[item.key];
                    return (
                      <article
                        key={item.key}
                        className="rounded-2xl border border-[#e3e9f0] bg-[#fbfcfe] p-5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 place-items-center rounded-xl bg-white shadow-sm">
                              <Icon size={15} style={{ color: item.color }} />
                            </span>
                            <h4 className="text-[12px] font-black text-[#40536d]">
                              {item.label}
                            </h4>
                          </div>
                          <strong className="text-[15px] font-black text-[#263853]">
                            {(score / 10).toFixed(1)}
                            <span className="text-[11px] text-[#98a3b2]">
                              /10
                            </span>
                          </strong>
                        </div>
                        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#e8edf3]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${score}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                        <p className="mt-4 text-[12px] leading-[1.8] text-[#6e7f94]">
                          {feedback.comments[index + 1] ??
                            feedback.comments[index] ??
                            "평가 기준에 맞춘 추가 코멘트를 확인해 주세요."}
                        </p>
                        <p className="mt-3 rounded-xl bg-white px-3 py-2 text-[11px] font-semibold leading-5 text-[#7d8da2] shadow-sm">
                          평가 기준: {item.description}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                <div className="pf-card p-6 sm:p-7">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-[#eaf1ff] text-[#2563eb]">
                      <Quote size={17} />
                    </span>
                    <div>
                      <h3 className="text-[13px] font-black text-[#30425c]">
                        수정 제안 문장
                      </h3>
                      <p className="mt-1 text-[11px] text-[#919dae]">
                        추상 표현을 행동과 결과가 보이는 문장으로 바꿉니다.
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {feedback.revisionSuggestions.map((suggestion, index) => (
                      <div
                        key={suggestion}
                        className="rounded-2xl border border-[#e4e9f0] bg-[#fafbfd] p-4"
                      >
                        <span className="text-[10px] font-black tracking-[0.12em] text-[#2563eb]">
                          REVISION {String(index + 1).padStart(2, "0")}
                        </span>
                        <p className="mt-2 whitespace-pre-line text-[12px] leading-[1.85] text-[#5c6e85]">
                          {suggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-[#eadfc5] bg-[#fffbf2] p-6 sm:p-7">
                  <div className="flex items-center justify-between">
                    <span className="grid size-10 place-items-center rounded-xl bg-white text-[#c77b0d] shadow-sm">
                      <FileQuestion size={17} />
                    </span>
                    <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-extrabold text-[#a96a0d]">
                      {selectedAnalysis.missingQuestions.length}개
                    </span>
                  </div>
                  <h3 className="mt-4 text-[13px] font-black text-[#7c551a]">
                    보완 필요 질문
                  </h3>
                  <p className="mt-1 text-[11px] leading-5 text-[#9a7b4b]">
                    아래 답변을 수치와 출처까지 구체화하면 점수를 높일 수 있습니다.
                  </p>
                  <div className="mt-4 space-y-3">
                    {selectedAnalysis.missingQuestions.map((question) => {
                      const answer =
                        workspace.questionAnswers[selectedAnalysis.id]?.[
                          question
                        ];
                      return (
                        <div
                          key={question}
                          className="rounded-2xl border border-[#eadfc5] bg-white/70 p-4"
                        >
                          <p className="text-[11px] font-bold leading-5 text-[#715e40]">
                            {question}
                          </p>
                          {answer && (
                            <p className="mt-2 border-t border-[#eee3cd] pt-2 text-[10px] leading-5 text-[#9a8057]">
                              현재 답변: {answer}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </>
          ) : (
            <section className="grid min-h-[430px] place-items-center rounded-3xl border border-dashed border-[#cfd9e8] bg-white px-8 py-14 text-center">
              <div className="max-w-md">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#eaf1ff] text-[#2563eb]">
                  <ShieldCheck size={24} />
                </span>
                <h3 className="mt-5 text-[16px] font-black text-[#263853]">
                  {targetLabel} 피드백을 생성하세요
                </h3>
                <p className="mt-2 text-[12px] leading-6 text-[#8996a8]">
                  일곱 가지 채용 평가 기준과 수정 제안, 보완 질문을 전문가
                  첨삭 형식으로 제공합니다.
                </p>
                {!coverLetter && target === "portfolio" && (
                  <Link
                    href={`/cover-letter?analysis=${selectedAnalysis.id}`}
                    className="mt-4 inline-flex text-[11px] font-extrabold text-[#2563eb]"
                  >
                    자기소개서도 먼저 생성하기
                  </Link>
                )}
              </div>
            </section>
          )}

          {feedback && (
            <NextStepCard
              title="검토한 결과물을 면접 준비와 최종 출력으로 연결하세요"
              description="피드백에서 확인한 강점과 보완점을 반영한 뒤, 같은 프로젝트의 면접 질문을 준비하거나 최신 결과물을 Export에서 정리할 수 있습니다."
              primaryHref={`/export?analysis=${selectedAnalysis.id}`}
              primaryLabel="Export로 이동"
              primaryIcon={FileOutput}
              secondaryHref={`/interview?analysis=${selectedAnalysis.id}`}
              secondaryLabel="면접 질문 준비"
            />
          )}
        </div>
      </section>
    </div>
  );
}
