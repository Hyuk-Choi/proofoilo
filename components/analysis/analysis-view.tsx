"use client";

import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  FileQuestion,
  FileText,
  FolderSearch2,
  Gauge,
  Lightbulb,
  MessageSquareText,
  RefreshCcw,
  Route,
  Sparkles,
  Target,
  UploadCloud,
  UserRound,
  UserRoundSearch,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ExampleHint } from "@/components/artifacts/artifact-workspace";
import { useProofolioWorkspace } from "@/hooks/use-proofolio-workspace";
import { formatUploadDate, getDisplayFileType } from "@/lib/files";
import type { ProjectAnalysis } from "@/types/proofolio";

const actionLinks: Array<{
  label: string;
  href: string;
  icon: LucideIcon;
  primary?: boolean;
}> = [
  {
    label: "포트폴리오 생성하기",
    href: "/portfolio",
    icon: BriefcaseBusiness,
    primary: true,
  },
  {
    label: "자기소개서 생성하기",
    href: "/cover-letter",
    icon: FileText,
  },
  {
    label: "이력서 문장 생성하기",
    href: "/resume",
    icon: ClipboardCheck,
  },
  {
    label: "피드백 보기",
    href: "/feedback",
    icon: MessageSquareText,
  },
  {
    label: "면접 질문 생성하기",
    href: "/interview",
    icon: UserRoundSearch,
  },
];

function getReportSections(analysis: ProjectAnalysis) {
  return [
    {
      label: "프로젝트 배경",
      value: analysis.background,
      icon: FileText,
      tone: "bg-[#eef3fa] text-[#406184]",
    },
    {
      label: "문제 정의",
      value: analysis.problemDefinition,
      icon: Target,
      tone: "bg-[#fff0ed] text-[#d5644e]",
    },
    {
      label: "타깃",
      value: analysis.targetAudience,
      icon: Users,
      tone: "bg-[#f0edff] text-[#7157d9]",
    },
    {
      label: "핵심 인사이트",
      value: analysis.keyInsight,
      icon: Lightbulb,
      tone: "bg-[#fff4df] text-[#c77b0d]",
    },
    {
      label: "전략 방향",
      value: analysis.strategy,
      icon: Route,
      tone: "bg-[#eaf1ff] text-[#2563eb]",
    },
    {
      label: "실행 내용",
      value: analysis.execution,
      icon: Wrench,
      tone: "bg-[#e9f7f4] text-[#15856c]",
    },
    {
      label: "성과 또는 기대효과",
      value: analysis.result,
      icon: BarChart3,
      tone: "bg-[#e9f7ee] text-[#168765]",
    },
    {
      label: "사용자의 역할",
      value: analysis.userRole,
      icon: UserRound,
      tone: "bg-[#eef1f6] text-[#52657d]",
    },
  ];
}

