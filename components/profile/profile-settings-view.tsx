"use client";

import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Fingerprint,
  Globe2,
  Link2,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  ExampleHint,
  FieldHelp,
  SectionGuide,
} from "@/components/artifacts/artifact-workspace";
import { useProofolioWorkspace } from "@/hooks/use-proofolio-workspace";
import type {
  CareerStage,
  EmploymentType,
  UserProfile,
} from "@/types/proofolio";

type ProfileSection = "basic" | "career" | "identity" | "links";

type ProfileDraft = Omit<
  UserProfile,
  "targetIndustries" | "coreStrengths" | "workValues" | "updatedAt"
> & {
  targetIndustries: string;
  coreStrengths: string;
  workValues: string;
};

const sections = [
  {
    id: "basic",
    label: "기본 정보",
    description: "이름과 연락처",
    example: "예: 홍길동 / name@example.com / 서울",
    icon: UserRound,
  },
  {
    id: "career",
    label: "커리어 목표",
    description: "직무와 지원 방향",
    example: "예: 브랜드 전략 마케터 / 글로벌 소비재 브랜드",
    icon: Target,
  },
  {
    id: "identity",
    label: "강점과 가치관",
    description: "나를 설명하는 기준",
    example: "예: 시장 분석, 고객 관점, 명확한 커뮤니케이션",
    icon: Fingerprint,
  },
  {
    id: "links",
    label: "링크",
    description: "외부 프로필 연결",
    example: "예: Notion 포트폴리오, LinkedIn",
    icon: Link2,
  },
] as const;

const careerStages: CareerStage[] = [
  "대학생",
  "취업 준비생",
  "신입",
  "주니어",
  "경력",
];

const employmentTypes: EmploymentType[] = [
  "정규직",
  "인턴",
  "계약직",
  "프리랜서",
  "협의 가능",
];

const inputClassName =
  "h-12 w-full rounded-xl border border-[#dce4ef] bg-[#fafbfd] px-4 text-[13px] font-semibold text-[#40536d] outline-none transition placeholder:text-[#a4afbd] focus:border-[#8faef0] focus:bg-white";

function toDraft(profile: UserProfile): ProfileDraft {
  return {
    name: profile.name,
    englishName: profile.englishName,
    email: profile.email,
    phone: profile.phone,
    location: profile.location,
    careerStage: profile.careerStage,
    targetRole: profile.targetRole,
    targetCompany: profile.targetCompany,
    targetIndustries: profile.targetIndustries.join(", "),
    employmentType: profile.employmentType,
    coreStrengths: profile.coreStrengths.join(", "),
    workValues: profile.workValues.join(", "),
    introduction: profile.introduction,
    portfolioUrl: profile.portfolioUrl,
    linkedinUrl: profile.linkedinUrl,
  };
}

function parseList(value: string) {
  return [
    ...new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function getInitials(name: string) {
  const normalized = name.trim();
  if (!normalized) return "ME";

  const words = normalized.split(/\s+/);
  if (words.length > 1) {
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }

  return normalized.slice(0, 2).toUpperCase();
}

function FieldLabel({
  label,
  required = false,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <span className="mb-2 block text-[12px] font-extrabold text-[#40536d]">
      {label}
      {required && <span className="ml-1 text-[#2563eb]">*</span>}
    </span>
  );
}

function PreviewTags({ value }: { value: string }) {
  const tags = parseList(value);
  if (!tags.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="pf-tag bg-white">
          {tag}
        </span>
      ))}
    </div>
  );
}

