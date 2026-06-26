"use client";

import {
  ArrowRight,
  ClipboardList,
  FileText,
  Lightbulb,
  PencilLine,
  Plus,
  Save,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  ExampleHint,
  FieldHelp,
  SectionGuide,
} from "@/components/artifacts/artifact-workspace";
import { useProofolioWorkspace } from "@/hooks/use-proofolio-workspace";
import type {
  CareerInputEntry,
  CareerInputType,
  UploadedFile,
} from "@/types/proofolio";

type CareerInputDraft = {
  type: CareerInputType;
  title: string;
  targetRole: string;
  companyName: string;
  situation: string;
  action: string;
  result: string;
  learned: string;
  content: string;
  tags: string;
};

const inputTypes: Array<{
  type: CareerInputType;
  title: string;
  description: string;
  placeholder: string;
}> = [
  {
    type: "경험 기록",
    title: "경험 기록",
    description: "프로젝트, 대외활동, 인턴, 공모전 경험을 STAR 구조로 정리",
    placeholder:
      "예: 66°North 한국 시장 진입 전략 프로젝트에서 시장 조사와 포지셔닝 방향을 맡았습니다.",
  },
  {
    type: "자기소개서 초안",
    title: "자기소개서 초안",
    description: "지원동기, 직무역량, 성과경험 등 아직 다듬기 전의 원문 저장",
    placeholder:
      "예: 저는 시장과 고객 자료를 분석해 실행 가능한 브랜드 전략으로 바꾸는 과정에 관심이 있습니다...",
  },
  {
    type: "이력서 메모",
    title: "이력서 메모",
    description: "이력서 bullet point로 바꾸고 싶은 업무와 성과 기록",
    placeholder:
      "예: 광고 소재별 CTR/CPC를 비교하고 랜딩페이지 개선 방향을 제안했습니다.",
  },
  {
    type: "면접 메모",
    title: "면접 메모",
    description: "면접에서 설명해야 할 강점, 약점, 보완 답변 초안",
    placeholder:
      "예: 성과 수치가 부족한 프로젝트는 기대효과와 후속 검증 계획을 분리해 설명하겠습니다.",
  },
];

const emptyDraft: CareerInputDraft = {
  type: "경험 기록",
  title: "",
  targetRole: "",
  companyName: "",
  situation: "",
  action: "",
  result: "",
  learned: "",
  content: "",
  tags: "",
};

