"use client";

import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Clock3,
  FileCheck2,
  FileText,
  FolderKanban,
  MessageSquareMore,
  MoreHorizontal,
  Plus,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { ExampleHint } from "@/components/artifacts/artifact-workspace";
import { ProofolioButton } from "@/components/ui/proofolio-button";
import { useProofolioWorkspace } from "@/hooks/use-proofolio-workspace";
import { createDashboardData } from "@/lib/dashboard/create-dashboard-data";
import type { DashboardMetric, ProjectStatus } from "@/types/proofolio";

const metricIcons = [UploadCloud, FileCheck2, CircleGauge, MessageSquareMore];

const metricTone: Record<DashboardMetric["tone"], string> = {
  blue: "bg-[#eaf1ff] text-[#2563eb]",
  green: "bg-[#e8f7f1] text-[#15966f]",
  violet: "bg-[#f0edff] text-[#7157d9]",
  amber: "bg-[#fff4df] text-[#c77b0d]",
};

const statusTone: Record<ProjectStatus, string> = {
  "분석 완료": "bg-[#e8f7f1] text-[#168765]",
  "검토 필요": "bg-[#fff4df] text-[#b66b08]",
  "포트폴리오 생성": "bg-[#eaf1ff] text-[#2563eb]",
};

export function DashboardView() {
  const { workspace } = useProofolioWorkspace();
  const {
    metrics: dashboardMetrics,
    recentProjects,
    workflowSummary,
  } = useMemo(() => createDashboardData(workspace), [workspace]);
  const recommendedProject =
    recentProjects.find((project) => project.status === "검토 필요") ??
    recentProjects[0];
  const recommendation = recommendedProject
    ? {
        title: "분석 리포트 확인",
        description:
          recommendedProject.status === "검토 필요"
            ? `${recommendedProject.title}의 보완 질문에 답하면 생성 결과의 근거가 더 선명해집니다.`
            : `${recommendedProject.title}의 분석 리포트를 검토하고 다음 결과물을 선택하세요.`,
        href: "/analysis",
      }
    : {
        title: "첫 프로젝트 업로드",
        description:
          "프로젝트 자료를 추가하면 문제 정의, 역할과 직무 역량을 분석 리포트로 정리합니다.",
        href: "/upload",
      };
  const displayName = workspace.userProfile.name || "사용자";

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#dce7f8] bg-white px-3 py-1.5 text-[10px] font-extrabold text-[#37659f] shadow-sm">
            <Sparkles size={12} className="text-[#2563eb]" />
            오늘도 커리어 근거를 한 단계 더 선명하게
          </div>
          <h2 className="mt-4 text-[30px] font-black tracking-[-0.045em] text-[#10213d]">
            안녕하세요, {displayName}님
          </h2>
          <p className="mt-2 text-[13px] leading-6 text-[#6f7f94]">
            업로드한 프로젝트를 채용 담당자가 이해하는 직무 역량으로 정리하고 있습니다.
          </p>
          <ExampleHint>
            예: 자기소개서 초안, PPT 기획서, 광고 성과표를 올리면 분석 → 포트폴리오 → 피드백 순서로 진행합니다.
          </ExampleHint>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <ProofolioButton
            href="/upload"
            label="파일 업로드"
            icon={UploadCloud}
            variant="secondary"
          />
          <ProofolioButton
            href="/portfolio"
            label="포트폴리오 생성"
            icon={Sparkles}
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric, index) => {
          const Icon = metricIcons[index];

          return (
            <article
              key={metric.label}
              className="pf-card p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <span
                  className={`grid size-10 place-items-center rounded-xl ${metricTone[metric.tone]}`}
                >
                  <Icon size={19} strokeWidth={2.2} />
                </span>
                <span className="rounded-full bg-[#f3f6fa] px-2.5 py-1 text-[11px] font-extrabold text-[#6e7e93]">
                  {metric.trend}
                </span>
              </div>
              <p className="mt-5 text-[12px] font-bold text-[#78879a]">{metric.label}</p>
              <strong className="mt-1 block text-[29px] font-black tracking-[-0.04em] text-[#142541]">
                {metric.value}
              </strong>
              <p className="mt-1 text-[11px] font-medium text-[#9aa6b6]">{metric.detail}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
        <article className="pf-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#e9eef4] px-5 py-4.5">
            <div>
              <h3 className="text-[15px] font-black tracking-[-0.025em] text-[#1b2d48]">
                최근 분석된 파일
              </h3>
              <p className="mt-1 text-[12px] text-[#8b98a9]">
                최근 업데이트된 프로젝트와 분석 상태입니다.
              </p>
            </div>
            <Link
              href="/analysis"
              className="inline-flex items-center gap-1 text-[12px] font-extrabold text-[#2563eb] hover:text-[#1d4ed8]"
            >
              전체 보기
              <ArrowRight size={13} />
            </Link>
          </div>

          {recentProjects.length ? (
            <div className="divide-y divide-[#edf1f5]">
              {recentProjects.map((project) => (
              <div
                key={project.id}
                className="group grid gap-4 px-5 py-4 transition hover:bg-[#fafcff] md:grid-cols-[minmax(0,1.5fr)_minmax(150px,0.65fr)_120px_32px] md:items-center"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eef3fa] text-[#406184]">
                    <FileText size={20} />
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate text-[13px] font-extrabold text-[#263853]">
                      {project.title}
                    </strong>
                    <span className="mt-1 flex items-center gap-2 text-[11px] font-medium text-[#909cad]">
                      <span className="rounded bg-[#eef2f7] px-1.5 py-0.5 font-extrabold text-[#62738a]">
                        {project.fileType}
                      </span>
                      <span className="truncate">{project.fileName}</span>
                    </span>
                  </span>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-[#9aa5b4]">발견된 핵심 역량</p>
                  <p className="mt-1 text-[12px] font-extrabold text-[#52657d]">
                    {project.competency}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 md:block">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ${statusTone[project.status]}`}
                  >
                    {project.status}
                  </span>
                  <span className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-[#9da8b6]">
                    <Clock3 size={10} />
                    {project.analyzedAt}
                  </span>
                </div>

                <button
                  type="button"
                  className="hidden size-8 place-items-center rounded-lg text-[#9aa5b4] transition hover:bg-[#edf2f7] hover:text-[#52657d] md:grid"
                  aria-label={`${project.title} 더보기`}
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>
              ))}
            </div>
          ) : (
            <div className="grid min-h-[300px] place-items-center px-6 py-12 text-center">
              <div className="max-w-sm">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#eef3fa] text-[#6d819b]">
                  <FileText size={21} />
                </span>
                <strong className="mt-4 block text-[14px] font-extrabold text-[#52657d]">
                  아직 분석된 프로젝트가 없습니다
                </strong>
                <p className="mt-1 text-[12px] leading-6 text-[#96a2b1]">
                  파일을 업로드하고 분석을 완료하면 최근 프로젝트와 핵심 역량이
                  이곳에 표시됩니다.
                </p>
                <Link
                  href="/upload"
                  className="pf-button-primary mt-5"
                >
                  <UploadCloud size={14} />
                  파일 업로드
                </Link>
              </div>
            </div>
          )}
        </article>

        <aside className="pf-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-black tracking-[-0.025em] text-[#1b2d48]">
                포트폴리오 준비 현황
              </h3>
              <p className="mt-1 text-[12px] text-[#8b98a9]">전체 프로젝트 기준</p>
            </div>
            <span className="grid size-9 place-items-center rounded-xl bg-[#eaf1ff] text-[#2563eb]">
              <BarChart3 size={17} />
            </span>
          </div>

          <div className="mt-6 space-y-5">
            {workflowSummary.map((item) => {
              const percentage = item.total
                ? Math.round((item.value / item.total) * 100)
                : 0;

              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-extrabold text-[#52657d]">
                      {item.label}
                    </span>
                    <span className="text-[11px] font-bold text-[#8d9bad]">
                      {item.total ? `${item.value}/${item.total}` : "대기"}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#edf1f6]">
                    <span
                      className="block h-full rounded-full bg-[#2563eb]"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl bg-[#10213d] p-4 text-white">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-[#8eb5ff]">
                <CheckCircle2 size={17} />
              </span>
              <div>
                <strong className="text-[12px] font-extrabold">다음 추천 작업</strong>
                <p className="mt-1 text-[11px] leading-5 text-white/60">
                  {recommendation.description}
                </p>
              </div>
            </div>
            <Link
              href={recommendation.href}
              className="mt-4 flex items-center justify-between rounded-xl bg-white/10 px-3 py-2.5 text-[12px] font-extrabold transition hover:bg-white/15"
            >
              {recommendation.title}
              <ChevronRight size={14} />
            </Link>
          </div>
        </aside>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Link
          href="/upload"
          className="group flex items-center gap-4 rounded-2xl border border-[#dce4ef] bg-[#f8fafc] p-4 transition hover:border-[#b8cae4] hover:bg-white"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-white text-[#2563eb] shadow-sm">
            <Plus size={18} />
          </span>
          <span className="flex-1">
            <strong className="block text-[12px] font-extrabold text-[#31435d]">
              새 자료 추가
            </strong>
            <span className="mt-1 block text-[11px] text-[#8a98aa]">
              PDF, PPT, 문서와 이미지를 업로드하세요.
            </span>
          </span>
          <ChevronRight size={15} className="text-[#a6b1bf] group-hover:text-[#2563eb]" />
        </Link>
        <Link
          href="/portfolio"
          className="group flex items-center gap-4 rounded-2xl border border-[#dce4ef] bg-[#f8fafc] p-4 transition hover:border-[#b8cae4] hover:bg-white"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-white text-[#7157d9] shadow-sm">
            <BriefcaseBusiness size={18} />
          </span>
          <span className="flex-1">
            <strong className="block text-[12px] font-extrabold text-[#31435d]">
              포트폴리오 이어서 작성
            </strong>
            <span className="mt-1 block text-[11px] text-[#8a98aa]">
              분석된 역량을 프로젝트 스토리로 정리하세요.
            </span>
          </span>
          <ChevronRight size={15} className="text-[#a6b1bf] group-hover:text-[#2563eb]" />
        </Link>
        <Link
          href="/feedback"
          className="group flex items-center gap-4 rounded-2xl border border-[#dce4ef] bg-[#f8fafc] p-4 transition hover:border-[#b8cae4] hover:bg-white"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-white text-[#15966f] shadow-sm">
            <FolderKanban size={18} />
          </span>
          <span className="flex-1">
            <strong className="block text-[12px] font-extrabold text-[#31435d]">
              전문가 피드백 확인
            </strong>
            <span className="mt-1 block text-[11px] text-[#8a98aa]">
              강점과 보완점을 직무 관점에서 확인하세요.
            </span>
          </span>
          <ChevronRight size={15} className="text-[#a6b1bf] group-hover:text-[#2563eb]" />
        </Link>
      </section>
    </div>
  );
}
