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

import {
  ExampleHint,
  SectionGuide,
} from "@/components/artifacts/artifact-workspace";
import { useProofolioWorkspace } from "@/hooks/use-proofolio-workspace";
import { getAccuracyReportForAnalysis } from "@/lib/analysis/accuracy-review";
import { getProjectEvidenceAudit } from "@/lib/analysis/evidence-audit";
import { getDetailedReviewForAnalysis } from "@/lib/analysis/detailed-review";
import { getProjectResearchDepthAudit } from "@/lib/analysis/research-depth-audit";
import { formatUploadDate, getDisplayFileType } from "@/lib/files";
import type { ProjectAnalysis } from "@/types/proofolio";

const actionLinks: Array<{
  label: string;
  href: string;
  icon: LucideIcon;
  primary?: boolean;
  description: string;
}> = [
  {
    label: "포트폴리오 생성하기",
    href: "/portfolio",
    icon: BriefcaseBusiness,
    primary: true,
    description: "문제, 인사이트, 실행, 결과를 프로젝트 스토리로 변환",
  },
  {
    label: "자기소개서 생성하기",
    href: "/cover-letter",
    icon: FileText,
    description: "지원 직무 항목에 맞춰 경험을 문장화",
  },
  {
    label: "이력서 문장 생성하기",
    href: "/resume",
    icon: ClipboardCheck,
    description: "성과 중심의 짧은 bullet point로 압축",
  },
  {
    label: "피드백 보기",
    href: "/feedback",
    icon: MessageSquareText,
    description: "근거, 역할, 문장 설득력을 전문가 기준으로 점검",
  },
  {
    label: "면접 질문 생성하기",
    href: "/interview",
    icon: UserRoundSearch,
    description: "대표 질문과 꼬리질문, 약점 방어 답변 준비",
  },
];

function getReportSections(analysis: ProjectAnalysis) {
  return [
    {
      label: "프로젝트 배경",
      value: analysis.background,
      help: "왜 이 프로젝트가 시작되었는지 설명합니다. 포트폴리오 첫 화면에서 맥락을 빠르게 이해시키는 역할입니다.",
      icon: FileText,
      tone: "bg-[#eef3fa] text-[#406184]",
    },
    {
      label: "문제 정의",
      value: analysis.problemDefinition,
      help: "채용 담당자가 가장 먼저 보는 항목입니다. 해결하려 한 문제와 판단 기준이 명확해야 합니다.",
      icon: Target,
      tone: "bg-[#fff0ed] text-[#d5644e]",
    },
    {
      label: "타깃",
      value: analysis.targetAudience,
      help: "누구를 대상으로 전략을 세웠는지 보여줍니다. 마케팅/기획 직무에서는 타깃 설정의 근거가 중요합니다.",
      icon: Users,
      tone: "bg-[#f0edff] text-[#7157d9]",
    },
    {
      label: "핵심 인사이트",
      value: analysis.keyInsight,
      help: "자료를 단순 정리한 것이 아니라 어떤 판단을 도출했는지 보여주는 핵심 근거입니다.",
      icon: Lightbulb,
      tone: "bg-[#fff4df] text-[#c77b0d]",
    },
    {
      label: "전략 방향",
      value: analysis.strategy,
      help: "인사이트를 실제 실행 방향으로 바꾼 부분입니다. 직무 역량과 가장 직접적으로 연결됩니다.",
      icon: Route,
      tone: "bg-[#eaf1ff] text-[#2563eb]",
    },
    {
      label: "실행 내용",
      value: analysis.execution,
      help: "본인이 실제로 무엇을 만들고 조율했는지 보여줍니다. 가능한 한 산출물 단위로 읽히는 것이 좋습니다.",
      icon: Wrench,
      tone: "bg-[#e9f7f4] text-[#15856c]",
    },
    {
      label: "성과 또는 기대효과",
      value: analysis.result,
      help: "확정 수치가 있으면 성과로, 없으면 기대효과와 검증 과제로 분리해 과장 없이 표현합니다.",
      icon: BarChart3,
      tone: "bg-[#e9f7ee] text-[#168765]",
    },
    {
      label: "사용자의 역할",
      value: analysis.userRole,
      help: "팀 프로젝트에서 특히 중요합니다. 조사, 판단, 작성, 실행, 조율 중 본인이 맡은 범위를 분리합니다.",
      icon: UserRound,
      tone: "bg-[#eef1f6] text-[#52657d]",
    },
  ];
}

