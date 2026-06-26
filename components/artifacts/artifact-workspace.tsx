"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clipboard,
  FolderSearch2,
  Info,
  LoaderCircle,
  Pencil,
  RefreshCcw,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";

import type { ProjectAnalysis } from "@/types/proofolio";

type ArtifactPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  completedCount: number;
  resultCount: number;
  resultLabel: string;
  example?: string;
};

export function ArtifactPageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  completedCount,
  resultCount,
  resultLabel,
  example,
}: ArtifactPageHeaderProps) {
  return (
    <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
      <div>
        <p className="pf-tag pf-tag-primary">
          <Icon size={14} />
          {eyebrow}
        </p>
        <h2 className="mt-2 text-[31px] font-black tracking-[-0.045em] text-[#10213d]">
          {title}
        </h2>
        <p className="mt-2 max-w-3xl text-[14px] font-medium leading-7 text-[#52657d]">
          {description}
        </p>
        {example ? <ExampleHint>{example}</ExampleHint> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="pf-tag min-h-9 rounded-xl px-3.5">
          분석 프로젝트 {completedCount}개
        </span>
        <span className="pf-tag min-h-9 rounded-xl border-[#d9ebe5] bg-[#f3fbf8] px-3.5 text-[#168765]">
          {resultLabel} {resultCount}개
        </span>
        <Link
          href="/analysis"
          className="pf-button-secondary min-h-9 px-3.5 py-2"
        >
          <FolderSearch2 size={14} />
          분석 리포트
        </Link>
      </div>
    </section>
  );
}

export function ExampleHint({
  label = "예시",
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-3 max-w-3xl rounded-2xl border border-[#dbe7f8] bg-[#f8fbff] px-4 py-3 text-[13px] font-semibold leading-7 text-[#52657d]">
      <span className="mr-2 inline-flex rounded-full bg-[#eaf1ff] px-2.5 py-1 text-[11px] font-black text-[#2563eb]">
        {label}
      </span>
      {children}
    </div>
  );
}

export function SectionGuide({
  title = "읽는 방법",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="pf-section-guide">
      <span className="mr-2 inline-flex items-center gap-1 rounded-full bg-[#eaf1ff] px-2.5 py-1 text-[11px] font-black text-[#2563eb]">
        <Info size={12} />
        {title}
      </span>
      {children}
    </div>
  );
}

export function FieldHelp({ children }: { children: ReactNode }) {
  return <span className="pf-field-help">{children}</span>;
}

type AnalysisProjectPickerProps = {
  analyses: ProjectAnalysis[];
  selectedId: string;
  onSelect: (analysisId: string) => void;
  generatedIds: Set<string>;
  generatedLabel: string;
};

export function AnalysisProjectPicker({
  analyses,
  selectedId,
  onSelect,
  generatedIds,
  generatedLabel,
}: AnalysisProjectPickerProps) {
  return (
    <aside className="pf-card h-fit p-4 xl:sticky xl:top-[96px]">
      <div className="flex items-center justify-between px-1 pb-3">
        <div>
          <h3 className="text-[15px] font-black text-[#263853]">
            분석 프로젝트
          </h3>
          <p className="mt-1 text-[12px] leading-5 text-[#7d8da2]">
            선택한 프로젝트가 생성 결과의 기준이 됩니다
          </p>
        </div>
        <span className="grid size-8 place-items-center rounded-xl bg-[#eaf1ff] text-[#2563eb]">
          <FolderSearch2 size={15} />
        </span>
      </div>

      <div className="space-y-2">
        {analyses.map((analysis, index) => {
          const active = analysis.id === selectedId;
          const generated = generatedIds.has(analysis.id);

          return (
            <button
              key={analysis.id}
              type="button"
              onClick={() => onSelect(analysis.id)}
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
                {generated ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e5f6ef] px-2 py-1 text-[10px] font-extrabold text-[#168765]">
                    <CheckCircle2 size={9} />
                    {generatedLabel}
                  </span>
                ) : (
                  <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-[#8c99aa]">
                    미생성
                  </span>
                )}
              </div>
              <strong className="mt-2 block text-[14px] font-extrabold leading-6 text-[#263853]">
                {analysis.projectTitle}
              </strong>
              <span className="mt-1.5 block text-[12px] leading-5 text-[#66758c]">
                {analysis.projectType}
              </span>
              <span className="mt-2 block text-[11px] font-semibold leading-5 text-[#7d8da2]">
                이 항목은 문제 정의, 역할, 역량 문장을 생성하는 원천 리포트입니다.
              </span>
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#e6ebf2] pt-2.5">
                {analysis.competencyTags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-white px-2 py-1 text-[10px] font-bold text-[#71829a]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export function NoAnalysisForArtifact({
  artifactName,
}: {
  artifactName: string;
}) {
  return (
    <div className="grid min-h-[calc(100vh-145px)] place-items-center">
      <section className="w-full max-w-2xl rounded-3xl border border-dashed border-[#cfd9e8] bg-white px-8 py-16 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#eaf1ff] text-[#2563eb]">
          <FolderSearch2 size={24} />
        </span>
        <h2 className="mt-5 text-[20px] font-black tracking-[-0.035em] text-[#1b2d48]">
          먼저 프로젝트 분석을 완료해 주세요
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-[#8492a5]">
          {artifactName}은 분석 리포트의 문제 정의, 실행, 성과와 역할을 근거로
          생성됩니다.
        </p>
        <Link
          href="/upload"
          className="pf-button-primary mt-6 min-h-11 px-5 text-[12px]"
        >
          <UploadCloud size={16} />
          파일 업로드로 이동
        </Link>
      </section>
    </div>
  );
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Fall through to the document-based copy method.
    }
  }

  const textarea = document.createElement("textarea");
  try {
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
  } finally {
    textarea.remove();
  }
}

export function CopyTextButton({
  content,
  label = "복사하기",
  className,
}: {
  content: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!content.trim()) return;
    await copyText(content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!content.trim()}
      className={
        className ??
        "pf-button-secondary h-10 px-3.5"
      }
    >
      {copied ? <Check size={14} /> : <Clipboard size={14} />}
      {copied ? "복사 완료" : label}
    </button>
  );
}

type ArtifactResultActionsProps = {
  content: string;
  hasResult: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
  onEdit?: () => void;
};

export function ArtifactResultActions({
  content,
  hasResult,
  isGenerating,
  onGenerate,
  onEdit,
}: ArtifactResultActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {hasResult && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="pf-button-secondary h-10 px-3.5"
        >
          <Pencil size={14} />
          수정하기
        </button>
      )}
      {hasResult && (
        <CopyTextButton content={content} />
      )}
      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating}
        className="pf-button-primary h-10 px-4"
      >
        {isGenerating ? (
          <LoaderCircle size={14} className="animate-spin" />
        ) : hasResult ? (
          <RefreshCcw size={14} />
        ) : (
          <Sparkles size={14} />
        )}
        {isGenerating
          ? "AI가 작성하고 있습니다"
          : hasResult
            ? "다시 생성하기"
            : "AI 결과 생성하기"}
      </button>
    </div>
  );
}

type NextStepCardProps = {
  eyebrow?: string;
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  primaryIcon: LucideIcon;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function NextStepCard({
  eyebrow = "NEXT STEP",
  title,
  description,
  primaryHref,
  primaryLabel,
  primaryIcon: PrimaryIcon,
  secondaryHref,
  secondaryLabel,
}: NextStepCardProps) {
  return (
    <section className="pf-card overflow-hidden border-[#d5e2f5] bg-[linear-gradient(135deg,#f8fbff_0%,#eef4ff_100%)] p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div>
          <p className="text-[10px] font-black tracking-[0.15em] text-[#2563eb]">
            {eyebrow}
          </p>
          <h3 className="mt-1.5 text-[16px] font-black tracking-[-0.02em] text-[#1c3355]">
            {title}
          </h3>
          <p className="mt-1.5 max-w-2xl text-[12px] leading-6 text-[#72849b]">
            {description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {secondaryHref && secondaryLabel && (
            <Link
              href={secondaryHref}
              className="pf-button-secondary"
            >
              {secondaryLabel}
            </Link>
          )}
          <Link href={primaryHref} className="pf-button-primary">
            <PrimaryIcon size={14} />
            {primaryLabel}
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
}
