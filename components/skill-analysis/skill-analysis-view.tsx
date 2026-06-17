"use client";

import {
  BarChart3,
  ChartNoAxesCombined,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import {
  ArtifactResultActions,
  ExampleHint,
  NextStepCard,
  NoAnalysisForArtifact,
} from "@/components/artifacts/artifact-workspace";
import { useProofolioWorkspace } from "@/hooks/use-proofolio-workspace";
import { generateSkillAnalysis } from "@/lib/ai";
import type { SkillAnalysisReport } from "@/types/proofolio";

function buildSkillCopy(report: SkillAnalysisReport) {
  return [
    `직무 역량 분석 | 종합 ${report.overallScore}점`,
    "",
    report.summary,
    "",
    "[역량별 분석]",
    ...report.skills.map(
      (skill) =>
        `- ${skill.name} ${skill.score}점 (${skill.level})\n  근거: ${skill.evidence.join(" / ")}\n  보완: ${skill.improvement}`,
    ),
    "",
    "[성장 우선순위]",
    ...report.developmentPriorities.map((priority) => `- ${priority}`),
  ].join("\n");
}

const levelTone = {
  기초: "bg-[#eef1f5] text-[#687a91]",
  활용: "bg-[#eaf1ff] text-[#2563eb]",
  강점: "bg-[#e8f7f1] text-[#168765]",
  "핵심 경쟁력": "bg-[#f0edff] text-[#7157d9]",
} as const;

export function SkillAnalysisView() {
  const { workspace, setWorkspace } = useProofolioWorkspace();
  const analyses = useMemo(() => workspace.analyses, [workspace.analyses]);
  const report = workspace.skillAnalysis;
  const [isGenerating, setIsGenerating] = useState(false);
  const summaryRef = useRef<HTMLTextAreaElement>(null);

  if (!analyses.length) {
    return <NoAnalysisForArtifact artifactName="스킬 분석 리포트" />;
  }

  const isOutdated =
    report &&
    (report.sourceAnalysisIds.length !== analyses.length ||
      analyses.some(
        (analysis) => !report.sourceAnalysisIds.includes(analysis.id),
      ));
  const copyContent = report ? buildSkillCopy(report) : "";

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const generated = await generateSkillAnalysis(analyses);
      setWorkspace((current) => ({
        ...current,
        skillAnalysis: generated,
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const updateReport = (
    updater: (current: SkillAnalysisReport) => SkillAnalysisReport,
  ) => {
    setWorkspace((current) => {
      if (!current.skillAnalysis) return current;
      return {
        ...current,
        skillAnalysis: updater(current.skillAnalysis),
      };
    });
  };

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="pf-tag pf-tag-primary">
            <ChartNoAxesCombined size={14} />
            SKILL INTELLIGENCE
          </p>
          <h2 className="mt-3 text-[29px] font-black tracking-[-0.045em] text-[#10213d]">
            프로젝트로 증명된 나의 스킬을 분석하세요
          </h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#6f7f94]">
            프로젝트별로 사용한 역량의 강도와 근거를 비교하고, 현재 검증
            수준과 다음 성장 우선순위를 구체적으로 제시합니다.
          </p>
          <ExampleHint>
            예: 업로드한 파일에서 시장 분석, 콘텐츠 기획, 광고 성과 해석 같은 반복 역량을 찾습니다.
          </ExampleHint>
        </div>
        <ArtifactResultActions
          content={copyContent}
          hasResult={Boolean(report)}
          isGenerating={isGenerating}
          onGenerate={handleGenerate}
          onEdit={() => summaryRef.current?.focus()}
        />
      </section>

      {isOutdated && (
        <section className="flex items-start gap-3 rounded-2xl border border-[#eadfc5] bg-[#fffbf2] p-4 text-[11px] leading-6 text-[#8d6a31]">
          <TrendingUp size={15} className="mt-0.5 shrink-0" />
          분석 프로젝트가 변경되었습니다. 다시 분석하면 최신 프로젝트의 역량과
          근거가 반영됩니다.
        </section>
      )}

      {report ? (
        <>
          <section className="pf-card overflow-hidden">
            <div className="grid bg-[#10213d] text-white lg:grid-cols-[280px_minmax(0,1fr)]">
              <div className="grid place-items-center border-b border-white/10 p-8 lg:border-b-0 lg:border-r">
                <div className="text-center">
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white/10 text-[#8eb5ff]">
                    <BarChart3 size={22} />
                  </span>
                  <p className="mt-4 text-[10px] font-black tracking-[0.15em] text-[#8eb5ff]">
                    OVERALL SKILL SCORE
                  </p>
                  <strong className="mt-2 block text-[48px] font-black tracking-[-0.06em]">
                    {report.overallScore}
                    <span className="ml-1 text-[14px] text-white/45">
                      / 100
                    </span>
                  </strong>
                  <p className="mt-2 text-[11px] text-white/50">
                    {analyses.length}개 프로젝트 종합
                  </p>
                </div>
              </div>
              <div className="p-7 sm:p-8">
                <p className="text-[10px] font-black tracking-[0.14em] text-[#8eb5ff]">
                  SKILL SUMMARY
                </p>
                <h3 className="mt-2 text-[18px] font-black">
                  강점의 이름보다 근거와 반복성을 확인하세요
                </h3>
                <textarea
                  ref={summaryRef}
                  value={report.summary}
                  onChange={(event) =>
                    updateReport((current) => ({
                      ...current,
                      summary: event.target.value,
                    }))
                  }
                  rows={5}
                  aria-label="스킬 분석 요약 편집기"
                  className="mt-4 w-full resize-y border-0 bg-transparent text-[13px] leading-[1.9] text-white/70 outline-none"
                />
                <div className="mt-5 flex flex-wrap gap-2">
                  {report.skills.slice(0, 5).map((skill) => (
                    <span
                      key={skill.name}
                      className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-extrabold text-white/70"
                    >
                      {skill.name} · {skill.score}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {report.categories.map((category) => (
              <article key={category.name} className="pf-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-[#eaf1ff] text-[#2563eb]">
                    <Target size={15} />
                  </span>
                  <strong className="text-[16px] font-black text-[#263853]">
                    {category.score}
                  </strong>
                </div>
                <h3 className="mt-4 text-[13px] font-black text-[#40536d]">
                  {category.name}
                </h3>
                <p className="mt-1.5 min-h-10 text-[11px] leading-5 text-[#8e9aab]">
                  {category.description}
                </p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#e8edf3]">
                  <span
                    className="block h-full rounded-full bg-[#2563eb]"
                    style={{ width: `${category.score}%` }}
                  />
                </div>
              </article>
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(330px,0.75fr)]">
            <div className="space-y-4">
              {report.skills.map((skill, index) => (
                <article key={skill.name} className="pf-card p-5 sm:p-6">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eef3fa] text-[12px] font-black text-[#52657d]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[13px] font-black text-[#30425c]">
                            {skill.name}
                          </h3>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${levelTone[skill.level]}`}
                          >
                            {skill.level}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[11px] text-[#8e9aab]">
                          {skill.projectCount}개 프로젝트에서 확인
                        </p>
                      </div>
                    </div>
                    <strong className="text-[22px] font-black tracking-[-0.04em] text-[#2563eb]">
                      {skill.score}
                      <span className="ml-1 text-[11px] text-[#9aa5b4]">
                        /100
                      </span>
                    </strong>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8edf3]">
                    <span
                      className="block h-full rounded-full bg-[linear-gradient(90deg,#2563eb,#7157d9)]"
                      style={{ width: `${skill.score}%` }}
                    />
                  </div>
                  <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.65fr)]">
                    <div>
                      <p className="text-[10px] font-black tracking-[0.13em] text-[#7f8da0]">
                        PROJECT EVIDENCE
                      </p>
                      <div className="mt-2 space-y-2">
                        {skill.evidence.map((evidence) => (
                          <p
                            key={evidence}
                            className="flex items-start gap-2 text-[12px] leading-6 text-[#607188]"
                          >
                            <CheckCircle2
                              size={12}
                              className="mt-1 shrink-0 text-[#15966f]"
                            />
                            {evidence}
                          </p>
                        ))}
                      </div>
                    </div>
                    <label className="rounded-2xl border border-[#eadfc5] bg-[#fffbf2] p-4">
                      <span className="flex items-center gap-2 text-[10px] font-black tracking-[0.12em] text-[#a96a0d]">
                        <Lightbulb size={12} />
                        DEVELOPMENT POINT
                      </span>
                      <textarea
                        value={skill.improvement}
                        onChange={(event) =>
                          updateReport((current) => ({
                            ...current,
                            skills: current.skills.map(
                              (currentSkill, currentIndex) =>
                                currentIndex === index
                                  ? {
                                      ...currentSkill,
                                      improvement: event.target.value,
                                    }
                                  : currentSkill,
                            ),
                          }))
                        }
                        rows={5}
                        className="mt-2 w-full resize-y border-0 bg-transparent text-[12px] leading-6 text-[#806b4e] outline-none"
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>

            <aside className="space-y-5">
              <section className="pf-card p-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-[#e8f7f1] text-[#15966f]">
                    <Sparkles size={17} />
                  </span>
                  <h3 className="text-[12px] font-black text-[#30425c]">
                    우선 검증 역량
                  </h3>
                </div>
                <div className="mt-4 space-y-3">
                  {report.topStrengths.map((strength, index) => (
                    <div
                      key={strength}
                      className="rounded-2xl border border-[#dfece7] bg-[#f4fbf8] p-4"
                    >
                      <span className="text-[10px] font-black text-[#15966f]">
                        STRENGTH {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="mt-2 text-[12px] leading-6 text-[#5e7d72]">
                        {strength}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="pf-card p-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-[#fff4df] text-[#c77b0d]">
                    <TrendingUp size={17} />
                  </span>
                  <h3 className="text-[12px] font-black text-[#30425c]">
                    성장 우선순위
                  </h3>
                </div>
                <div className="mt-4 space-y-3">
                  {report.developmentPriorities.map((priority, index) => (
                    <div
                      key={priority}
                      className="grid grid-cols-[26px_minmax(0,1fr)] gap-3 rounded-2xl bg-[#fafbfd] p-4"
                    >
                      <span className="grid size-6 place-items-center rounded-lg bg-white text-[10px] font-black text-[#c77b0d] shadow-sm">
                        {index + 1}
                      </span>
                      <p className="text-[12px] leading-6 text-[#6c7889]">
                        {priority}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </section>

          <NextStepCard
            title="분석된 강점을 나만의 브랜드 메시지로 전환하세요"
            description="상위 스킬과 프로젝트 근거를 개인 브랜드 헤드라인, 포지셔닝과 1분 자기소개에 반영할 수 있습니다."
            primaryHref="/personal-brand"
            primaryLabel="개인 브랜딩 보기"
            primaryIcon={Sparkles}
            secondaryHref="/resume"
            secondaryLabel="이력서 문장에 적용"
          />
        </>
      ) : (
        <section className="grid min-h-[450px] place-items-center rounded-3xl border border-dashed border-[#cfd9e8] bg-white px-8 py-14 text-center">
          <div className="max-w-md">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#eaf1ff] text-[#2563eb]">
              <ChartNoAxesCombined size={24} />
            </span>
            <h3 className="mt-5 text-[16px] font-black text-[#263853]">
              프로젝트 기반 스킬 분석을 시작하세요
            </h3>
            <p className="mt-2 text-[12px] leading-6 text-[#8996a8]">
              역량별 점수, 활용 프로젝트, 근거 문장과 성장 우선순위를 한 번에
              정리합니다.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
