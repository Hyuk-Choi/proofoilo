"use client";

import {
  CornerDownRight,
  FileOutput,
  Lightbulb,
  MessageCircleQuestion,
  Shield,
  UserRoundSearch,
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
import { generateInterviewQuestions } from "@/lib/ai";
import type { InterviewQuestion } from "@/types/proofolio";

function buildInterviewCopy(
  projectTitle: string,
  questions: InterviewQuestion[],
) {
  return [
    `${projectTitle} | 면접 준비 자료`,
    "",
    ...questions.flatMap((question, index) => [
      `Q${index + 1}. ${question.question}`,
      ...question.followUpQuestions.map(
        (followUp, followUpIndex) =>
          `  꼬리질문 ${followUpIndex + 1}. ${followUp}`,
      ),
      "",
      `답변 가이드: ${question.answerGuide}`,
      "",
      `약점 방어 답변: ${question.weaknessDefense}`,
      "",
    ]),
  ].join("\n");
}

export function InterviewView({
  initialAnalysisId,
}: {
  initialAnalysisId?: string;
}) {
  const { workspace, setWorkspace } = useProofolioWorkspace();
  const analyses = useMemo(() => workspace.analyses, [workspace.analyses]);
  const { selectedId, selectedAnalysis, selectAnalysis } =
    useAnalysisSelection(analyses, initialAnalysisId);
  const [isGenerating, setIsGenerating] = useState(false);
  const firstQuestionRef = useRef<HTMLTextAreaElement>(null);

  if (!selectedAnalysis) {
    return <NoAnalysisForArtifact artifactName="면접 질문" />;
  }

  const questions = workspace.interviewQuestions[selectedAnalysis.id];
  const copyContent = questions
    ? buildInterviewCopy(selectedAnalysis.projectTitle, questions)
    : "";

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const generated = await generateInterviewQuestions(selectedAnalysis);
      setWorkspace((current) => ({
        ...current,
        interviewQuestions: {
          ...current.interviewQuestions,
          [selectedAnalysis.id]: generated,
        },
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const updateQuestion = (
    questionIndex: number,
    updater: (question: InterviewQuestion) => InterviewQuestion,
  ) => {
    setWorkspace((current) => {
      const currentQuestions =
        current.interviewQuestions[selectedAnalysis.id];
      if (!currentQuestions) return current;

      return {
        ...current,
        interviewQuestions: {
          ...current.interviewQuestions,
          [selectedAnalysis.id]: currentQuestions.map((question, index) =>
            index === questionIndex ? updater(question) : question,
          ),
        },
      };
    });
  };

  return (
    <div className="space-y-7">
      <ArtifactPageHeader
        eyebrow="EXPERIENCE TO ANSWER"
        title="내 경험에서 나올 면접 질문을 준비하세요"
        description="프로젝트의 문제 정의, 전략적 선택, 역할과 한계를 기준으로 대표 질문과 꼬리질문, 답변 구조를 함께 준비합니다."
        icon={UserRoundSearch}
        completedCount={analyses.length}
        resultCount={Object.keys(workspace.interviewQuestions).length}
        resultLabel="준비 완료"
        example="예: 왜 이 타깃을 선택했는지, 성과를 높이려면 무엇을 바꿀지까지 준비합니다."
      />

      <section className="grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)]">
        <AnalysisProjectPicker
          analyses={analyses}
          selectedId={selectedId}
          onSelect={selectAnalysis}
          generatedIds={new Set(Object.keys(workspace.interviewQuestions))}
          generatedLabel="면접 질문"
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
                <ArtifactResultActions
                  content={copyContent}
                  hasResult={Boolean(questions)}
                  isGenerating={isGenerating}
                  onGenerate={handleGenerate}
                  onEdit={() => firstQuestionRef.current?.focus()}
                />
              </div>
            </div>

            <div className="grid gap-3 p-6 sm:grid-cols-3 sm:p-7">
              {[
                {
                  icon: MessageCircleQuestion,
                  title: "대표 질문",
                  description: "프로젝트 선택과 기여도를 확인",
                },
                {
                  icon: CornerDownRight,
                  title: "꼬리질문 3개",
                  description: "판단 근거와 한계를 추가 검증",
                },
                {
                  icon: Shield,
                  title: "약점 방어",
                  description: "과장 없이 부족한 근거를 설명",
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
                      예: {guide.title === "대표 질문"
                        ? "이 프로젝트에서 본인의 핵심 기여는 무엇인가요?"
                        : guide.title === "꼬리질문 3개"
                          ? "왜 그 타깃을 우선순위로 판단했나요?"
                          : "성과 수치가 부족할 때 검증 방식으로 설명"}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <SectionGuide title="면접 답변 구성 기준">
            대표 질문은 경험의 핵심을 확인하고, 꼬리질문은 판단 근거와 한계를
            검증합니다. 답변 가이드는 <strong>상황, 판단, 행동, 결과</strong>
            순서로 준비하고, 약점 방어는 부족한 수치나 검증 한계를 인정한 뒤
            후속 개선 계획까지 말하는 방식이 좋습니다.
          </SectionGuide>

          {questions ? (
            <section className="space-y-4">
              {questions.map((question, questionIndex) => (
                <article
                  key={`${selectedAnalysis.id}-${questionIndex}`}
                  className="pf-card overflow-hidden"
                >
                  <header className="border-b border-[#e6ebf2] bg-[#10213d] p-5 text-white sm:p-6">
                    <div className="grid gap-4 sm:grid-cols-[44px_minmax(0,1fr)]">
                      <span className="grid size-11 place-items-center rounded-xl bg-white/10 text-[12px] font-black text-[#8eb5ff]">
                        Q{questionIndex + 1}
                      </span>
                      <div>
                        <p className="text-[10px] font-black tracking-[0.14em] text-[#8eb5ff]">
                          REPRESENTATIVE QUESTION
                        </p>
                        <p className="mt-1 text-[11px] font-semibold leading-5 text-white/60">
                          면접관이 프로젝트의 본질과 본인 기여도를 확인하는 첫 질문입니다.
                        </p>
                        <textarea
                          ref={
                            questionIndex === 0 ? firstQuestionRef : undefined
                          }
                          value={question.question}
                          onChange={(event) =>
                            updateQuestion(questionIndex, (current) => ({
                              ...current,
                              question: event.target.value,
                            }))
                          }
                          aria-label={`대표 질문 ${questionIndex + 1}`}
                          rows={2}
                          className="mt-2 w-full resize-y border-0 bg-transparent text-[14px] font-black leading-6 text-white outline-none"
                        />
                      </div>
                    </div>
                  </header>

                  <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <section className="rounded-2xl border border-[#e4e9f0] bg-[#fafbfd] p-5">
                      <div className="flex items-center gap-2">
                        <CornerDownRight
                          size={15}
                          className="text-[#7157d9]"
                        />
                        <h4 className="text-[12px] font-black text-[#40536d]">
                          꼬리질문 3개
                        </h4>
                      </div>
                      <p className="mt-2 text-[11px] font-semibold leading-5 text-[#7d8da2]">
                        대표 답변의 근거, 대안, 한계를 추가로 확인하는 질문입니다.
                      </p>
                      <div className="mt-4 space-y-3">
                        {question.followUpQuestions.map(
                          (followUp, followUpIndex) => (
                            <div
                              key={followUpIndex}
                              className="grid grid-cols-[24px_minmax(0,1fr)] gap-2.5"
                            >
                              <span className="grid size-6 place-items-center rounded-lg bg-[#f0edff] text-[10px] font-black text-[#7157d9]">
                                {followUpIndex + 1}
                              </span>
                              <textarea
                                value={followUp}
                                onChange={(event) =>
                                  updateQuestion(
                                    questionIndex,
                                    (current) => ({
                                      ...current,
                                      followUpQuestions:
                                        current.followUpQuestions.map(
                                          (item, index) =>
                                            index === followUpIndex
                                              ? event.target.value
                                              : item,
                                        ),
                                    }),
                                  )
                                }
                                aria-label={`대표 질문 ${questionIndex + 1} 꼬리질문 ${followUpIndex + 1}`}
                                rows={2}
                                className="w-full resize-y border-0 bg-transparent text-[12px] font-semibold leading-6 text-[#5b6d84] outline-none"
                              />
                            </div>
                          ),
                        )}
                      </div>
                    </section>

                    <div className="space-y-3">
                      <section className="rounded-2xl border border-[#dbe7f8] bg-[#f4f8ff] p-5">
                        <div className="flex items-center gap-2">
                          <Lightbulb size={15} className="text-[#2563eb]" />
                          <h4 className="text-[12px] font-black text-[#315984]">
                            답변 가이드
                          </h4>
                        </div>
                        <p className="mt-2 text-[11px] font-semibold leading-5 text-[#617b9b]">
                          답변 순서와 반드시 포함해야 할 근거를 정리합니다.
                        </p>
                        <textarea
                          value={question.answerGuide}
                          onChange={(event) =>
                            updateQuestion(questionIndex, (current) => ({
                              ...current,
                              answerGuide: event.target.value,
                            }))
                          }
                          aria-label={`대표 질문 ${questionIndex + 1} 답변 가이드`}
                          rows={5}
                          className="mt-3 w-full resize-y border-0 bg-transparent text-[12px] leading-[1.8] text-[#58769a] outline-none"
                        />
                      </section>

                      <section className="rounded-2xl border border-[#eadfc5] bg-[#fffbf2] p-5">
                        <div className="flex items-center gap-2">
                          <Shield size={15} className="text-[#c77b0d]" />
                          <h4 className="text-[12px] font-black text-[#8d5c15]">
                            약점 방어 답변
                          </h4>
                        </div>
                        <p className="mt-2 text-[11px] font-semibold leading-5 text-[#806b4e]">
                          부족한 성과 수치나 검증 한계를 인정하고 다음 개선 계획으로 연결합니다.
                        </p>
                        <textarea
                          value={question.weaknessDefense}
                          onChange={(event) =>
                            updateQuestion(questionIndex, (current) => ({
                              ...current,
                              weaknessDefense: event.target.value,
                            }))
                          }
                          aria-label={`대표 질문 ${questionIndex + 1} 약점 방어 답변`}
                          rows={4}
                          className="mt-3 w-full resize-y border-0 bg-transparent text-[12px] leading-[1.8] text-[#806b4e] outline-none"
                        />
                      </section>
                    </div>
                  </div>
                </article>
              ))}
              <p className="px-1 text-[11px] text-[#929eae]">
                질문과 답변 가이드를 직접 수정하면 브라우저에 자동 저장됩니다.
              </p>
            </section>
          ) : (
            <section className="grid min-h-[430px] place-items-center rounded-3xl border border-dashed border-[#cfd9e8] bg-white px-8 py-14 text-center">
              <div className="max-w-md">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#eaf1ff] text-[#2563eb]">
                  <UserRoundSearch size={24} />
                </span>
                <h3 className="mt-5 text-[16px] font-black text-[#263853]">
                  프로젝트 맞춤 면접 질문을 생성하세요
                </h3>
                <p className="mt-2 text-[12px] leading-6 text-[#8996a8]">
                  대표 질문, 꼬리질문 세 개, 답변 가이드와 약점 방어 답변을
                  프로젝트 근거에 맞춰 생성합니다.
                </p>
              </div>
            </section>
          )}

          {questions && (
            <NextStepCard
              title="면접 준비 자료를 최종 문서로 정리하세요"
              description="직접 수정한 대표 질문, 꼬리질문과 답변 가이드가 Export 미리보기에 최신 상태로 반영됩니다."
              primaryHref={`/export?analysis=${selectedAnalysis.id}`}
              primaryLabel="면접 자료 Export"
              primaryIcon={FileOutput}
              secondaryHref={`/feedback?analysis=${selectedAnalysis.id}&target=portfolio`}
              secondaryLabel="피드백 다시 보기"
            />
          )}
        </div>
      </section>
    </div>
  );
}
