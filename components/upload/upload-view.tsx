"use client";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  LoaderCircle,
  Plus,
  Presentation,
  RotateCcw,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  type ChangeEvent,
  type DragEvent,
  useMemo,
  useRef,
  useState,
} from "react";

import { useProofolioWorkspace } from "@/hooks/use-proofolio-workspace";
import { analyzeFile } from "@/lib/ai";
import {
  ACCEPTED_FILE_TYPES,
  formatFileSize,
  formatUploadDate,
  getDisplayFileType,
  getFileCategory,
  SUPPORTED_FILE_GROUPS,
  validateFiles,
} from "@/lib/files";
import type {
  ProjectAnalysis,
  UploadedFile,
  UploadedFileStatus,
} from "@/types/proofolio";

const statusStyles: Record<
  UploadedFileStatus,
  { label: string; className: string; dotClassName: string }
> = {
  "대기 중": {
    label: "대기 중",
    className: "bg-[#eef2f7] text-[#61728a]",
    dotClassName: "bg-[#8290a3]",
  },
  "분석 중": {
    label: "분석 중",
    className: "bg-[#eaf1ff] text-[#2563eb]",
    dotClassName: "bg-[#2563eb]",
  },
  "분석 완료": {
    label: "분석 완료",
    className: "bg-[#e8f7f1] text-[#168765]",
    dotClassName: "bg-[#15966f]",
  },
  "보완 필요": {
    label: "보완 필요",
    className: "bg-[#fff4df] text-[#b66b08]",
    dotClassName: "bg-[#d58a18]",
  },
};

const interruptedAnalysisStatus = {
  label: "재시작 필요",
  className: "bg-[#fff4df] text-[#b66b08]",
  dotClassName: "bg-[#d58a18]",
};

function makeUploadId(file: File, index: number) {
  const safeName = file.name
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36);

  return `upload-${Date.now()}-${index}-${safeName || "file"}`;
}