function getConfidenceTone(confidence: string) {
  if (confidence === "높음") {
    return "border-[#cfe8df] bg-[#f2fbf7] text-[#168765]";
  }
  if (confidence === "중간") {
    return "border-[#dbe7f8] bg-[#f8fbff] text-[#2563eb]";
  }
  return "border-[#eadfc5] bg-[#fffbf2] text-[#a96a0d]";
}

function getEvidenceLevelTone(level: string) {
  if (level === "직접 근거") {
    return "border-[#cfe8df] bg-[#f2fbf7] text-[#168765]";
  }
  if (level === "부분 근거") {
    return "border-[#dbe7f8] bg-[#f8fbff] text-[#2563eb]";
  }
  if (level === "추론") {
    return "border-[#eadfc5] bg-[#fffbf2] text-[#a96a0d]";
  }
  return "border-[#f1d7dc] bg-[#fff7f8] text-[#c24b5a]";
}

function getResearchTone(status: string) {
  if (status === "통과") {
    return "border-[#cfe8df] bg-[#f2fbf7] text-[#168765]";
  }
  if (status === "보완 필요") {
    return "border-[#eadfc5] bg-[#fffbf2] text-[#a96a0d]";
  }
  return "border-[#f1d7dc] bg-[#fff7f8] text-[#c24b5a]";
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
  const detailedReview = getDetailedReviewForAnalysis(selectedAnalysis);
  const accuracyReport = getAccuracyReportForAnalysis(selectedAnalysis);
  const evidenceAudit = getProjectEvidenceAudit(selectedAnalysis, workspace);
  const researchAudit = getProjectResearchDepthAudit(
    selectedAnalysis,
    workspace,
  );
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
            <SectionGuide title="분석 리포트 읽는 방법">
              먼저 <strong>문제 정의</strong>와 <strong>사용자의 역할</strong>을
              확인한 뒤, 핵심 인사이트와 실행 내용이 실제 성과 또는 기대효과로
              이어지는지 보세요. 보완 질문은 최종 산출물의 신뢰도를 높이는
              체크리스트입니다.
            </SectionGuide>

            <section
              className={`rounded-2xl border p-5 sm:p-6 ${
                researchAudit.readyForOutput
                  ? "border-[#cfe8df] bg-[#f3fbf8]"
                  : researchAudit.score >= 62
                    ? "border-[#eadfc5] bg-[#fffbf2]"
                    : "border-[#f1d7dc] bg-[#fff7f8]"
              }`}
            >
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div>
                  <p className="text-[10px] font-black tracking-[0.14em] text-[#2563eb]">
                    RESEARCH DEPTH AUDIT
                  </p>
                  <h4 className="mt-1.5 text-[16px] font-black text-[#263853]">
                    산출물 생성 전 리서치 충분도
                  </h4>
                  <p className="mt-2 text-[12px] leading-6 text-[#68788e]">
                    {researchAudit.summary} 이 기준은 원문 근거, 출처 다양성,
                    시장·고객 맥락, 본인 기여와 보완 질문 답변을 함께 봅니다.
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-5 py-4 text-center shadow-sm">
                  <span className="mx-auto grid size-10 place-items-center rounded-xl bg-[#eaf1ff] text-[#2563eb]">
                    <Gauge size={17} />
                  </span>
                  <strong className="mt-2 block text-[28px] font-black tracking-[-0.05em] text-[#10213d]">
                    {researchAudit.score}
                    <span className="ml-1 text-[12px] text-[#9aa6b7]">
                      /100
                    </span>
                  </strong>
                  <p className="text-[11px] font-black text-[#52657d]">
                    {researchAudit.level}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {researchAudit.criteria.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-[12px] font-black text-[#40536d]">
                        {item.label}
                      </strong>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${getResearchTone(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[15px] font-black text-[#10213d]">
                      {item.score}/100
                    </p>
                    <p className="mt-2 text-[11px] font-semibold leading-5 text-[#7d8da2]">
                      {item.evidence}
                    </p>
                    <p className="mt-2 text-[10px] font-semibold leading-5 text-[#68788e]">
                      {item.recommendation}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl bg-white/75 p-4">
                  <strong className="text-[12px] font-black text-[#2563eb]">
                    리서치 브리프
                  </strong>
                  <ul className="mt-2 space-y-1.5 text-[11px] font-semibold leading-5 text-[#55739b]">
                    {researchAudit.researchBrief.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl bg-white/75 p-4">
                  <strong className="text-[12px] font-black text-[#a96a0d]">
                    제출 전 최소 보완
                  </strong>
                  <ul className="mt-2 space-y-1.5 text-[11px] font-semibold leading-5 text-[#806b4e]">
                    {(researchAudit.minimumActions.length
                      ? researchAudit.minimumActions
                      : ["현재 기준에서 별도 차단 항목은 없습니다."]
                    )
                      .slice(0, 6)
                      .map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                  </ul>
                </div>
              </div>
            </section>

            <section
              className={`rounded-2xl border p-5 sm:p-6 ${
                evidenceAudit.level === "제출 가능"
                  ? "border-[#cfe8df] bg-[#f3fbf8]"
                  : evidenceAudit.level === "보완 필요"
                    ? "border-[#eadfc5] bg-[#fffbf2]"
                    : "border-[#f1d7dc] bg-[#fff7f8]"
              }`}
            >
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div>
                  <p className="text-[10px] font-black tracking-[0.14em] text-[#2563eb]">
                    EVIDENCE AUDIT
                  </p>
                  <h4 className="mt-1.5 text-[16px] font-black text-[#263853]">
                    근거 신뢰도와 제출 준비도
                  </h4>
                  <p className="mt-2 text-[12px] leading-6 text-[#68788e]">
                    이 점수는 원문 미리보기, 항목별 신뢰도, 정량 근거, 보완
                    질문 답변, 생성 산출물 여부를 합산한 최종본 준비 지표입니다.
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-5 py-4 text-center shadow-sm">
                  <span className="mx-auto grid size-10 place-items-center rounded-xl bg-[#eaf1ff] text-[#2563eb]">
                    <Gauge size={17} />
                  </span>
                  <strong className="mt-2 block text-[28px] font-black tracking-[-0.05em] text-[#10213d]">
                    {evidenceAudit.score}
                    <span className="ml-1 text-[12px] text-[#9aa6b7]">
                      /100
                    </span>
                  </strong>
                  <p className="text-[11px] font-black text-[#52657d]">
                    {evidenceAudit.level}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "근거 신뢰도",
                    value: `높음 ${evidenceAudit.confidenceCounts["높음"]} · 중간 ${evidenceAudit.confidenceCounts["중간"]} · 낮음 ${evidenceAudit.confidenceCounts["낮음"]}`,
                    help: "항목별 리뷰가 실제 근거에 얼마나 가까운지 보여줍니다.",
                  },
                  {
                    label: "보완 질문",
                    value: `${evidenceAudit.answeredQuestions}/${evidenceAudit.totalQuestions}`,
                    help: "미답변 질문은 최종 산출물의 약한 근거로 남습니다.",
                  },
                  {
                    label: "정량/원문 근거",
                    value: `${evidenceAudit.hasQuantitativeEvidence ? "정량 있음" : "정량 부족"} · ${evidenceAudit.hasTextPreview ? "원문 일부 확인" : "원문 미확인"}`,
                    help: "성과 수치와 원문 미리보기는 신뢰도를 크게 높입니다.",
                  },
                  {
                    label: "정확도 검토",
                    value: `${evidenceAudit.accuracy.score}/100 · ${evidenceAudit.accuracy.level}`,
                    help: `${evidenceAudit.accuracy.verifiedClaims}/${evidenceAudit.accuracy.totalClaims}개 핵심 주장이 직접 또는 부분 근거와 연결되었습니다.`,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm"
                  >
                    <strong className="text-[12px] font-black text-[#40536d]">
                      {item.label}
                    </strong>
                    <p className="mt-1 text-[13px] font-extrabold text-[#263853]">
                      {item.value}
                    </p>
                    <p className="mt-2 text-[11px] font-semibold leading-5 text-[#7d8da2]">
                      {item.help}
                    </p>
                  </div>
                ))}
              </div>

              {evidenceAudit.requiredActions.length ? (
                <div className="mt-4 rounded-2xl bg-white/75 p-4">
                  <strong className="text-[12px] font-black text-[#a96a0d]">
                    제출 전 보완 액션
                  </strong>
                  <ul className="mt-2 space-y-1.5 text-[11px] font-semibold leading-5 text-[#806b4e]">
                    {evidenceAudit.requiredActions.map((action) => (
                      <li key={action}>- {action}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-[#d9e4f4] bg-white p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div>
                  <p className="text-[10px] font-black tracking-[0.14em] text-[#2563eb]">
                    ACCURACY REVIEW
                  </p>
                  <h4 className="mt-1.5 text-[15px] font-black text-[#263853]">
                    분석 정확도와 주장별 검증 상태
                  </h4>
                  <p className="mt-2 text-[12px] leading-6 text-[#6f7f94]">
                    {accuracyReport.summary}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#f6f8fb] px-5 py-4 text-center">
                  <strong className="block text-[26px] font-black tracking-[-0.05em] text-[#10213d]">
                    {accuracyReport.overallScore}
                    <span className="ml-1 text-[12px] text-[#9aa6b7]">
                      /100
                    </span>
                  </strong>
                  <p className="text-[11px] font-black text-[#52657d]">
                    정확도 {accuracyReport.level}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "검토 항목",
                    value: `${accuracyReport.sourceCoverage.reviewedItems}개`,
                    help: "원문 조각과 구조화된 분석 항목을 합산한 검토 단위입니다.",
                  },
                  {
                    label: "직접 근거",
                    value: `${accuracyReport.sourceCoverage.directEvidenceItems}개`,
                    help: "첨부 파일 텍스트 미리보기에서 직접 확인된 항목입니다.",
                  },
                  {
                    label: "추론 항목",
                    value: `${accuracyReport.sourceCoverage.inferredItems}개`,
                    help: "파일명, 유형, 프로젝트 프로필을 바탕으로 재구성한 항목입니다.",
                  },
                  {
                    label: "검증된 주장",
                    value: `${accuracyReport.sourceCoverage.verifiedClaims}/${accuracyReport.sourceCoverage.totalClaims}`,
                    help: "주요 주장 중 직접/부분 근거와 연결된 비율입니다.",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-[#e3ebf5] bg-[#fbfcfe] p-4"
                  >
                    <strong className="text-[12px] font-black text-[#40536d]">
                      {item.label}
                    </strong>
                    <p className="mt-1 text-[16px] font-black text-[#10213d]">
                      {item.value}
                    </p>
                    <p className="mt-2 text-[11px] font-semibold leading-5 text-[#7d8da2]">
                      {item.help}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3">
                {accuracyReport.claimChecks.map((check) => (
                  <article
                    key={check.id}
                    className="rounded-2xl border border-[#e3ebf5] bg-[#fbfcfe] p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="rounded-lg bg-[#10213d] px-2.5 py-1 text-[10px] font-black text-white">
                            {check.label}
                          </strong>
                          <span
                            className={`rounded-full border px-3 py-1 text-[10px] font-black ${getEvidenceLevelTone(check.evidenceLevel)}`}
                          >
                            {check.evidenceLevel}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1 text-[10px] font-black ${getConfidenceTone(check.confidence)}`}
                          >
                            정확도 {check.confidence}
                          </span>
                        </div>
                        <p className="mt-3 text-[12px] font-semibold leading-6 text-[#40536d]">
                          {check.claim}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 lg:grid-cols-3">
                      <div className="rounded-2xl bg-white p-3.5 shadow-sm">
                        <h5 className="text-[11px] font-black text-[#31435d]">
                          연결 근거
                        </h5>
                        <p className="mt-2 text-[11px] leading-5 text-[#68788e]">
                          {check.evidenceSource}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white p-3.5 shadow-sm">
                        <h5 className="text-[11px] font-black text-[#a96a0d]">
                          정확도 리스크
                        </h5>
                        <p className="mt-2 text-[11px] leading-5 text-[#806b4e]">
                          {check.accuracyRisk}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white p-3.5 shadow-sm">
                        <h5 className="text-[11px] font-black text-[#2563eb]">
                          검증 액션
                        </h5>
                        <p className="mt-2 text-[11px] leading-5 text-[#55739b]">
                          {check.verificationAction}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-[#f0dfc2] bg-[#fffaf0] p-4">
                  <h5 className="text-[12px] font-black text-[#8d5c15]">
                    정확도 한계
                  </h5>
                  <ul className="mt-3 space-y-2 text-[11px] font-semibold leading-5 text-[#806b4e]">
                    {accuracyReport.limitations.map((limitation) => (
                      <li key={limitation}>- {limitation}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-[#dbe7f8] bg-[#f8fbff] p-4">
                  <h5 className="text-[12px] font-black text-[#2563eb]">
                    제출 전 검증 액션
                  </h5>
                  <ul className="mt-3 space-y-2 text-[11px] font-semibold leading-5 text-[#55739b]">
                    {accuracyReport.verificationActions.map((action) => (
                      <li key={action}>- {action}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

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
                    <p className="mt-1 text-[11px] font-semibold leading-5 text-[#7d8da2]">
                      파일명, 형식, 텍스트 미리보기에서 프로젝트 성격을 판단한 단서입니다.
                    </p>
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
                    <p className="mt-1 text-[11px] font-semibold leading-5 text-[#7d8da2]">
                      최종 포트폴리오에 그대로 넣기 전 확인해야 할 근거 품질입니다.
                    </p>
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

            <section className="rounded-2xl border border-[#d9e4f4] bg-[#fbfdff] p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div>
                    <p className="text-[10px] font-black tracking-[0.14em] text-[#2563eb]">
                      ITEM-BY-ITEM REVIEW
                    </p>
                    <h4 className="mt-1.5 text-[15px] font-black text-[#263853]">
                      항목별 정밀 분석
                    </h4>
                    <p className="mt-2 text-[12px] leading-6 text-[#6f7f94]">
                      {detailedReview.reviewMethod}
                    </p>
                    <p className="mt-2 text-[12px] leading-6 text-[#52657d]">
                      {detailedReview.coverageSummary}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#eaf1ff] px-3 py-1.5 text-[11px] font-black text-[#2563eb]">
                    {detailedReview.itemReviews.length}개 항목 검토
                  </span>
                </div>

                <div className="mt-5 grid gap-3">
                  {detailedReview.itemReviews.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-[#e2e9f2] bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-[#10213d] px-2.5 py-1 text-[10px] font-black text-white">
                              {String(item.order).padStart(2, "0")}
                            </span>
                            <span className="rounded-lg bg-[#eef4ff] px-2.5 py-1 text-[10px] font-black text-[#2563eb]">
                              {item.sourceLabel}
                            </span>
                            <span className="rounded-lg bg-[#f6f8fb] px-2.5 py-1 text-[10px] font-black text-[#65758b]">
                              {item.analysisFocus}
                            </span>
                          </div>
                          <p className="mt-3 rounded-xl bg-[#f8fafc] px-3.5 py-3 text-[12px] leading-6 text-[#52657d]">
                            {item.sourceExcerpt}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-black ${getConfidenceTone(item.confidence)}`}
                        >
                          근거 신뢰도 {item.confidence}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 lg:grid-cols-3">
                        <div className="rounded-2xl border border-[#e5ebf2] bg-[#fbfcfe] p-3.5">
                          <h5 className="text-[11px] font-black text-[#31435d]">
                            컨설턴트 진단
                          </h5>
                          <p className="mt-2 text-[11px] leading-5 text-[#68788e]">
                            {item.consultantDiagnosis}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-[#dbe7f8] bg-[#f8fbff] p-3.5">
                          <h5 className="text-[11px] font-black text-[#2563eb]">
                            포트폴리오 활용
                          </h5>
                          <p className="mt-2 text-[11px] leading-5 text-[#55739b]">
                            {item.portfolioImplication}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-[#eadfc5] bg-[#fffbf2] p-3.5">
                          <h5 className="text-[11px] font-black text-[#a96a0d]">
                            추가 확인
                          </h5>
                          <p className="mt-2 text-[11px] leading-5 text-[#806b4e]">
                            {item.requiredFollowUp}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-[#e3ebf5] bg-white p-4">
                    <h5 className="text-[12px] font-black text-[#31435d]">
                      종합 해석
                    </h5>
                    <ul className="mt-3 space-y-2.5">
                      {detailedReview.synthesisPoints.map((point) => (
                        <li
                          key={point}
                          className="flex gap-2 text-[12px] leading-6 text-[#66758c]"
                        >
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#2563eb]" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-[#f0dfc2] bg-[#fffaf0] p-4">
                    <h5 className="text-[12px] font-black text-[#8d5c15]">
                      아직 필요한 근거
                    </h5>
                    <ul className="mt-3 space-y-3">
                      {detailedReview.missingEvidence.map((gap) => (
                        <li
                          key={gap.area}
                          className="rounded-xl bg-white px-3 py-2.5 text-[11px] leading-5 text-[#806b4e] shadow-sm"
                        >
                          <strong className="block text-[#a96a0d]">
                            {gap.area}
                          </strong>
                          {gap.issue}
                          <span className="mt-1.5 block font-semibold text-[#6f5c43]">
                            필요 근거: {gap.requiredEvidence}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
            </section>

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
                    className="pf-item-card p-5"
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
                    <p className="mt-3 rounded-xl bg-white px-3 py-2 text-[11px] font-semibold leading-5 text-[#7d8da2] shadow-sm">
                      {section.help}
                    </p>
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
                <p className="mt-3 rounded-xl bg-white px-3 py-2 text-[11px] font-semibold leading-5 text-[#5f789b]">
                  이 항목은 포트폴리오에서 어떤 각도로 보여줘야 설득력이 생기는지 알려줍니다.
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
                <p className="mt-4 rounded-xl bg-white px-3 py-2 text-[11px] font-semibold leading-5 text-[#806b4e] shadow-sm">
                  보완 필요점은 단점 목록이 아니라, 최종 제출 전 근거를 더 선명하게 만드는 작업 순서입니다.
                </p>
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
                      <p className="mt-2 text-[11px] font-semibold leading-5 text-[#8794a6]">
                        답변에는 수치, 기준 시점, 본인 역할, 사용한 자료를 함께 적는 것이 좋습니다.
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
                        <span>
                        <strong className="block text-[11px] font-extrabold leading-5">
                          {action.label}
                        </strong>
                        <span className={`mt-1 block text-[10px] font-semibold leading-4 ${
                          action.primary ? "text-white/75" : "text-[#7d8da2]"
                        }`}>
                          {action.description}
                        </span>
                        </span>
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