const inputClassName =
  "h-11 w-full rounded-xl border border-[#dce4ef] bg-white px-3.5 text-[13px] font-semibold text-[#31435d] outline-none transition placeholder:text-[#a0abba] focus:border-[#9dbaf7] focus:ring-4 focus:ring-[#2563eb]/10";

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function toDraft(entry: CareerInputEntry): CareerInputDraft {
  return {
    type: entry.type,
    title: entry.title,
    targetRole: entry.targetRole,
    companyName: entry.companyName,
    situation: entry.situation,
    action: entry.action,
    result: entry.result,
    learned: entry.learned,
    content: entry.content,
    tags: entry.tags.join(", "),
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function createInputId() {
  return `career-input-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function safeFileName(value: string) {
  const normalized = value
    .toLocaleLowerCase("ko-KR")
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 44);

  return `${normalized || "career-input"}.txt`;
}

function buildInputText(entry: CareerInputEntry) {
  return [
    `[입력 유형] ${entry.type}`,
    `[제목] ${entry.title}`,
    entry.targetRole ? `[목표 직무] ${entry.targetRole}` : "",
    entry.companyName ? `[지원 기업] ${entry.companyName}` : "",
    entry.tags.length ? `[역량 태그] ${entry.tags.join(", ")}` : "",
    "",
    "[상황/배경]",
    entry.situation || "미작성",
    "",
    "[행동/기여]",
    entry.action || "미작성",
    "",
    "[결과/근거]",
    entry.result || "미작성",
    "",
    "[배운 점/보완점]",
    entry.learned || "미작성",
    "",
    "[초안/메모]",
    entry.content || "미작성",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function getEntrySummary(entry: CareerInputEntry) {
  const source =
    entry.content ||
    entry.result ||
    entry.action ||
    entry.situation ||
    "아직 본문이 없습니다.";

  return source.replace(/\s+/g, " ").trim().slice(0, 120);
}

function countWords(entries: CareerInputEntry[]) {
  return entries.reduce((total, entry) => {
    const text = buildInputText(entry);
    return total + text.split(/\s+/).filter(Boolean).length;
  }, 0);
}

export function CareerInputsView() {
  const { workspace, setWorkspace } = useProofolioWorkspace();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CareerInputDraft>(emptyDraft);
  const [notice, setNotice] = useState("");

  const entries = workspace.careerInputs;
  const editingEntry = editingId
    ? entries.find((entry) => entry.id === editingId)
    : undefined;
  const groupedCounts = useMemo(
    () =>
      inputTypes.map((item) => ({
        ...item,
        count: entries.filter((entry) => entry.type === item.type).length,
      })),
    [entries],
  );
  const totalWords = countWords(entries);

  const updateDraft = <Key extends keyof CareerInputDraft>(
    key: Key,
    value: CareerInputDraft[Key],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const startNew = (type: CareerInputType = "경험 기록") => {
    setEditingId(null);
    setDraft({
      ...emptyDraft,
      type,
      targetRole: workspace.userProfile.targetRole,
      companyName: workspace.userProfile.targetCompany,
    });
    setNotice("");
  };

  const selectEntry = (entry: CareerInputEntry) => {
    setEditingId(entry.id);
    setDraft(toDraft(entry));
    setNotice("");
  };

  const saveEntry = () => {
    const now = new Date().toISOString();
    const normalizedTitle =
      draft.title.trim() || `${draft.type} ${entries.length + 1}`;
    const nextEntry: CareerInputEntry = editingEntry
      ? {
          ...editingEntry,
          ...draft,
          title: normalizedTitle,
          targetRole: draft.targetRole.trim(),
          companyName: draft.companyName.trim(),
          situation: draft.situation.trim(),
          action: draft.action.trim(),
          result: draft.result.trim(),
          learned: draft.learned.trim(),
          content: draft.content.trim(),
          tags: parseTags(draft.tags),
          updatedAt: now,
        }
      : {
          id: createInputId(),
          ...draft,
          title: normalizedTitle,
          targetRole: draft.targetRole.trim(),
          companyName: draft.companyName.trim(),
          situation: draft.situation.trim(),
          action: draft.action.trim(),
          result: draft.result.trim(),
          learned: draft.learned.trim(),
          content: draft.content.trim(),
          tags: parseTags(draft.tags),
          createdAt: now,
          updatedAt: now,
        };

    setWorkspace((current) => ({
      ...current,
      careerInputs: editingEntry
        ? current.careerInputs.map((entry) =>
            entry.id === nextEntry.id ? nextEntry : entry,
          )
        : [nextEntry, ...current.careerInputs],
    }));
    setEditingId(nextEntry.id);
    setDraft(toDraft(nextEntry));
    setNotice("입력 자료가 저장되었습니다.");
  };

  const deleteEntry = (entry: CareerInputEntry) => {
    const confirmed = window.confirm(
      `"${entry.title}" 입력 자료를 삭제할까요?`,
    );

    if (!confirmed) return;

    setWorkspace((current) => ({
      ...current,
      careerInputs: current.careerInputs.filter(
        (currentEntry) => currentEntry.id !== entry.id,
      ),
    }));
    if (editingId === entry.id) startNew();
    setNotice("입력 자료가 삭제되었습니다.");
  };

  const addEntryToUpload = (entry: CareerInputEntry) => {
    const text = buildInputText(entry);
    const now = new Date().toISOString();
    const uploadFile: UploadedFile = {
      id: `upload-${entry.id}-${Date.now()}`,
      name: safeFileName(`${entry.type}-${entry.title}`),
      type: "text/plain",
      size: new TextEncoder().encode(text).length,
      uploadedAt: now,
      status: "대기 중",
      contentPreview: text.slice(0, 4200),
      contentSummary:
        `직접 입력한 ${entry.type} 자료입니다. 경험, 역할, 결과와 초안 내용을 분석 미리보기로 반영했습니다.`,
    };

    setWorkspace((current) => ({
      ...current,
      uploadedFiles: [uploadFile, ...current.uploadedFiles],
    }));
    setNotice("Upload 페이지에 분석 대기 자료로 추가했습니다.");
  };

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="pf-tag pf-tag-primary">
            <PencilLine size={14} />
            WRITE YOUR SOURCE
          </p>
          <h2 className="mt-2 text-[29px] font-black tracking-[-0.045em] text-[#10213d]">
            내 경험과 자기소개서 초안
          </h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#6f7f94]">
            파일로 정리되지 않은 경험, 자기소개서 초안, 이력서 메모와 면접
            답변을 직접 입력해 저장합니다. 저장한 글은 분석 자료로 추가해
            포트폴리오, 자기소개서, 피드백 생성에 활용할 수 있습니다.
          </p>
          <ExampleHint>
            예: “오딧세이 광고 전략에서 CTR/CPC를 비교했고, 랜딩페이지 첫 화면의 메시지 위계를 개선안으로 제안했다”처럼 상황, 행동, 결과를 나눠 적어두세요.
          </ExampleHint>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="pf-tag min-h-9 rounded-xl px-3.5">
            저장 자료 {entries.length}개
          </span>
          <span className="pf-tag min-h-9 rounded-xl border-[#d9ebe5] bg-[#f3fbf8] px-3.5 text-[#168765]">
            약 {totalWords.toLocaleString("ko-KR")}단어
          </span>
          <Link href="/upload" className="pf-button-secondary min-h-9 px-3.5">
            <UploadCloud size={14} />
            Upload로 이동
          </Link>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="pf-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-black text-[#263853]">
                  입력 자료
                </h3>
                <p className="mt-1 text-[11px] text-[#95a1b1]">
                  저장한 경험과 초안을 선택하세요
                </p>
              </div>
              <button
                type="button"
                onClick={() => startNew()}
                className="grid size-9 place-items-center rounded-xl bg-[#2563eb] text-white"
                aria-label="새 입력 자료 작성"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {groupedCounts.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => startNew(item.type)}
                  className="rounded-2xl border border-[#e3eaf3] bg-[#fbfcfe] p-3 text-left transition hover:border-[#bcd0ef] hover:bg-white"
                >
                  <span className="text-[10px] font-black text-[#2563eb]">
                    {item.count}개
                  </span>
                  <strong className="mt-1 block text-[11px] font-black text-[#31435d]">
                    {item.title}
                  </strong>
                  <span className="mt-1 block text-[10px] font-semibold leading-4 text-[#7d8da2]">
                    {item.description}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              {entries.length ? (
                entries.map((entry) => {
                  const active = entry.id === editingId;

                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => selectEntry(entry)}
                      className={`w-full rounded-2xl border p-3.5 text-left transition ${
                        active
                          ? "border-[#9dbaf7] bg-[#eef4ff]"
                          : "border-transparent bg-[#f8fafc] hover:border-[#dbe4ef] hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-[#2563eb]">
                          {entry.type}
                        </span>
                        <span className="text-[10px] font-semibold text-[#9aa6b7]">
                          {formatDate(entry.updatedAt)}
                        </span>
                      </div>
                      <strong className="mt-2 block text-[13px] font-extrabold leading-5 text-[#30425c]">
                        {entry.title}
                      </strong>
                      <p className="mt-1.5 text-[11px] leading-5 text-[#8794a6]">
                        {getEntrySummary(entry)}
                      </p>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-[#cfd9e8] bg-[#fbfcfe] p-5 text-center">
                  <ClipboardList
                    size={22}
                    className="mx-auto text-[#8fa1ba]"
                  />
                  <p className="mt-3 text-[12px] font-bold text-[#728198]">
                    아직 저장한 입력 자료가 없습니다.
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-[#9aa6b7]">
                    오른쪽에서 경험이나 자기소개서 초안을 작성해 보세요.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-[#dbe7f8] bg-[#f8fbff] p-5">
            <Sparkles size={17} className="text-[#2563eb]" />
            <h3 className="mt-3 text-[13px] font-black text-[#263853]">
              작성 기준
            </h3>
            <ul className="mt-3 space-y-2 text-[11px] leading-5 text-[#66758c]">
              <li>문제, 행동, 결과를 분리해서 적으면 분석 품질이 높아집니다.</li>
              <li>성과 수치가 없으면 피드백, 기대효과, 후속 검증 계획을 적어도 좋습니다.</li>
              <li>팀 프로젝트는 본인이 직접 담당한 판단과 산출물을 따로 적어 주세요.</li>
            </ul>
          </div>
        </aside>

        <article className="pf-card overflow-hidden">
          <header className="border-b border-[#e2e9f2] bg-[linear-gradient(135deg,#f8fbff_0%,#eef4ff_58%,#f7f9fc_100%)] px-6 py-6 sm:px-8">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <p className="text-[10px] font-black tracking-[0.14em] text-[#2563eb]">
                  {editingEntry ? "EDIT INPUT" : "NEW INPUT"}
                </p>
                <h3 className="mt-2 text-[22px] font-black tracking-[-0.04em] text-[#10213d]">
                  {editingEntry ? "입력 자료 수정" : "새 입력 자료 작성"}
                </h3>
                <p className="mt-2 max-w-2xl text-[12px] leading-6 text-[#6f7f94]">
                  여기에 적은 내용은 계정/브라우저 저장소에 보관됩니다. 분석
                  자료로 추가하면 Upload 페이지에서 AI 분석을 시작할 수 있습니다.
                </p>
              </div>
              {notice ? (
                <span className="rounded-full bg-[#e8f7f1] px-3 py-1.5 text-[11px] font-black text-[#168765]">
                  {notice}
                </span>
              ) : null}
            </div>
          </header>

          <div className="space-y-6 p-6 sm:p-8">
            <SectionGuide title="입력 자료 작성 방법">
              아래 항목을 모두 완벽하게 채울 필요는 없습니다. 다만
              <strong>상황/문제</strong>, <strong>행동/기여</strong>,
              <strong>결과/근거</strong>가 나뉘어 있으면 AI가 경험을 더
              전문적인 포트폴리오 문장으로 바꿀 수 있습니다.
            </SectionGuide>

            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="text-[12px] font-black text-[#31435d]">
                  입력 유형
                </span>
                <select
                  value={draft.type}
                  onChange={(event) =>
                    updateDraft("type", event.target.value as CareerInputType)
                  }
                  className={`${inputClassName} mt-2`}
                >
                  {inputTypes.map((item) => (
                    <option key={item.type} value={item.type}>
                      {item.title}
                    </option>
                  ))}
                </select>
                <FieldHelp>입력 유형에 따라 분석 시 강조하는 결과물이 달라집니다.</FieldHelp>
              </label>
              <label>
                <span className="text-[12px] font-black text-[#31435d]">
                  제목
                </span>
                <input
                  value={draft.title}
                  onChange={(event) => updateDraft("title", event.target.value)}
                  placeholder="예: 66°North 한국 시장 진입 전략 경험"
                  className={`${inputClassName} mt-2`}
                />
                <FieldHelp>나중에 Upload와 Analysis에서 구분하기 쉬운 프로젝트명으로 작성하세요.</FieldHelp>
              </label>
              <label>
                <span className="text-[12px] font-black text-[#31435d]">
                  목표 직무
                </span>
                <input
                  value={draft.targetRole}
                  onChange={(event) =>
                    updateDraft("targetRole", event.target.value)
                  }
                  placeholder="예: 브랜드 마케터"
                  className={`${inputClassName} mt-2`}
                />
                <FieldHelp>지원 직무를 적으면 같은 경험도 해당 직무 기준으로 재해석됩니다.</FieldHelp>
              </label>
              <label>
                <span className="text-[12px] font-black text-[#31435d]">
                  지원 기업 / 기관
                </span>
                <input
                  value={draft.companyName}
                  onChange={(event) =>
                    updateDraft("companyName", event.target.value)
                  }
                  placeholder="예: 지원 기업명 또는 공모전명"
                  className={`${inputClassName} mt-2`}
                />
                <FieldHelp>기업이 정해지지 않았다면 공모전명, 프로젝트명, 목표 산업을 적어도 됩니다.</FieldHelp>
              </label>
            </div>

            <section className="grid gap-4 lg:grid-cols-2">
              <label>
                <span className="flex items-center gap-2 text-[12px] font-black text-[#31435d]">
                  <Lightbulb size={14} className="text-[#c77b0d]" />
                  상황/문제
                </span>
                <textarea
                  value={draft.situation}
                  onChange={(event) =>
                    updateDraft("situation", event.target.value)
                  }
                  rows={5}
                  placeholder="어떤 상황이었고, 해결해야 할 문제는 무엇이었나요?"
                  className="pf-editor mt-2 p-4 text-[13px] leading-6"
                />
                <FieldHelp>왜 이 경험이 시작되었는지, 해결해야 했던 문제가 무엇인지 적습니다.</FieldHelp>
              </label>
              <label>
                <span className="flex items-center gap-2 text-[12px] font-black text-[#31435d]">
                  <PencilLine size={14} className="text-[#2563eb]" />
                  행동/기여
                </span>
                <textarea
                  value={draft.action}
                  onChange={(event) => updateDraft("action", event.target.value)}
                  rows={5}
                  placeholder="본인이 직접 한 분석, 판단, 제작, 조율은 무엇인가요?"
                  className="pf-editor mt-2 p-4 text-[13px] leading-6"
                />
                <FieldHelp>분석, 판단, 제작, 조율 중 본인이 직접 한 일을 구체적으로 적습니다.</FieldHelp>
              </label>
              <label>
                <span className="flex items-center gap-2 text-[12px] font-black text-[#31435d]">
                  <ClipboardList size={14} className="text-[#15966f]" />
                  결과/근거
                </span>
                <textarea
                  value={draft.result}
                  onChange={(event) => updateDraft("result", event.target.value)}
                  rows={5}
                  placeholder="수치, 피드백, 산출물, 기대효과 또는 후속 검증 계획을 적어 주세요."
                  className="pf-editor mt-2 p-4 text-[13px] leading-6"
                />
                <FieldHelp>수치가 없으면 피드백, 산출물, 기대효과, 후속 검증 계획을 적어도 됩니다.</FieldHelp>
              </label>
              <label>
                <span className="flex items-center gap-2 text-[12px] font-black text-[#31435d]">
                  <Sparkles size={14} className="text-[#7157d9]" />
                  배운 점/보완점
                </span>
                <textarea
                  value={draft.learned}
                  onChange={(event) =>
                    updateDraft("learned", event.target.value)
                  }
                  rows={5}
                  placeholder="다시 한다면 무엇을 보완하고, 면접에서 어떤 한계를 설명해야 하나요?"
                  className="pf-editor mt-2 p-4 text-[13px] leading-6"
                />
                <FieldHelp>면접에서 질문받을 수 있는 한계와 다음 개선 방향을 미리 정리합니다.</FieldHelp>
              </label>
            </section>

            <label>
              <span className="flex items-center gap-2 text-[12px] font-black text-[#31435d]">
                <FileText size={14} className="text-[#2563eb]" />
                자기소개서 초안 / 자유 메모
              </span>
              <textarea
                value={draft.content}
                onChange={(event) => updateDraft("content", event.target.value)}
                rows={10}
                placeholder={
                  inputTypes.find((item) => item.type === draft.type)
                    ?.placeholder
                }
                className="pf-editor mt-2 p-4 text-[13px] leading-6"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#9aa6b7]">
                <span>
                  문제, 행동, 결과, 역할이 들어갈수록 분석과 피드백이 정교해집니다.
                </span>
                <span>{draft.content.length.toLocaleString("ko-KR")}자</span>
              </div>
              <FieldHelp>자유 메모에는 아직 정리되지 않은 문장을 그대로 붙여넣어도 됩니다.</FieldHelp>
            </label>

            <label>
              <span className="text-[12px] font-black text-[#31435d]">
                역량 태그
              </span>
              <input
                value={draft.tags}
                onChange={(event) => updateDraft("tags", event.target.value)}
                placeholder="시장 분석, 브랜드 포지셔닝, 콘텐츠 기획"
                className={`${inputClassName} mt-2`}
              />
              <p className="mt-2 text-[11px] text-[#8b98aa]">
                쉼표로 구분해서 입력하세요.
              </p>
              <FieldHelp>태그는 스킬 분석과 최종 포트폴리오 키워드 후보로 활용됩니다.</FieldHelp>
            </label>

            <div className="flex flex-col gap-3 border-t border-[#e7edf5] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={saveEntry}
                  className="pf-button-primary min-h-11 px-5"
                >
                  <Save size={16} />
                  저장하기
                </button>
                {editingEntry ? (
                  <button
                    type="button"
                    onClick={() => addEntryToUpload(editingEntry)}
                    className="pf-button-secondary min-h-11 px-5"
                  >
                    <UploadCloud size={16} />
                    분석 자료로 추가
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => startNew(draft.type)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#dce4ef] bg-white px-5 text-[12px] font-extrabold text-[#52657d] transition hover:bg-[#f7f9fc]"
                >
                  <Plus size={16} />
                  새로 작성
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {editingEntry ? (
                  <button
                    type="button"
                    onClick={() => deleteEntry(editingEntry)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#f1d7dc] bg-white px-5 text-[12px] font-extrabold text-[#c24b5a] transition hover:bg-[#fff7f8]"
                  >
                    <Trash2 size={16} />
                    삭제
                  </button>
                ) : null}
                <Link
                  href="/upload"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#10213d] px-5 text-[12px] font-extrabold text-white transition hover:bg-[#18345f]"
                >
                  Upload에서 분석 시작
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
