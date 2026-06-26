"use client";

import {
  Award,
  BriefcaseBusiness,
  Building2,
  FileText,
  Handshake,
  MessageSquareText,
  Rocket,
  Sparkles,
  Sprout,
  Target,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import {
  AnalysisProjectPicker,
  ArtifactPageHeader,
  ArtifactResultActions,
  FieldHelp,
  NextStepCard,
  NoAnalysisForArtifact,
  SectionGuide,
} from "@/components/artifacts/artifact-workspace";
import { useAnalysisSelection } from "@/hooks/use-analysis-selection";
import { useProofolioWorkspace } from "@/hooks/use-proofolio-workspace";
import { generateCoverLetter } from "@/lib/ai";
import type { CoverLetterOutput } from "@/types/proofolio";

type CoverLetterItem = keyof CoverLetterOutput;

const targetRoles = [
  "글로벌 마케터",
  "브랜드 마케터",
  "퍼포먼스 마케터",
  "콘텐츠 마케터",
  "AE/마케팅 기획",
  "PM/서비스 기획",
] as const;

const coverLetterItems = [
  {
    id: "motivation",
    label: "지원동기",
    description: "기업과 직무에 관심을 가진 이유",
    example: "예: 브랜드가 해결하는 시장 문제와 나의 경험 연결",
    icon: Target,
  },
  {
    id: "competency",
    label: "직무역량",
    description: "프로젝트로 증명한 핵심 역량",
    example: "예: 광고 성과표를 분석해 소재 개선 방향 도출",
    icon: BriefcaseBusiness,
  },
  {
    id: "achievement",
    label: "성과경험",
    description: "문제 해결 과정과 구체적 결과",
    example: "예: 타깃 재정의로 콘텐츠 구조를 개선한 사례",
    icon: Award,
  },
  {
    id: "collaboration",
    label: "협업경험",
    description: "의견 조율과 공동 목표 달성",
    example: "예: 기획, 디자인, 운영 담당자와 메시지 기준 정렬",
    icon: Handshake,
  },
  {
    id: "growth",
    label: "성장과정",
    description: "업무 태도와 학습 방식의 변화",
    example: "예: 자료 수집 중심에서 의사결정 근거 제시로 발전",
    icon: Sprout,
  },
  {
    id: "futurePlan",
    label: "입사 후 포부",
    description: "직무 기여와 단계별 성장 계획",
    example: "예: 초기에는 캠페인 분석, 이후 브랜드 전략 기여",
    icon: Rocket,
  },
] as const;

const characterLimits = [500, 700, 1000] as const;

function getProfileTargetRole(
  targetRole: string,
): (typeof targetRoles)[number] {
  if (targetRole.includes("글로벌")) return "글로벌 마케터";
  if (targetRole.includes("퍼포먼스") || targetRole.includes("그로스")) {
    return "퍼포먼스 마케터";
  }
  if (targetRole.includes("콘텐츠")) return "콘텐츠 마케터";
  if (targetRole.includes("AE") || targetRole.includes("마케팅 기획")) {
    return "AE/마케팅 기획";
  }
  if (
    targetRole.includes("PM") ||
    targetRole.includes("서비스") ||
    targetRole.includes("프로덕트")
  ) {
    return "PM/서비스 기획";
  }
  return "브랜드 마케터";
}

export function CoverLetterView({
  initialAnalysisId,
}: {
  initialAnalysisId?: string;
}) {
  const { workspace, setWorkspace } = useProofolioWorkspace();
  const analyses = useMemo(() => workspace.analyses, [workspace.analyses]);
  const { selectedId, selectedAnalysis, selectAnalysis } =
    useAnalysisSelection(analyses, initialAnalysisId);
  const [targetRole, setTargetRole] = useState<
    (typeof targetRoles)[number]
  >(() => getProfileTargetRole(workspace.userProfile.targetRole));
  const [selectedItem, setSelectedItem] =
    useState<CoverLetterItem>("motivation");
  const [characterLimit, setCharacterLimit] =
    useState<(typeof characterLimits)[number]>(700);
  const [isGenerating, setIsGenerating] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  if (!selectedAnalysis) {
    return <NoAnalysisForArtifact artifactName="자기소개서" />;
  }

  const output = workspace.coverLetterOutputs[selectedAnalysis.id];
  const content = output?.[selectedItem] ?? "";
  const selectedItemMeta =
    coverLetterItems.find((item) => item.id === selectedItem) ??
    coverLetterItems[0];

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const generated = await generateCoverLetter(selectedAnalysis, {
        targetRole,
        companyName: workspace.userProfile.targetCompany || undefined,
        characterLimit,
        userAnswers: workspace.questionAnswers[selectedAnalysis.id],
      });

      setWorkspace((current) => ({
        ...current,
        coverLetterOutputs: {
          ...current.coverLetterOutputs,
          [selectedAnalysis.id]: generated,
        },
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const updateContent = (value: string) => {
    setWorkspace((current) => {
      const currentOutput =
        current.coverLetterOutputs[selectedAnalysis.id];
      if (!currentOutput) return current;

      return {
        ...current,
        coverLetterOutputs: {
          ...current.coverLetterOutputs,
          [selectedAnalysis.id]: {
            ...currentOutput,
            [selectedItem]: value,
          },
        },
      };
    });
  };

  return (
    <div className="space-y-7">
      <ArtifactPageHeader
        eyebrow="EVIDENCE TO APPLICATION"
        title="프로젝트 경험을 자기소개서로 연결하세요"
        description="지원 직무에 맞춰 문제 정의, 행동, 결과가 드러나는 신입 지원자용 자기소개서 문장을 생성합니다."
        icon={FileText}
        completedCount={analyses.length}
        resultCount={Object.keys(workspace.coverLetterOutputs).length}
        resultLabel="작성 완료"
        example="예: 광고 성과 분석 경험을 ‘직무역량’ 항목의 문제 해결 사례로 바꿉니다."
      />

      <section className="grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)]">
        <AnalysisProjectPicker
          analyses={analyses}
          selectedId={selectedId}
          onSelect={selectAnalysis}
          generatedIds={new Set(Object.keys(workspace.coverLetterOutputs))}
          generatedLabel="자기소개서"
        />

        <div className="space-y-5">
          <section className="pf-card p-6 sm:p-7">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <p className="text-[10px] font-black tracking-[0.14em] text-[#2563eb]">
                  APPLICATION SETTINGS
                </p>
                <h3 className="mt-1.5 text-[16px] font-black text-[#263853]">
                  지원 조건을 설정하세요
                </h3>
                <p className="mt-1.5 text-[12px] leading-6 text-[#8996a8]">
                  프로젝트 경험이 선택한 직무 역량으로 자연스럽게 이어지도록
                  문장을 조정합니다.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-xl bg-[#f2f6fc] px-3 py-2 text-[11px] font-extrabold text-[#5f7189]">
                <Sparkles size={13} className="text-[#2563eb]" />
                추상 표현 없이 근거 중심으로 작성
              </span>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
              <label>
                <span className="mb-2 flex items-center gap-2 text-[12px] font-extrabold text-[#40536d]">
                  <Building2 size={14} className="text-[#2563eb]" />
                  지원 직무
                </span>
                <select
                  value={targetRole}
                  onChange={(event) =>
                    setTargetRole(
                      event.target.value as (typeof targetRoles)[number],
                    )
                  }
                  className="h-12 w-full rounded-xl border border-[#dce4ef] bg-[#fafbfd] px-4 text-[13px] font-bold text-[#40536d] outline-none transition focus:border-[#8faef0] focus:bg-white"
                >
                  {targetRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <FieldHelp>
                  선택한 직무에 따라 강조 역량이 바뀝니다. 예를 들어 퍼포먼스
                  마케터는 지표·실험·개선, 브랜드 마케터는 시장 이해와
                  포지셔닝을 더 앞에 둡니다.
                </FieldHelp>
              </label>

              <div>
                <span className="mb-2 block text-[12px] font-extrabold text-[#40536d]">
                  글자 수
                </span>
                <div className="grid grid-cols-3 rounded-xl bg-[#f1f4f8] p-1">
                  {characterLimits.map((limit) => (
                    <button
                      key={limit}
                      type="button"
                      onClick={() => setCharacterLimit(limit)}
                      className={`h-10 rounded-lg text-[12px] font-extrabold transition ${
                        characterLimit === limit
                          ? "bg-white text-[#2563eb] shadow-sm"
                          : "text-[#7c8ba0] hover:text-[#40536d]"
                      }`}
                    >
                      {limit}자
                    </button>
                  ))}
                </div>
                <FieldHelp>
                  500자는 핵심 압축, 700자는 표준 자기소개서, 1000자는 배경과
                  행동을 더 자세히 설명할 때 적합합니다.
                </FieldHelp>
              </div>
            </div>

            <div className="mt-6">
              <span className="text-[12px] font-extrabold text-[#40536d]">
                자기소개서 항목
              </span>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {coverLetterItems.map((item) => {
                  const Icon = item.icon;
                  const active = selectedItem === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedItem(item.id)}
                      className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition ${
                        active
                          ? "border-[#90b0f3] bg-[#eef4ff]"
                          : "border-[#e3e8ef] bg-[#fafbfd] hover:border-[#c8d4e5] hover:bg-white"
                      }`}
                    >
                      <span
                        className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                          active
                            ? "bg-[#2563eb] text-white"
                            : "bg-white text-[#71829a] shadow-sm"
                        }`}
                      >
                        <Icon size={15} />
                      </span>
                      <span>
                        <strong className="block text-[12px] font-extrabold text-[#30425c]">
                          {item.label}
                        </strong>
                        <span className="mt-1 block text-[10px] leading-5 text-[#8e9aab]">
                          {item.description}
                        </span>
                        <span className="mt-2 block text-[10px] leading-5 text-[#6b7c92]">
                          {item.example}
                        </span>
                        <span className="mt-2 block rounded-xl bg-white px-3 py-2 text-[10px] font-semibold leading-5 text-[#66758c] shadow-sm">
                          평가 포인트: 경험이 직무 요구 역량과 자연스럽게 이어지는지 확인합니다.
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <SectionGuide title="작성 기준">
            각 문단은 <strong>문제 상황</strong>, <strong>내가 한 행동</strong>,
            <strong>결과 또는 배운 판단 기준</strong>이 보이도록 구성됩니다.
            추상적인 성실함보다 실제 프로젝트에서 재현 가능한 업무 방식을
            보여주는 것이 핵심입니다.
          </SectionGuide>

          <section className="pf-card overflow-hidden">
            <div className="flex flex-col justify-between gap-4 border-b border-[#e7ecf2] px-6 py-5 sm:flex-row sm:items-center sm:px-7">
              <div>
                <p className="text-[10px] font-black tracking-[0.14em] text-[#2563eb]">
                  GENERATED COVER LETTER
                </p>
                <h3 className="mt-1.5 text-[15px] font-black text-[#263853]">
                  {selectedItemMeta.label} · {targetRole}
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
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-[#eaf1ff] px-2.5 py-1.5 text-[11px] font-extrabold text-[#2563eb]">
                    {selectedAnalysis.projectTitle}
                  </span>
                  <span className="rounded-lg bg-[#f1f4f8] px-2.5 py-1.5 text-[11px] font-extrabold text-[#687a91]">
                    목표 {characterLimit}자
                  </span>
                  <span className="rounded-lg bg-[#f1f4f8] px-2.5 py-1.5 text-[11px] font-extrabold text-[#687a91]">
                    신입 지원자 문체
                  </span>
                </div>
                <textarea
                  ref={editorRef}
                  value={content}
                  maxLength={characterLimit}
                  onChange={(event) => updateContent(event.target.value)}
                  aria-label={`${selectedItemMeta.label} 편집기`}
                  className="pf-editor min-h-[500px] p-5 text-[12px] font-medium leading-[2]"
                />
                <div className="mt-3 flex items-center justify-between text-[11px] text-[#929eae]">
                  <span>문제 정의, 행동, 결과가 드러나는지 검토해 주세요.</span>
                  <span
                    className={
                      content.length > characterLimit * 0.95
                        ? "font-extrabold text-[#b66b08]"
                        : ""
                    }
                  >
                    {content.length.toLocaleString("ko-KR")} /{" "}
                    {characterLimit.toLocaleString("ko-KR")}자
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid min-h-[420px] place-items-center px-6 py-14 text-center">
                <div className="max-w-md">
                  <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#eaf1ff] text-[#2563eb]">
                    <FileText size={23} />
                  </span>
                  <h4 className="mt-5 text-[16px] font-black text-[#263853]">
                    아직 작성된 자기소개서가 없습니다
                  </h4>
                  <p className="mt-2 text-[12px] leading-6 text-[#8996a8]">
                    직무와 글자 수를 선택한 뒤 생성하면 여섯 가지 항목의 초안을
                    함께 만들고 항목별로 수정할 수 있습니다.
                  </p>
                </div>
              </div>
            )}
          </section>

          {output && (
            <NextStepCard
              title="자기소개서의 직무 연결과 문장 설득력을 점검하세요"
              description="현재 편집한 자기소개서를 기준으로 항목별 경험 연결, 근거 활용과 문장 흐름을 전문가 관점에서 평가합니다."
              primaryHref={`/feedback?analysis=${selectedAnalysis.id}&target=coverLetter`}
              primaryLabel="자기소개서 피드백 보기"
              primaryIcon={MessageSquareText}
              secondaryHref={`/resume?analysis=${selectedAnalysis.id}`}
              secondaryLabel="이력서 문장 만들기"
            />
          )}
        </div>
      </section>
    </div>
  );
}