export function AnalysisView() {
  const { workspace } = useProofolioWorkspace();
  const completedAnalyses = useMemo(
    () =>
      workspace.analyses.filter((analysis) => {
        const sourceFile = workspace.uploadedFiles.find(
          (file) => file.name === analysis.sourceFileName,
        );
        return (
          !sourceFile ||
          sourceFile.status === "분석 완료" ||
          sourceFile.status === "보완 필요"
        );
      }),
    [workspace.analyses, workspace.uploadedFiles],
  );
  const [selectedId, setSelectedId] = useState(
    completedAnalyses[0]?.id ?? "",
  );
  const selectedAnalysis =
    completedAnalyses.find((analysis) => analysis.id === selectedId) ??
    completedAnalyses[0];

  if (!selectedAnalysis) {
    return (
      <div className="grid min-h-[calc(100vh-145px)] place-items-center">
        <section className="w-full max-w-2xl rounded-3xl border border-dashed border-[#cfd9e8] bg-white px-8 py-16 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#eaf1ff] text-[#2563eb]">
            <FolderSearch2 size={24} />
          </span>
          <h2 className="mt-5 text-[20px] font-black tracking-[-0.035em] text-[#1b2d48]">
            아직 준비된 분석 리포트가 없습니다
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-[#8492a5]">
            파일을 업로드하고 AI 분석을 완료하면 문제 정의, 전략, 역할과 직무
            역량을 구조화한 리포트를 확인할 수 있습니다.
          </p>
          <Link
            href="/upload"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#2563eb] px-5 text-[12px] font-extrabold text-white"
          >
            <UploadCloud size={16} />
            파일 업로드로 이동
          </Link>
        </section>
      </div>
    );
  }

  const sourceFile = workspace.uploadedFiles.find(
    (file) => file.name === selectedAnalysis.sourceFileName,
  );
  const reportSections = getReportSections(selectedAnalysis);
  const sourceReview = selectedAnalysis.sourceReview;
  const expertReview = selectedAnalysis.expertReview;
  const answeredQuestions = Object.values(
    workspace.questionAnswers[selectedAnalysis.id] ?? {},
  ).filter((answer) => answer.trim().length > 0).length;

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <div className="pf-tag pf-tag-primary">
            <CheckCircle2 size={12} className="text-[#15966f]" />
            분석을 검토한 뒤 필요한 결과물을 선택하세요
          </div>
          <h2 className="mt-4 text-[29px] font-black tracking-[-0.045em] text-[#10213d]">
            프로젝트 분석 리포트
          </h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#6f7f94]">
            전문 컨설턴트의 진단 방식으로 업로드 자료를 문제, 근거, 시사점과
            권고안으로 재구성했습니다. 성과나 역할이 불분명한 부분은 보완
            질문으로 분리해 과장 없이 결과물을 만들 수 있도록 구성했습니다.
          </p>
          <ExampleHint>
            예: 파일명에 ‘오딧세이 광고’가 있으면 타깃 분석, 소재 전략, CTR/CPC 개선 포인트를 리포트로 정리합니다.
          </ExampleHint>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-xl border border-[#d9ebe5] bg-[#f3fbf8] px-3.5 py-2 text-[11px] font-bold text-[#168765]">
            분석 완료 {completedAnalyses.length}개
          </span>
          <span className="rounded-xl border border-[#eadfc5] bg-[#fffaf0] px-3.5 py-2 text-[11px] font-bold text-[#a96a0d]">
            보완 질문 {selectedAnalysis.missingQuestions.length}개
          </span>
          <Link
            href="/upload"
            className="pf-button-secondary min-h-9 px-3.5 py-2"
          >
            <UploadCloud size={14} />
            파일 추가
          </Link>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)]">
        <aside className="pf-card h-fit p-4 xl:sticky xl:top-[96px]">
          <div className="flex items-center justify-between px-1 pb-3">
            <div>
              <h3 className="text-[15px] font-black text-[#263853]">
                분석 프로젝트
              </h3>
              <p className="mt-1 text-[11px] text-[#95a1b1]">
                확인할 리포트를 선택하세요
              </p>
            </div>
            <span className="grid size-8 place-items-center rounded-xl bg-[#eaf1ff] text-[#2563eb]">
              <FolderSearch2 size={15} />
            </span>
          </div>

          <div className="space-y-2">
            {completedAnalyses.map((analysis, index) => {
              const active = analysis.id === selectedAnalysis.id;
              const relatedFile = workspace.uploadedFiles.find(
                (file) => file.name === analysis.sourceFileName,
              );

              return (
                <button
                  key={analysis.id}
                  type="button"
                  onClick={() => setSelectedId(analysis.id)}
                  className={`w-full rounded-2xl border p-3.5 text-left transition ${
                    active
                      ? "border-[#9dbaf7] bg-[#eef4ff] shadow-[0_7px_18px_rgba(37,99,235,0.08)]"
                      : "border-transparent bg-[#f8fafc] hover:border-[#dbe4ef] hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`text-[10px] font-black tracking-[0.13em] ${
                        active ? "text-[#2563eb]" : "text-[#9aa6b6]"
                      }`}
                    >
                      PROJECT {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-extrabold text-[#728198]">
                      {getDisplayFileType(analysis.sourceFileName)}
                    </span>
                  </div>
                  <strong className="mt-2 block text-[13px] font-extrabold leading-5 text-[#30425c]">
                    {analysis.projectTitle}
                  </strong>
                  <span className="mt-2 block text-[11px] leading-5 text-[#8794a6]">
                    {analysis.projectType}
                  </span>
                  <div className="mt-3 flex items-center justify-between border-t border-[#e6ebf2] pt-2.5">
                    <span className="text-[10px] text-[#a0abba]">
                      {relatedFile
                        ? formatUploadDate(relatedFile.uploadedAt)
                        : "저장된 분석"}
                    </span>
                    <span
                      className={`size-1.5 rounded-full ${
                        relatedFile?.status === "보완 필요"
                          ? "bg-[#d58a18]"
                          : "bg-[#15966f]"
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <article className="pf-card overflow-hidden">
          <header className="relative overflow-hidden border-b border-[#e2e9f2] bg-[linear-gradient(135deg,#f8fbff_0%,#eef4ff_58%,#f7f9fc_100%)] px-6 py-7 sm:px-8 sm:py-9">
            <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-[#2563eb]/[0.06] blur-3xl" />
            <div className="relative">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#2563eb] px-3 py-1.5 text-[11px] font-black tracking-[0.08em] text-white">
                      {selectedAnalysis.projectType}
                    </span>
                    <span className="rounded-full border border-[#d9e3f0] bg-white/75 px-3 py-1.5 text-[11px] font-bold text-[#65758b]">
                      추천도 높음
                    </span>
                  </div>
                  <h3 className="mt-5 text-[26px] font-black leading-tight tracking-[-0.045em] text-[#10213d]">
                    {selectedAnalysis.projectTitle}
                  </h3>
                  <p className="mt-3 max-w-3xl text-[13px] font-semibold leading-6 text-[#53677f]">
                    {selectedAnalysis.oneLineSummary}
                  </p>
                </div>
                <div className="w-full rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur-sm lg:w-[230px]">
                  <p className="text-[10px] font-black tracking-[0.12em] text-[#8b98aa]">
                    SOURCE FILE
                  </p>
                  <strong className="mt-2 block break-all text-[12px] font-extrabold leading-5 text-[#40536d]">
                    {selectedAnalysis.sourceFileName}
                  </strong>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-[#8c99aa]">
                    <span>{sourceFile ? formatUploadDate(sourceFile.uploadedAt) : "저장된 분석"}</span>
                    <span className="inline-flex items-center gap-1 font-extrabold text-[#168765]">
                      <CheckCircle2 size={10} />
                      분석 완료
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {selectedAnalysis.competencyTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#d6e2f3] bg-white px-3 py-1.5 text-[11px] font-extrabold text-[#3e6495] shadow-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </header>

          <div className="space-y-7 p-6 sm:p-8">
            {sourceReview ? (
              <section className="rounded-2xl border border-[#d9e4f4] bg-[#f8fbff] p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div>
                    <p className="text-[10px] font-black tracking-[0.14em] text-[#2563eb]">
                      SOURCE REVIEW
                    </p>
                    <h4 className="mt-1.5 text-[15px] font-black text-[#263853]">
                      첨부 파일 상세 분석 및 검토
                    </h4>
                    <p className="mt-2 text-[12px] leading-6 text-[#6f7f94]">
                      {sourceReview.reviewScope}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#eaf1ff] px-3 py-1.5 text-[11px] font-black text-[#2563eb]">
                    OpenAI Mock 검토
                  </span>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                  <div className="rounded-2xl border border-[#e3ebf5] bg-white p-4">
                    <h5 className="text-[12px] font-black text-[#31435d]">
                      감지한 핵심 신호
                    </h5>
                    <ul className="mt-3 space-y-2.5">
                      {sourceReview.detectedSignals.map((signal) => (
                        <li
                          key={signal}
                          className="flex gap-2 text-[12px] leading-6 text-[#66758c]"
                        >
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#2563eb]" />
                          {signal}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-[#e3ebf5] bg-white p-4">
                    <h5 className="text-[12px] font-black text-[#31435d]">
                      컨설턴트 검토 의견
                    </h5>
                    <p className="mt-3 text-[12px] leading-6 text-[#66758c]">
                      {sourceReview.evidenceQuality}
                    </p>
                    <ul className="mt-3 space-y-2.5">
                      {sourceReview.consultantNotes.map((note) => (
                        <li
                          key={note}
                          className="flex gap-2 text-[12px] leading-6 text-[#66758c]"
                        >
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#15966f]" />
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            ) : null}

            {expertReview ? (
              <section className="rounded-2xl border border-[#dfe7f1] bg-white p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div>
                    <p className="text-[10px] font-black tracking-[0.14em] text-[#10213d]">
                      EXPERT DEEP DIVE
                    </p>
                    <h4 className="mt-1.5 text-[15px] font-black text-[#263853]">
                      전문가 심층 분석
                    </h4>
                    <p className="mt-3 text-[13px] leading-[1.85] text-[#5f7087]">
                      {expertReview.executiveDiagnosis}
                    </p>
                    <p className="mt-3 rounded-2xl bg-[#f6f8fb] p-4 text-[12px] leading-6 text-[#65758b]">
                      {expertReview.hiringRelevance}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#10213d] px-3 py-1.5 text-[11px] font-black text-white">
                    Consultant Grade
                  </span>
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-2">
                  {expertReview.evidenceReviews.map((review) => (
                    <article
                      key={review.label}
                      className="rounded-2xl border border-[#e5ebf2] bg-[#fbfcfe] p-4"
                    >
                      <h5 className="text-[12px] font-black text-[#31435d]">
                        {review.label}
                      </h5>
                      <p className="mt-2 text-[12px] leading-6 text-[#68788e]">
                        {review.finding}
                      </p>
                      <p className="mt-3 rounded-xl bg-white px-3 py-2.5 text-[11px] font-semibold leading-5 text-[#2563eb] shadow-sm">
                        권고: {review.recommendation}
                      </p>
                    </article>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-4">
                  {[
                    ["강점", expertReview.strengths, "bg-[#f3fbf8] text-[#168765]"],
                    ["리스크", expertReview.risks, "bg-[#fff7f8] text-[#c24b5a]"],
                    ["검증 체크리스트", expertReview.validationChecklist, "bg-[#f8fbff] text-[#2563eb]"],
                    ["포트폴리오 각도", expertReview.portfolioAngles, "bg-[#fffbf2] text-[#a96a0d]"],
                  ].map(([label, items, tone]) => (
                    <div
                      key={label as string}
                      className={`rounded-2xl border border-[#e4eaf2] p-4 ${tone as string}`}
                    >
                      <h5 className="text-[12px] font-black">
                        {label as string}
                      </h5>
                      <ul className="mt-3 space-y-2.5">
                        {(items as string[]).map((item) => (
                          <li
                            key={item}
                            className="flex gap-2 text-[11px] font-semibold leading-5"
                          >
                            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-current opacity-60" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="grid gap-4 lg:grid-cols-2">
              {reportSections.map((section) => {
                const Icon = section.icon;

                return (
                  <div
                    key={section.label}
                    className="rounded-2xl border border-[#e5ebf2] bg-[#fbfcfe] p-5"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid size-9 place-items-center rounded-xl ${section.tone}`}
                      >
                        <Icon size={16} />
                      </span>
                      <h4 className="text-[13px] font-black text-[#31435d]">
                        {section.label}
                      </h4>
                    </div>
                    <p className="mt-4 text-[13px] leading-[1.85] text-[#65758b]">
                      {section.value}
                    </p>
                  </div>
                );
              })}
            </section>

            <section className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <div className="rounded-2xl border border-[#dbe7f8] bg-[#f4f8ff] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-xl bg-white text-[#2563eb] shadow-sm">
                      <Sparkles size={16} />
                    </span>
                    <h4 className="text-[13px] font-black text-[#264d85]">
                      포트폴리오 반영 추천도
                    </h4>
                  </div>
                  <span className="rounded-full bg-[#2563eb] px-3 py-1.5 text-[11px] font-black text-white">
                    HIGH
                  </span>
                </div>
                <p className="mt-4 text-[13px] leading-[1.85] text-[#55739b]">
                  {selectedAnalysis.portfolioRecommendation}
                </p>
              </div>

              <div className="rounded-2xl border border-[#eadfc5] bg-[#fffbf2] p-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-white text-[#c77b0d] shadow-sm">
                    <Gauge size={16} />
                  </span>
                  <h4 className="text-[13px] font-black text-[#8d5c15]">
                    보완 필요점
                  </h4>
                </div>
                <ul className="mt-4 space-y-3">
                  {selectedAnalysis.improvementPoints.map((point, index) => (
                    <li
                      key={point}
                      className="flex items-start gap-2.5 text-[12px] leading-6 text-[#806b4e]"
                    >
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-white text-[10px] font-black text-[#b77718] shadow-sm">
                        {index + 1}
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl bg-[#10213d] p-6 text-white shadow-[0_16px_38px_rgba(16,33,61,0.13)]">
              <div className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-[#8eb5ff]">
                  <MessageSquareText size={18} />
                </span>
                <div>
                  <p className="text-[10px] font-black tracking-[0.14em] text-[#8eb5ff]">
                    EXPERT COMMENT
                  </p>
                  <h4 className="mt-1.5 text-[13px] font-black">
                    채용·전략 컨설턴트 진단
                  </h4>
                  <p className="mt-3 text-[13px] leading-[1.9] text-white/70">
                    {selectedAnalysis.expertComment}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#e4eaf2] bg-white p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-[#fff4df] text-[#c77b0d]">
                    <FileQuestion size={16} />
                  </span>
                  <div>
                    <h4 className="text-[13px] font-black text-[#31435d]">
                      보완 필요 질문
                    </h4>
                    <p className="mt-1 text-[11px] text-[#909daf]">
                      객관적 근거를 추가하면 생성 결과의 신뢰도가 높아집니다.
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-[#f3f6fa] px-3 py-1.5 text-[11px] font-extrabold text-[#6a7b91]">
                  답변 {answeredQuestions}/{selectedAnalysis.missingQuestions.length}
                </span>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                {selectedAnalysis.missingQuestions.map((question, index) => {
                  const answer =
                    workspace.questionAnswers[selectedAnalysis.id]?.[question];

                  return (
                    <div
                      key={question}
                      className={`rounded-2xl border p-4 ${
                        answer
                          ? "border-[#cfe8df] bg-[#f4fbf8]"
                          : "border-[#e5eaf1] bg-[#f9fafc]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-[0.12em] text-[#99a5b4]">
                          QUESTION {String(index + 1).padStart(2, "0")}
                        </span>
                        {answer && (
                          <CheckCircle2 size={13} className="text-[#15966f]" />
                        )}
                      </div>
                      <p className="mt-3 text-[12px] font-bold leading-6 text-[#53657c]">
                        {question}
                      </p>
                      {answer && (
                        <p className="mt-3 border-t border-[#dfece7] pt-3 text-[11px] leading-6 text-[#638175]">
                          {answer}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-[#d9e4f4] bg-[linear-gradient(135deg,#f7faff_0%,#eef4ff_100%)] p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                <div>
                  <p className="text-[10px] font-black tracking-[0.14em] text-[#2563eb]">
                    NEXT STEP
                  </p>
                  <h4 className="mt-1.5 text-[14px] font-black tracking-[-0.02em] text-[#1c3355]">
                    분석을 확인했다면 필요한 결과물을 선택하세요
                  </h4>
                  <p className="mt-1 text-[12px] leading-6 text-[#72849b]">
                    생성 화면에서도 이 분석 리포트와 보완 답변을 근거로 사용합니다.
                  </p>
                </div>
                <Link
                  href="/upload"
                  className="inline-flex items-center gap-2 text-[11px] font-extrabold text-[#667a94] hover:text-[#2563eb]"
                >
                  <RefreshCcw size={13} />
                  파일 다시 분석
                </Link>
              </div>

              <div className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
                {actionLinks.map((action) => {
                  const Icon = action.icon;

                  return (
                    <Link
                      key={action.href}
                      href={`${action.href}?analysis=${selectedAnalysis.id}`}
                      className={`group flex min-h-[82px] flex-col justify-between rounded-xl border p-3.5 transition ${
                        action.primary
                          ? "border-[#2563eb] bg-[#2563eb] text-white shadow-[0_8px_20px_rgba(37,99,235,0.18)] hover:bg-[#1d4ed8]"
                          : "border-[#dce4ef] bg-white text-[#435773] hover:border-[#aebfda] hover:text-[#2563eb]"
                      }`}
                    >
                      <Icon size={16} />
                      <span className="flex items-end justify-between gap-2">
                        <strong className="text-[11px] font-extrabold leading-5">
                          {action.label}
                        </strong>
                        <ArrowRight
                          size={12}
                          className={action.primary ? "text-white/70" : "text-[#a2afbf] group-hover:text-[#2563eb]"}
                        />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        </article>
      </section>
    </div>
  );
}