export function ProfileSettingsView() {
  const { workspace, setWorkspace } = useProofolioWorkspace();
  const [activeSection, setActiveSection] =
    useState<ProfileSection>("basic");
  const [draft, setDraft] = useState<ProfileDraft>(() =>
    toDraft(workspace.userProfile),
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        setDraft(toDraft(workspace.userProfile));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [workspace.userProfile]);

  const normalizedDraft = useMemo(
    () => ({
      ...draft,
      name: draft.name.trim(),
      englishName: draft.englishName.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      location: draft.location.trim(),
      targetRole: draft.targetRole.trim(),
      targetCompany: draft.targetCompany.trim(),
      targetIndustries: parseList(draft.targetIndustries),
      coreStrengths: parseList(draft.coreStrengths),
      workValues: parseList(draft.workValues),
      introduction: draft.introduction.trim(),
      portfolioUrl: draft.portfolioUrl.trim(),
      linkedinUrl: draft.linkedinUrl.trim(),
    }),
    [draft],
  );

  const comparableProfile = {
    ...workspace.userProfile,
    updatedAt: undefined,
  };
  const comparableDraft = {
    ...normalizedDraft,
    updatedAt: undefined,
  };
  const isDirty =
    JSON.stringify(comparableProfile) !== JSON.stringify(comparableDraft);
  const canSave = isDirty;
  const completedFields = [
    normalizedDraft.name,
    normalizedDraft.email,
    normalizedDraft.location,
    normalizedDraft.targetRole,
    normalizedDraft.targetCompany,
    normalizedDraft.targetIndustries.length,
    normalizedDraft.coreStrengths.length,
    normalizedDraft.workValues.length,
    normalizedDraft.introduction,
    normalizedDraft.portfolioUrl || normalizedDraft.linkedinUrl,
  ].filter(Boolean).length;
  const completion = completedFields * 10;

  const updateDraft = <Key extends keyof ProfileDraft>(
    key: Key,
    value: ProfileDraft[Key],
  ) => {
    setSaved(false);
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSave = () => {
    if (!canSave) return;

    const nextProfile: UserProfile = {
      ...normalizedDraft,
      updatedAt: new Date().toISOString(),
    };

    setWorkspace((current) => ({
      ...current,
      userProfile: nextProfile,
    }));
    setSaved(true);
  };

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="pf-tag pf-tag-primary">
            <UserRound size={14} />
            MY PROFILE
          </p>
          <h2 className="mt-3 text-[29px] font-black tracking-[-0.045em] text-[#10213d]">
            내 정보와 커리어 목표를 설정하세요
          </h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#6f7f94]">
            저장한 정보는 개인 브랜딩과 커리어 문서의 기본 설정으로 활용됩니다.
            연락처와 링크는 브라우저의 로컬 저장소에만 보관됩니다.
          </p>
          <ExampleHint>
            예: 목표 직무를 ‘브랜드 전략 마케터’로 설정하면 포트폴리오와 자기소개서 문장이 해당 직무 기준으로 정리됩니다.
          </ExampleHint>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saved && (
            <span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#cfe8df] bg-[#f4fbf8] px-3.5 text-[11px] font-extrabold text-[#168765]">
              <CheckCircle2 size={14} />
              저장 완료
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="pf-button-primary min-h-11 px-5 text-[12px]"
          >
            <Save size={15} />
            변경사항 저장
          </button>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-5 xl:sticky xl:top-[96px] xl:self-start">
          <section className="pf-card overflow-hidden">
            <div className="bg-[#10213d] p-6 text-white">
              <span className="grid size-14 place-items-center rounded-2xl bg-white/10 text-[15px] font-black text-[#b8ceff]">
                {getInitials(draft.name)}
              </span>
              <strong className="mt-4 block text-[17px] font-black">
                {draft.name.trim() || "이름을 입력하세요"}
              </strong>
              <p className="mt-1 text-[12px] text-white/60">
                {draft.targetRole.trim() || "목표 직무를 입력하세요"}
              </p>
              <div className="mt-5 flex items-center justify-between text-[11px]">
                <span className="text-white/50">프로필 완성도</span>
                <strong className="text-[#8eb5ff]">{completion}%</strong>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <span
                  className="block h-full rounded-full bg-[#5e91ff]"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
            <div className="space-y-1 p-3">
              {sections.map((section) => {
                const Icon = section.icon;
                const active = section.id === activeSection;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                      active
                        ? "bg-[#eaf1ff] text-[#1e5bd7]"
                        : "text-[#65758b] hover:bg-[#f6f8fb]"
                    }`}
                  >
                    <span
                      className={`grid size-9 place-items-center rounded-xl ${
                        active ? "bg-white" : "bg-[#f1f4f8]"
                      }`}
                    >
                      <Icon size={15} />
                    </span>
                    <span>
                      <strong className="block text-[12px] font-black">
                        {section.label}
                      </strong>
                      <span className="mt-0.5 block text-[10px] opacity-70">
                        {section.description}
                      </span>
                      <span className="mt-1 block text-[10px] leading-4 opacity-65">
                        {section.example}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-[#d9e5f6] bg-[#f5f8ff] p-5">
            <div className="flex items-center gap-2 text-[#315f9d]">
              <ShieldCheck size={16} />
              <strong className="text-[12px] font-black">저장 안내</strong>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-[#7085a2]">
              입력한 정보는 이 브라우저에 저장되며, 로그인한 경우 같은 계정의
              워크스페이스에도 동기화됩니다.
            </p>
          </section>
        </aside>

        <div className="space-y-5">
          <SectionGuide title="프로필 입력 기준">
            프로필 정보는 단순 연락처가 아니라 생성 문장의 방향을 정하는
            기준입니다. 목표 직무, 관심 산업, 핵심 강점이 구체적일수록
            포트폴리오와 자기소개서가 더 정확하게 맞춰집니다.
          </SectionGuide>

          {activeSection === "basic" && (
            <section className="pf-card p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-[#eaf1ff] text-[#2563eb]">
                  <UserRound size={17} />
                </span>
                <div>
                  <h3 className="text-[15px] font-black text-[#263853]">
                    기본 정보
                  </h3>
                  <p className="mt-1 text-[12px] leading-6 text-[#8996a8]">
                    이력서와 포트폴리오 표지에 사용할 기본 정보를 입력합니다.
                  </p>
                  <p className="mt-2 text-[11px] leading-5 text-[#66758c]">
                    예: 홍길동, Gildong Hong, 서울, 취업 준비생
                  </p>
                </div>
              </div>

              <div className="mt-7 grid gap-5 md:grid-cols-2">
                <label>
                  <FieldLabel label="이름" />
                  <input
                    value={draft.name}
                    onChange={(event) => updateDraft("name", event.target.value)}
                    placeholder="이름을 입력하세요"
                    className={inputClassName}
                  />
                  <FieldHelp>최종 포트폴리오 표지와 Export 파일명에 반영됩니다.</FieldHelp>
                </label>
                <label>
                  <FieldLabel label="영문 이름" />
                  <input
                    value={draft.englishName}
                    onChange={(event) =>
                      updateDraft("englishName", event.target.value)
                    }
                    placeholder="Gildong Hong"
                    className={inputClassName}
                  />
                  <FieldHelp>글로벌 직무나 영문 이력서용 표기에 활용할 수 있습니다.</FieldHelp>
                </label>
                <label>
                  <FieldLabel label="이메일" />
                  <span className="relative block">
                    <Mail
                      size={14}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa7b8]"
                    />
                    <input
                      type="email"
                      value={draft.email}
                      onChange={(event) =>
                        updateDraft("email", event.target.value)
                      }
                      placeholder="name@example.com"
                      className={`${inputClassName} pl-10`}
                    />
                  </span>
                  <FieldHelp>로그인 계정과 지원 문서의 기본 연락처로 사용됩니다.</FieldHelp>
                </label>
                <label>
                  <FieldLabel label="전화번호" />
                  <span className="relative block">
                    <Phone
                      size={14}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa7b8]"
                    />
                    <input
                      value={draft.phone}
                      onChange={(event) =>
                        updateDraft("phone", event.target.value)
                      }
                      placeholder="010-0000-0000"
                      className={`${inputClassName} pl-10`}
                    />
                  </span>
                  <FieldHelp>실제 제출 문서에 사용할 번호만 입력하세요.</FieldHelp>
                </label>
                <label>
                  <FieldLabel label="활동 지역" />
                  <span className="relative block">
                    <MapPin
                      size={14}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa7b8]"
                    />
                    <input
                      value={draft.location}
                      onChange={(event) =>
                        updateDraft("location", event.target.value)
                      }
                      placeholder="서울"
                      className={`${inputClassName} pl-10`}
                    />
                  </span>
                  <FieldHelp>지원 가능 지역이나 현재 활동 기반을 표시합니다.</FieldHelp>
                </label>
                <label>
                  <FieldLabel label="현재 단계" />
                  <select
                    value={draft.careerStage}
                    onChange={(event) =>
                      updateDraft(
                        "careerStage",
                        event.target.value as CareerStage,
                      )
                    }
                    className={inputClassName}
                  >
                    {careerStages.map((stage) => (
                      <option key={stage}>{stage}</option>
                    ))}
                  </select>
                  <FieldHelp>신입/주니어/경력 여부에 따라 문체와 강조점이 달라집니다.</FieldHelp>
                </label>
              </div>
            </section>
          )}

          {activeSection === "career" && (
            <section className="pf-card p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-[#eaf1ff] text-[#2563eb]">
                  <BriefcaseBusiness size={17} />
                </span>
                <div>
                  <h3 className="text-[15px] font-black text-[#263853]">
                    커리어 목표
                  </h3>
                  <p className="mt-1 text-[12px] leading-6 text-[#8996a8]">
                    생성 결과가 향해야 할 직무와 산업의 기준을 설정합니다.
                  </p>
                  <p className="mt-2 text-[11px] leading-5 text-[#66758c]">
                    예: 브랜드 전략 마케터, 글로벌 소비재 브랜드, 패션·라이프스타일
                  </p>
                </div>
              </div>

              <div className="mt-7 grid gap-5 md:grid-cols-2">
                <label>
                  <FieldLabel label="목표 직무" />
                  <span className="relative block">
                    <Target
                      size={14}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa7b8]"
                    />
                    <input
                      value={draft.targetRole}
                      onChange={(event) =>
                        updateDraft("targetRole", event.target.value)
                      }
                      placeholder="브랜드 전략 마케터"
                      className={`${inputClassName} pl-10`}
                    />
                  </span>
                  <FieldHelp>모든 생성 결과의 지원 직무 방향을 결정하는 핵심 필드입니다.</FieldHelp>
                </label>
                <label>
                  <FieldLabel label="희망 고용 형태" />
                  <select
                    value={draft.employmentType}
                    onChange={(event) =>
                      updateDraft(
                        "employmentType",
                        event.target.value as EmploymentType,
                      )
                    }
                    className={inputClassName}
                  >
                    {employmentTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                  <FieldHelp>지원 문서에서 희망 근무 형태를 명확히 정리할 때 사용합니다.</FieldHelp>
                </label>
                <label className="md:col-span-2">
                  <FieldLabel label="희망 기업 또는 조직 유형" />
                  <span className="relative block">
                    <Building2
                      size={14}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa7b8]"
                    />
                    <input
                      value={draft.targetCompany}
                      onChange={(event) =>
                        updateDraft("targetCompany", event.target.value)
                      }
                      placeholder="글로벌 소비재 브랜드, 성장 단계 스타트업"
                      className={`${inputClassName} pl-10`}
                    />
                  </span>
                  <FieldHelp>회사명이 정해지지 않았다면 산업군이나 조직 유형을 적어도 됩니다.</FieldHelp>
                </label>
                <label className="md:col-span-2">
                  <FieldLabel label="관심 산업" />
                  <input
                    value={draft.targetIndustries}
                    onChange={(event) =>
                      updateDraft("targetIndustries", event.target.value)
                    }
                    placeholder="패션·라이프스타일, 뷰티, 콘텐츠"
                    className={inputClassName}
                  />
                  <p className="mt-2 text-[11px] text-[#9aa6b7]">
                    쉼표로 여러 산업을 구분하세요.
                  </p>
                  <FieldHelp>관심 산업은 분석 결과를 어떤 시장 맥락으로 해석할지 정하는 기준입니다.</FieldHelp>
                  <PreviewTags value={draft.targetIndustries} />
                </label>
              </div>
            </section>
          )}

          {activeSection === "identity" && (
            <section className="pf-card p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-[#f0edff] text-[#7157d9]">
                  <Sparkles size={17} />
                </span>
                <div>
                  <h3 className="text-[15px] font-black text-[#263853]">
                    강점과 업무 가치관
                  </h3>
                  <p className="mt-1 text-[12px] leading-6 text-[#8996a8]">
                    개인 브랜딩 결과가 나의 실제 업무 방식과 일치하도록
                    기준을 제공합니다.
                  </p>
                  <p className="mt-2 text-[11px] leading-5 text-[#66758c]">
                    예: 시장 분석, 인사이트 도출, 근거 중심 의사결정
                  </p>
                </div>
              </div>

              <div className="mt-7 space-y-5">
                <label>
                  <FieldLabel label="핵심 강점" />
                  <input
                    value={draft.coreStrengths}
                    onChange={(event) =>
                      updateDraft("coreStrengths", event.target.value)
                    }
                    placeholder="시장 분석, 인사이트 도출, 브랜드 포지셔닝"
                    className={inputClassName}
                  />
                  <PreviewTags value={draft.coreStrengths} />
                  <FieldHelp>직접 증명 가능한 강점을 우선 입력하세요. 예: 시장 분석, 고객 인사이트, 콘텐츠 구조화.</FieldHelp>
                </label>
                <label>
                  <FieldLabel label="중요하게 생각하는 업무 가치" />
                  <input
                    value={draft.workValues}
                    onChange={(event) =>
                      updateDraft("workValues", event.target.value)
                    }
                    placeholder="근거 중심 의사결정, 고객 관점, 명확한 커뮤니케이션"
                    className={inputClassName}
                  />
                  <PreviewTags value={draft.workValues} />
                  <FieldHelp>업무 가치관은 브랜딩 문장의 톤과 면접 답변 방향에 반영됩니다.</FieldHelp>
                </label>
                <label>
                  <FieldLabel label="나를 설명하는 한 문단" />
                  <textarea
                    value={draft.introduction}
                    onChange={(event) =>
                      updateDraft("introduction", event.target.value)
                    }
                    rows={7}
                    maxLength={500}
                    placeholder="어떤 문제를 잘 해결하고, 어떤 방식으로 일하는 사람인지 작성하세요."
                    className="pf-editor p-4 text-[13px] leading-6"
                  />
                  <div className="mt-2 text-right text-[11px] text-[#9aa6b7]">
                    {draft.introduction.length} / 500자
                  </div>
                  <FieldHelp>나의 일하는 방식, 잘 해결하는 문제, 대표 경험을 한 문단으로 적어 주세요.</FieldHelp>
                </label>
              </div>
            </section>
          )}

          {activeSection === "links" && (
            <section className="pf-card p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-[#e8f7f1] text-[#15966f]">
                  <Globe2 size={17} />
                </span>
                <div>
                  <h3 className="text-[15px] font-black text-[#263853]">
                    외부 링크
                  </h3>
                  <p className="mt-1 text-[12px] leading-6 text-[#8996a8]">
                    포트폴리오와 프로페셔널 프로필 주소를 관리합니다.
                  </p>
                  <p className="mt-2 text-[11px] leading-5 text-[#66758c]">
                    예: Notion 포트폴리오 URL, LinkedIn 프로필 URL
                  </p>
                </div>
              </div>

              <div className="mt-7 space-y-5">
                <label>
                  <FieldLabel label="포트폴리오 URL" />
                  <input
                    type="url"
                    value={draft.portfolioUrl}
                    onChange={(event) =>
                      updateDraft("portfolioUrl", event.target.value)
                    }
                    placeholder="https://..."
                    className={inputClassName}
                  />
                  <FieldHelp>Notion, Behance, 개인 웹사이트 등 외부 포트폴리오 주소를 연결합니다.</FieldHelp>
                </label>
                <label>
                  <FieldLabel label="LinkedIn URL" />
                  <input
                    type="url"
                    value={draft.linkedinUrl}
                    onChange={(event) =>
                      updateDraft("linkedinUrl", event.target.value)
                    }
                    placeholder="https://linkedin.com/in/..."
                    className={inputClassName}
                  />
                  <FieldHelp>공개 가능한 프로페셔널 프로필이 있을 때만 입력해도 됩니다.</FieldHelp>
                </label>
              </div>
            </section>
          )}

          <section className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: BadgeCheck,
                title: "개인 브랜딩",
                description: "이름, 목표 직무와 강점을 브랜드 메시지에 반영",
              },
              {
                icon: BriefcaseBusiness,
                title: "커리어 문서",
                description: "지원 방향에 맞춘 포트폴리오와 자기소개서 기준 제공",
              },
              {
                icon: ShieldCheck,
                title: "로컬 보관",
                description: "민감한 연락처를 외부 서버가 아닌 브라우저에 저장",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="pf-card-muted p-5">
                  <Icon size={16} className="text-[#2563eb]" />
                  <strong className="mt-3 block text-[12px] font-black text-[#40536d]">
                    {item.title}
                  </strong>
                  <p className="mt-1 text-[11px] leading-5 text-[#8b98aa]">
                    {item.description}
                  </p>
                </article>
              );
            })}
          </section>
        </div>
      </section>
    </div>
  );
}