function getFileIcon(fileName: string) {
  const category = getFileCategory(fileName);

  if (category === "presentation") return Presentation;
  if (category === "spreadsheet") return FileSpreadsheet;
  if (category === "image") return FileImage;
  if (category === "pdf" || category === "document") return FileText;
  return FileArchive;
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function canReadTextPreview(file: File) {
  const category = getFileCategory(file.name);
  return (
    file.type.startsWith("text/") ||
    category === "spreadsheet" ||
    /\.(csv|tsv|txt|md|json)$/i.test(file.name)
  );
}

async function readFileEvidence(file: File) {
  if (!canReadTextPreview(file)) {
    return {
      contentPreview: "",
      contentSummary:
        "텍스트 직접 추출 대상이 아닌 파일입니다. mock 분석에서는 파일명, 형식, 용량과 프로젝트 유형별 전문 컨설턴트 기준으로 검토합니다.",
    };
  }

  try {
    const text = await file.text();
    const normalized = text.replace(/\s+/g, " ").trim();
    const preview = normalized.slice(0, 2400);

    return {
      contentPreview: preview,
      contentSummary: preview
        ? `텍스트 ${normalized.length.toLocaleString("ko-KR")}자 중 앞부분 ${preview.length.toLocaleString("ko-KR")}자를 분석 미리보기로 반영했습니다.`
        : "파일을 읽었지만 분석 가능한 텍스트가 확인되지 않았습니다.",
    };
  } catch {
    return {
      contentPreview: "",
      contentSummary:
        "브라우저에서 파일 텍스트를 읽지 못했습니다. 파일명과 형식 기반 mock 분석으로 진행합니다.",
    };
  }
}

export function UploadView() {
  const { account, workspace, setWorkspace } = useProofolioWorkspace();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [completedCount, setCompletedCount] = useState(0);

  const analyzableFiles = useMemo(
    () =>
      workspace.uploadedFiles.filter(
        (file) =>
          file.status === "대기 중" ||
          file.status === "보완 필요" ||
          (file.status === "분석 중" && !isAnalyzing),
      ),
    [isAnalyzing, workspace.uploadedFiles],
  );
  const analyzedCount = workspace.uploadedFiles.filter(
    (file) => file.status === "분석 완료",
  ).length;
  const totalSize = workspace.uploadedFiles.reduce(
    (total, file) => total + file.size,
    0,
  );
  const hasWorkspaceEvidence =
    workspace.uploadedFiles.length > 0 ||
    workspace.analyses.length > 0 ||
    Object.keys(workspace.portfolioOutputs).length > 0 ||
    Object.keys(workspace.coverLetterOutputs).length > 0 ||
    Object.keys(workspace.resumeBullets).length > 0 ||
    Object.keys(workspace.feedbackScores).length > 0 ||
    Object.keys(workspace.interviewQuestions).length > 0 ||
    Object.keys(workspace.questionAnswers).length > 0 ||
    Boolean(workspace.personalBrand) ||
    Boolean(workspace.skillAnalysis);
  const persistenceLabel =
    account.status === "authenticated"
      ? "계정 저장 활성화"
      : account.status === "checking"
        ? "저장 상태 확인 중"
        : "이 브라우저에 저장";

  const addFiles = async (incomingFiles: File[]) => {
    const { validFiles, errors: validationErrors } = validateFiles(
      incomingFiles,
      workspace.uploadedFiles,
    );

    setErrors(validationErrors);
    setCompletedCount(0);

    if (!validFiles.length) return;

    const uploadedAt = new Date().toISOString();
    const evidence = await Promise.all(validFiles.map(readFileEvidence));
    const nextFiles: UploadedFile[] = validFiles.map((file, index) => ({
      id: makeUploadId(file, index),
      name: file.name,
      type: file.type || getDisplayFileType(file.name),
      size: file.size,
      uploadedAt,
      status: "대기 중",
      contentPreview: evidence[index].contentPreview,
      contentSummary: evidence[index].contentSummary,
    }));

    setWorkspace((current) => ({
      ...current,
      uploadedFiles: [...current.uploadedFiles, ...nextFiles],
    }));
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    void addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void addFiles(Array.from(event.dataTransfer.files));
  };

  const removeFile = (file: UploadedFile) => {
    const hasAnalysis = workspace.analyses.some(
      (analysis) => analysis.sourceFileName === file.name,
    );
    const confirmed = window.confirm(
      hasAnalysis
        ? `"${file.name}"을 업로드 목록에서 삭제할까요?\n\n이미 생성된 분석 리포트와 포트폴리오 등 결과물은 유지됩니다.`
        : `"${file.name}"을 업로드 목록에서 삭제할까요?`,
    );

    if (!confirmed) return;

    setWorkspace((current) => ({
      ...current,
      uploadedFiles: current.uploadedFiles.filter(
        (uploadedFile) => uploadedFile.id !== file.id,
      ),
    }));
    setCompletedCount(0);
  };

  const resetEvidenceWorkspace = () => {
    const confirmed = window.confirm(
      "업로드 파일, 분석 리포트, 생성 결과물을 모두 삭제하고 새로 시작할까요?\n\n내 정보 설정은 유지됩니다.",
    );

    if (!confirmed) return;

    setWorkspace((current) => ({
      ...current,
      uploadedFiles: [],
      analyses: [],
      portfolioOutputs: {},
      coverLetterOutputs: {},
      resumeBullets: {},
      feedbackScores: {},
      interviewQuestions: {},
      questionAnswers: {},
      personalBrand: undefined,
      skillAnalysis: undefined,
    }));
    setErrors([]);
    setCompletedCount(0);
  };

  const startAnalysis = async () => {
    if (!analyzableFiles.length || isAnalyzing) return;

    const targetIds = new Set(analyzableFiles.map((file) => file.id));
    setErrors([]);
    setCompletedCount(0);
    setIsAnalyzing(true);
    setWorkspace((current) => ({
      ...current,
      uploadedFiles: current.uploadedFiles.map((file) =>
        targetIds.has(file.id) ? { ...file, status: "분석 중" } : file,
      ),
    }));

    const [results] = await Promise.all([
      Promise.allSettled(
        analyzableFiles.map(async (file) => {
          const existingAnalysis = workspace.analyses.find(
            (analysis) => analysis.sourceFileName === file.name,
          );

          return {
            fileId: file.id,
            analysis: await analyzeFile(
              { ...file, status: "분석 중" },
              {
                projectName: existingAnalysis?.projectTitle,
                contentPreview: file.contentPreview,
                contentSummary: file.contentSummary,
              },
            ),
          };
        }),
      ),
      wait(650),
    ]);

    const successfulAnalyses = new Map<string, ProjectAnalysis>();
    const failedIds = new Set<string>();

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        successfulAnalyses.set(result.value.fileId, result.value.analysis);
      } else {
        failedIds.add(analyzableFiles[index].id);
      }
    });

    setWorkspace((current) => {
      const updatedFileNames = new Set(
        analyzableFiles
          .filter((file) => successfulAnalyses.has(file.id))
          .map((file) => file.name),
      );
      const nextAnalyses = current.analyses.filter(
        (analysis) => !updatedFileNames.has(analysis.sourceFileName),
      );

      return {
        ...current,
        uploadedFiles: current.uploadedFiles.map((file) => {
          if (successfulAnalyses.has(file.id)) {
            return { ...file, status: "분석 완료" };
          }
          if (failedIds.has(file.id)) {
            return { ...file, status: "보완 필요" };
          }
          return file;
        }),
        analyses: [
          ...nextAnalyses,
          ...Array.from(successfulAnalyses.values()),
        ],
      };
    });

    if (failedIds.size) {
      setErrors([
        `${failedIds.size}개 파일을 분석하지 못했습니다. 파일 상태를 확인한 뒤 다시 시도해 주세요.`,
      ]);
    }
    setCompletedCount(successfulAnalyses.size);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-[10px] font-black tracking-[0.17em] text-[#2563eb]">
            SOURCE TO EVIDENCE
          </p>
          <h2 className="mt-2 text-[29px] font-black tracking-[-0.045em] text-[#10213d]">
            프로젝트 자료를 업로드하세요
          </h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#6f7f94]">
            프로젝트 파일을 업로드하면 AI가 내용을 분석합니다. 업로드 목록,
            분석 상태, 생성 결과는 저장되며 원본 파일은 현재 세션에서만
            처리합니다.
          </p>
          <p className="mt-1 max-w-2xl text-[12px] leading-6 text-[#7b8aa0]">
            {account.status === "authenticated"
              ? "로그인된 계정 저장소와 이 브라우저에 함께 동기화되어 웹을 닫아도 진행 상황을 이어서 볼 수 있습니다."
              : "로그인하면 같은 계정에서 다시 접속해도 업로드 목록과 진행 상황을 이어서 볼 수 있습니다."}
          </p>
          <div className="mt-3 max-w-2xl rounded-2xl border border-[#dbe7f8] bg-[#f8fbff] px-4 py-3 text-[12px] leading-6 text-[#52657d]">
            <span className="mr-2 inline-flex rounded-full bg-[#eaf1ff] px-2.5 py-1 text-[10px] font-black text-[#2563eb]">
              예시
            </span>
            PPT 기획서, PDF 보고서, 광고 성과 CSV, 자기소개서 초안, 카드뉴스 이미지를 업로드할 수 있습니다.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-xl border border-[#dde5ef] bg-white px-3.5 py-2 text-[11px] font-bold text-[#66758c]">
            업로드 {workspace.uploadedFiles.length}개
          </span>
          <span className="rounded-xl border border-[#d9ebe5] bg-[#f3fbf8] px-3.5 py-2 text-[11px] font-bold text-[#168765]">
            분석 완료 {analyzedCount}개
          </span>
          <span className="rounded-xl border border-[#dde5ef] bg-white px-3.5 py-2 text-[11px] font-bold text-[#66758c]">
            총 {formatFileSize(totalSize)}
          </span>
          {account.status === "guest" ? (
            <Link
              href="/login"
              className="inline-flex items-center rounded-xl border border-[#dbe7f8] bg-[#f8fbff] px-3.5 py-2 text-[11px] font-extrabold text-[#2563eb] transition hover:bg-[#eaf1ff]"
            >
              계정 저장 연결
            </Link>
          ) : (
            <span className="rounded-xl border border-[#dbe7f8] bg-[#f8fbff] px-3.5 py-2 text-[11px] font-bold text-[#2563eb]">
              {persistenceLabel}
            </span>
          )}
          {hasWorkspaceEvidence ? (
            <button
              type="button"
              onClick={resetEvidenceWorkspace}
              className="inline-flex items-center gap-2 rounded-xl border border-[#f1d7dc] bg-white px-3.5 py-2 text-[11px] font-extrabold text-[#c24b5a] transition hover:bg-[#fff7f8]"
            >
              <RotateCcw size={14} />
              전체 삭제 후 새로 시작
            </button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
        <div
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (event.currentTarget === event.target) setIsDragging(false);
          }}
          onDrop={handleDrop}
          className={`grid min-h-[310px] place-items-center rounded-3xl border-2 border-dashed px-6 py-10 text-center transition ${
            isDragging
              ? "border-[#2563eb] bg-[#eef4ff]"
              : "border-[#cfd9e8] bg-white hover:border-[#9fb8df] hover:bg-[#fbfdff]"
          }`}
        >
          <div className="max-w-lg">
            <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#eaf1ff] text-[#2563eb]">
              <UploadCloud size={28} strokeWidth={2} />
            </span>
            <h3 className="mt-5 text-[17px] font-black tracking-[-0.03em] text-[#1c2f4b]">
              파일을 이곳에 드래그 앤 드롭하세요
            </h3>
            <p className="mt-2 text-[12px] leading-6 text-[#8492a5]">
              또는 파일 선택 버튼을 눌러 프로젝트 자료를 추가하세요.
              <br />
              파일당 최대 25MB, 한 번에 최대 20개까지 지원합니다.
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPTED_FILE_TYPES}
              onChange={handleFileInput}
              className="sr-only"
              aria-label="분석할 파일 선택"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="pf-button-primary mt-5 min-h-11 px-5 text-[12px]"
            >
              <Plus size={16} />
              파일 선택
            </button>
          </div>
        </div>

        <aside className="rounded-3xl border border-[#e1e7ef] bg-[#10213d] p-6 text-white shadow-[0_18px_45px_rgba(16,33,61,0.13)]">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black tracking-[0.13em] text-[#a9c6ff]">
            <Sparkles size={12} />
            SUPPORTED SOURCES
          </span>
          <h3 className="mt-5 text-[17px] font-black tracking-[-0.03em]">
            다양한 형식의 근거를
            <br />
            한 번에 분석합니다
          </h3>
          <p className="mt-3 text-[12px] leading-6 text-white/60">
            실제 AI 연결 전 MVP에서는 OpenAI mock provider가 파일명, 형식,
            용량과 텍스트 미리보기를 검토해 전문 컨설턴트 수준의 분석
            리포트를 생성합니다.
          </p>
          <div className="mt-6 space-y-2">
            {SUPPORTED_FILE_GROUPS.map((group) => (
              <div
                key={group.label}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.055] px-3.5 py-3"
              >
                <span className="text-[12px] font-extrabold">{group.label}</span>
                <span className="text-[11px] font-medium text-white/50">
                  {group.extensions}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {errors.length > 0 && (
        <section className="rounded-2xl border border-[#f1d7dc] bg-[#fff7f8] p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={17} className="mt-0.5 shrink-0 text-[#d95362]" />
            <div className="min-w-0 flex-1">
              <strong className="text-[12px] font-extrabold text-[#ad3f4e]">
                확인이 필요한 파일이 있습니다
              </strong>
              <ul className="mt-2 space-y-1 text-[12px] leading-6 text-[#ad5a65]">
                {errors.map((error) => (
                  <li key={error}>- {error}</li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setErrors([])}
              className="grid size-8 shrink-0 place-items-center rounded-lg text-[#c27680] hover:bg-white"
              aria-label="파일 오류 안내 닫기"
            >
              <X size={15} />
            </button>
          </div>
        </section>
      )}

      {completedCount > 0 && (
        <section className="flex flex-col justify-between gap-4 rounded-2xl border border-[#cfe8df] bg-[#f2fbf7] p-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#15966f] shadow-sm">
              <CheckCircle2 size={20} />
            </span>
            <div>
              <strong className="text-[12px] font-extrabold text-[#196f58]">
                {completedCount}개 파일의 분석 리포트가 준비되었습니다
              </strong>
              <p className="mt-1 text-[12px] text-[#5d8e7d]">
                결과물을 생성하기 전에 분석 내용과 보완 질문을 먼저 검토하세요.
              </p>
            </div>
          </div>
          <Link
            href="/analysis"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#15966f] px-4 text-[12px] font-extrabold text-white hover:bg-[#117c5d]"
          >
            분석 리포트 확인
            <ArrowRight size={14} />
          </Link>
        </section>
      )}

      <section className="overflow-hidden rounded-3xl border border-[#e1e7ef] bg-white shadow-[0_12px_35px_rgba(30,56,92,0.045)]">
        <div className="flex flex-col justify-between gap-4 border-b border-[#e8edf3] px-5 py-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-[15px] font-black tracking-[-0.025em] text-[#1b2d48]">
              업로드된 파일
            </h3>
            <p className="mt-1 text-[12px] leading-6 text-[#8b98a9]">
              파일은 상태와 관계없이 삭제할 수 있습니다. 분석 완료 파일을
              삭제해도 기존 분석 리포트와 생성 결과물은 유지됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={startAnalysis}
            disabled={!analyzableFiles.length || isAnalyzing}
            className="pf-button-primary min-h-11 px-5 text-[12px]"
          >
            {isAnalyzing ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            {isAnalyzing
              ? "AI가 프로젝트를 분석하고 있습니다"
              : analyzableFiles.length
                ? `AI 분석 시작 · ${analyzableFiles.length}개`
                : "분석할 파일 없음"}
          </button>
        </div>

        {workspace.uploadedFiles.length ? (
          <div className="max-h-[660px] divide-y divide-[#edf1f5] overflow-auto">
            {[...workspace.uploadedFiles]
              .sort(
                (a, b) =>
                  new Date(b.uploadedAt).getTime() -
                  new Date(a.uploadedAt).getTime(),
              )
              .map((file) => {
                const Icon = getFileIcon(file.name);
                const isRestartableProcessing =
                  file.status === "분석 중" && !isAnalyzing;
                const status = isRestartableProcessing
                  ? interruptedAnalysisStatus
                  : statusStyles[file.status];

                return (
                  <div
                    key={file.id}
                    className="grid gap-4 px-5 py-4 transition hover:bg-[#fafcff] md:grid-cols-[minmax(0,1.45fr)_100px_150px_120px_36px] md:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3.5">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eef3fa] text-[#406184]">
                        <Icon size={20} />
                      </span>
                      <div className="min-w-0">
                        <strong className="block truncate text-[13px] font-extrabold text-[#263853]">
                          {file.name}
                        </strong>
                        <span className="mt-1 block text-[11px] font-medium text-[#98a3b2]">
                          {isRestartableProcessing
                            ? "브라우저 종료로 중단된 분석입니다. AI 분석 시작을 다시 눌러 주세요."
                            : file.contentSummary || "업로드 목록과 분석 상태는 저장됩니다. 원본 파일은 다시 선택이 필요할 수 있습니다."}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="rounded-lg bg-[#eef2f7] px-2 py-1 text-[11px] font-extrabold text-[#61728a]">
                        {getDisplayFileType(file.name, file.type)}
                      </span>
                      <p className="mt-1.5 text-[11px] text-[#95a1b1]">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#9aa5b4]">
                        업로드 날짜
                      </p>
                      <p className="mt-1 text-[12px] font-semibold text-[#607188]">
                        {formatUploadDate(file.uploadedAt)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-extrabold ${status.className}`}
                    >
                      {file.status === "분석 중" && isAnalyzing ? (
                        <LoaderCircle size={10} className="animate-spin" />
                      ) : (
                        <span
                          className={`size-1.5 rounded-full ${status.dotClassName}`}
                        />
                      )}
                      {status.label}
                    </span>
                    {file.status !== "분석 중" || !isAnalyzing ? (
                      <button
                        type="button"
                        onClick={() => removeFile(file)}
                        className="grid size-9 place-items-center rounded-xl text-[#a0abba] transition hover:bg-[#fff1f3] hover:text-[#d95362]"
                        aria-label={`${file.name} 삭제`}
                      >
                        <Trash2 size={15} />
                      </button>
                    ) : (
                      <span className="size-9" aria-hidden="true" />
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="grid min-h-[220px] place-items-center px-6 py-12 text-center">
            <div>
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#eef3fa] text-[#7b8ca3]">
                <FileText size={21} />
              </span>
              <strong className="mt-4 block text-[12px] font-extrabold text-[#52657d]">
                아직 업로드된 파일이 없습니다
              </strong>
              <p className="mt-1 text-[12px] leading-6 text-[#96a2b1]">
                예: PPT 기획서나 광고 성과표를 추가하면 분석을 시작할 수 있습니다.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
