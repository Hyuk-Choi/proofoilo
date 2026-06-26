"use client";

import {
  BadgeCheck,
  BriefcaseBusiness,
  Fingerprint,
  LoaderCircle,
  Pencil,
  RefreshCcw,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import {
  ArtifactResultActions,
  ExampleHint,
  FieldHelp,
  NextStepCard,
  NoAnalysisForArtifact,
  SectionGuide,
} from "@/components/artifacts/artifact-workspace";
import { useProofolioWorkspace } from "@/hooks/use-proofolio-workspace";
import { generatePersonalBrand } from "@/lib/ai";
import type { PersonalBrandProfile } from "@/types/proofolio";

function buildBrandCopy(profile: PersonalBrandProfile) {
  return [
    `${profile.name} | ${profile.targetRole}`,
    "",
    `[브랜드 헤드라인]`,
    profile.headline,
    "",
    `[포지셔닝]`,
    profile.positioning,
    "",
    `[프로페셔널 요약]`,
    profile.professionalSummary,
    "",
    `[핵심 가치 제안]`,
    profile.valueProposition,
    "",
    `[핵심 강점]`,
    ...profile.strengths.map(
      (strength) =>
        `- ${strength.title}: ${strength.description}\n  근거: ${strength.evidenceProjects.join(", ")}`,
    ),
    "",
    `[브랜드 키워드]`,
    profile.keywords.join(", "),
    "",
    `[1분 자기소개]`,
    profile.interviewIntroduction,
  ].join("\n");
}

export function PersonalBrandView() {
  const { workspace, setWorkspace } = useProofolioWorkspace();
  const analyses = useMemo(() => workspace.analyses, [workspace.analyses]);
  const profile = workspace.personalBrand;
  const [name, setName] = useState(
    workspace.userProfile.name || profile?.name || "",
  );
  const [targetRole, setTargetRole] = useState(
    workspace.userProfile.targetRole ||
      profile?.targetRole ||
      "브랜드 전략 마케터",
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const headlineRef = useRef<HTMLTextAreaElement>(null);

  if (!analyses.length) {
    return <NoAnalysisForArtifact artifactName="개인 브랜드 프로필" />;
  }

  const isOutdated =
    profile &&
    (profile.sourceAnalysisIds.length !== analyses.length ||
      analyses.some(
        (analysis) => !profile.sourceAnalysisIds.includes(analysis.id),
      ));
  const copyContent = profile ? buildBrandCopy(profile) : "";

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const generated = await generatePersonalBrand(analyses, {
        name,
        targetRole,
      });
      setWorkspace((current) => ({
        ...current,
        personalBrand: generated,
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const updateProfile = (
    updater: (current: PersonalBrandProfile) => PersonalBrandProfile,
  ) => {
    setWorkspace((current) => {
      if (!current.personalBrand) return current;
      return {
        ...current,
        personalBrand: updater(current.personalBrand),
      };
    });
  };

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="pf-tag pf-tag-primary">
            <Fingerprint size={14} />
            PERSONAL BRAND IDENTITY
          </p>
          <h2 className="mt-3 text-[29px] font-black tracking-[-0.045em] text-[#10213d]">
            프로젝트 근거로 나라는 사람을 브랜딩하세요
          </h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#6f7f94]">
            분석된 프로젝트 전반에서 드러난 판단 방식과 강점을 찾아
            헤드라인, 포지셔닝, 핵심 가치와 1분 자기소개로 정리합니다.
          </p>
          <ExampleHint>
            예: ‘시장 자료를 해석해 브랜드 메시지로 전환하는 마케터’처럼 나를 한 문장으로 정의합니다.
          </ExampleHint>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="pf-tag min-h-9 rounded-xl px-3.5">
            근거 프로젝트 {analyses.length}개
          </span>
          <span
            className={`pf-tag min-h-9 rounded-xl px-3.5 ${
              profile
                ? "border-[#d9ebe5] bg-[#f3fbf8] text-[#168765]"
                : ""
            }`}
          >
            {profile ? "브랜드 프로필 준비 완료" : "프로필 미생성"}
          </span>
        </div>
      </section>

      <section className="pf-card p-6 sm:p-7">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <p className="text-[10px] font-black tracking-[0.14em] text-[#2563eb]">
              BRAND SETTINGS
            </p>
            <h3 className="mt-1.5 text-[16px] font-black text-[#263853]">
              브랜딩 기준을 설정하세요
            </h3>
            <p className="mt-1.5 text-[12px] leading-6 text-[#8996a8]">
              이름과 목표 직무를 기준으로 같은 경험도 다른 커리어 메시지로
              재구성합니다.
            </p>
          </div>
          <ArtifactResultActions
            content={copyContent}
            hasResult={Boolean(profile)}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
            onEdit={() => headlineRef.current?.focus()}
          />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-2 flex items-center gap-2 text-[12px] font-extrabold text-[#40536d]">
              <UserRound size={14} className="text-[#2563eb]" />
              이름
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-12 w-full rounded-xl border border-[#dce4ef] bg-[#fafbfd] px-4 text-[13px] font-bold text-[#40536d] outline-none transition focus:border-[#8faef0] focus:bg-white"
            />
            <FieldHelp>
              이 이름은 브랜딩 헤드라인, 자기소개, 최종 Export 제목에 사용됩니다.
            </FieldHelp>
          </label>
          <label>
            <span className="mb-2 flex items-center gap-2 text-[12px] font-extrabold text-[#40536d]">
              <Target size={14} className="text-[#2563eb]" />
              목표 직무
            </span>
            <input
              value={targetRole}
              onChange={(event) => setTargetRole(event.target.value)}
              className="h-12 w-full rounded-xl border border-[#dce4ef] bg-[#fafbfd] px-4 text-[13px] font-bold text-[#40536d] outline-none transition focus:border-[#8faef0] focus:bg-white"
            />
            <FieldHelp>
              목표 직무에 따라 같은 경험도 브랜드, 퍼포먼스, 콘텐츠, PM 관점으로 다르게 해석됩니다.
            </FieldHelp>
          </label>
        </div>

        {isOutdated && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#eadfc5] bg-[#fffbf2] px-4 py-3 text-[11px] leading-6 text-[#8d6a31]">
            <RefreshCcw size={13} className="mt-0.5 shrink-0" />
            분석 프로젝트가 변경되었습니다. 다시 생성하면 최신 근거가 브랜드
            프로필에 반영됩니다.
          </div>
        )}
      </section>

      {profile ? (
        <>
          <SectionGuide title="브랜딩 결과 읽는 방법">
            헤드라인은 첫인상, 포지셔닝은 지원 직무에서의 차별점, 핵심 가치
            제안은 회사가 기대할 수 있는 기여를 뜻합니다. 아래 강점은 반드시
            실제 프로젝트 근거와 함께 사용해야 설득력이 생깁니다.
          </SectionGuide>

          <section className="pf-card overflow-hidden">
            <div className="bg-[#10213d] px-6 py-8 text-white sm:px-8 sm:py-10">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                <div className="max-w-4xl">
                  <p className="text-[10px] font-black tracking-[0.16em] text-[#8eb5ff]">
                    {profile.name.toUpperCase()} · {profile.targetRole}
                  </p>
                  <textarea
                    ref={headlineRef}
                    value={profile.headline}
                    onChange={(event) =>
                      updateProfile((current) => ({
                        ...current,
                        headline: event.target.value,
                      }))
                    }
                    rows={3}
                    aria-label="개인 브랜드 헤드라인 편집기"
                    className="mt-3 w-full resize-y border-0 bg-transparent text-[24px] font-black leading-[1.45] tracking-[-0.04em] text-white outline-none"
                  />
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-[11px] font-extrabold text-white/75">
                  <BadgeCheck size={14} className="text-[#8eb5ff]" />
                  프로젝트 근거 기반
                </span>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {profile.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-extrabold text-white/70"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-5 p-6 sm:p-8 lg:grid-cols-2">
              {[
                {
                  label: "포지셔닝",
                  value: profile.positioning,
                  key: "positioning" as const,
                },
                {
                  label: "프로페셔널 요약",
                  value: profile.professionalSummary,
                  key: "professionalSummary" as const,
                },
                {
                  label: "핵심 가치 제안",
                  value: profile.valueProposition,
                  key: "valueProposition" as const,
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className={`pf-card-muted p-5 ${
                    item.key === "valueProposition" ? "lg:col-span-2" : ""
                  }`}
                >
                  <span className="text-[10px] font-black tracking-[0.13em] text-[#2563eb]">
                    {item.label}
                  </span>
                  <span className="mt-2 block rounded-xl bg-white px-3 py-2 text-[11px] font-semibold leading-5 text-[#7d8da2] shadow-sm">
                    {item.key === "positioning"
                      ? "지원 직무에서 나를 어떤 후보자로 기억하게 할지 정리합니다."
                      : item.key === "professionalSummary"
                        ? "여러 프로젝트에서 반복 확인되는 업무 방식과 강점을 요약합니다."
                        : "회사 입장에서 기대할 수 있는 구체적인 기여 가치를 설명합니다."}
                  </span>
                  <textarea
                    value={item.value}
                    onChange={(event) =>
                      updateProfile((current) => ({
                        ...current,
                        [item.key]: event.target.value,
                      }))
                    }
                    rows={item.key === "valueProposition" ? 3 : 6}
                    className="mt-3 w-full resize-y border-0 bg-transparent text-[13px] font-medium leading-[1.9] text-[#52657d] outline-none"
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(330px,0.8fr)]">
            <div className="pf-card p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-[#eaf1ff] text-[#2563eb]">
                  <Sparkles size={17} />
                </span>
                <div>
                  <h3 className="text-[13px] font-black text-[#30425c]">
                    나를 설명하는 핵심 강점
                  </h3>
                  <p className="mt-1 text-[11px] text-[#919dae]">
                    강점 문장은 직접 수정하면 자동 저장됩니다.
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {profile.strengths.map((strength, index) => (
                  <article
                    key={`${strength.title}-${index}`}
                    className="pf-card-muted p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-[13px] font-black text-[#30425c]">
                        {strength.title}
                      </strong>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold text-[#687a91]">
                        근거 {strength.evidenceProjects.length}개
                      </span>
                    </div>
                    <p className="mt-2 rounded-xl bg-white px-3 py-2 text-[11px] font-semibold leading-5 text-[#7d8da2] shadow-sm">
                      이 강점은 자기소개서, 면접 1분 소개, 포트폴리오 첫 페이지에
                      반복 사용할 수 있는 핵심 메시지입니다.
                    </p>
                    <textarea
                      value={strength.description}
                      onChange={(event) =>
                        updateProfile((current) => ({
                          ...current,
                          strengths: current.strengths.map(
                            (currentStrength, currentIndex) =>
                              currentIndex === index
                                ? {
                                    ...currentStrength,
                                    description: event.target.value,
                                  }
                                : currentStrength,
                          ),
                        }))
                      }
                      rows={4}
                      className="mt-3 w-full resize-y border-0 bg-transparent text-[12px] leading-[1.8] text-[#5d6f86] outline-none"
                    />
                    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#e5eaf1] pt-3">
                      {strength.evidenceProjects.map((project) => (
                        <span
                          key={project}
                          className="rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-[#728198]"
                        >
                          {project}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <section className="pf-card p-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-[#f0edff] text-[#7157d9]">
                    <BriefcaseBusiness size={17} />
                  </span>
                  <div>
                    <h3 className="text-[12px] font-black text-[#30425c]">
                      추천 직무 포지션
                    </h3>
                    <p className="mt-1 text-[11px] text-[#919dae]">
                      프로젝트 역량 조합 기준
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.targetRoles.map((role) => (
                    <span
                      key={role}
                      className="rounded-full border border-[#ddd7fa] bg-[#f6f4ff] px-3 py-1.5 text-[11px] font-extrabold text-[#6552bd]"
                    >
                      {role}
                    </span>
                  ))}
                </div>
                <p className="mt-4 rounded-xl bg-[#f8fbff] px-3 py-2 text-[11px] font-semibold leading-5 text-[#66758c]">
                  추천 직무는 현재 프로젝트 근거와 반복 역량을 기준으로 제안됩니다.
                  실제 지원 전에는 회사 JD와 키워드를 비교해 조정하세요.
                </p>
              </section>

              <section className="pf-card p-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-[#e8f7f1] text-[#15966f]">
                    <Pencil size={17} />
                  </span>
                  <div>
                    <h3 className="text-[12px] font-black text-[#30425c]">
                      1분 자기소개
                    </h3>
                    <p className="mt-1 text-[11px] text-[#919dae]">
                      면접과 네트워킹에 활용할 수 있습니다.
                    </p>
                  </div>
                </div>
                <textarea
                  value={profile.interviewIntroduction}
                  onChange={(event) =>
                    updateProfile((current) => ({
                      ...current,
                      interviewIntroduction: event.target.value,
                    }))
                  }
                  rows={12}
                  className="pf-editor mt-4 p-4 text-[13px] leading-[1.9]"
                />
                <p className="mt-3 text-[11px] font-semibold leading-5 text-[#7d8da2]">
                  1분 자기소개는 헤드라인, 대표 강점, 프로젝트 근거, 지원 직무
                  연결 순서로 말하면 가장 안정적으로 들립니다.
                </p>
              </section>
            </div>
          </section>

          <NextStepCard
            title="브랜드 메시지를 역량 근거와 함께 점검하세요"
            description="스킬 분석에서 역량별 점수와 프로젝트 근거를 확인하고, 보완이 필요한 능력을 다음 프로젝트 계획에 반영할 수 있습니다."
            primaryHref="/skill-analysis"
            primaryLabel="스킬 분석 보기"
            primaryIcon={Sparkles}
            secondaryHref="/portfolio"
            secondaryLabel="포트폴리오에 적용"
          />
        </>
      ) : (
        <section className="grid min-h-[430px] place-items-center rounded-3xl border border-dashed border-[#cfd9e8] bg-white px-8 py-14 text-center">
          <div className="max-w-md">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#eaf1ff] text-[#2563eb]">
              {isGenerating ? (
                <LoaderCircle size={24} className="animate-spin" />
              ) : (
                <Fingerprint size={24} />
              )}
            </span>
            <h3 className="mt-5 text-[16px] font-black text-[#263853]">
              프로젝트를 종합한 개인 브랜드를 생성하세요
            </h3>
            <p className="mt-2 text-[12px] leading-6 text-[#8996a8]">
              반복적으로 나타난 역량과 판단 방식을 찾아 헤드라인, 강점,
              포지셔닝과 1분 자기소개로 정리합니다.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
