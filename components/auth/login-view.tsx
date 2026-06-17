"use client";

import {
  ArrowRight,
  CheckCircle2,
  Cloud,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { loginToAccount } from "@/lib/auth/client-account";
import {
  loadFromLocalStorage,
  saveToLocalStorage,
} from "@/lib/storage";
import { sampleProofolioWorkspace } from "@/mock/proofolio-sample";

type StorageStatus = {
  mode: "local-file" | "supabase";
  ok: boolean;
  label: string;
  message: string;
  table?: string;
  accountCount?: number;
};

export function LoginView() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [localSummary, setLocalSummary] = useState({
    files: 0,
    analyses: 0,
    outputs: 0,
  });
  const [storageStatus, setStorageStatus] = useState<StorageStatus>();

  useEffect(() => {
    queueMicrotask(() => {
      const workspace = loadFromLocalStorage(sampleProofolioWorkspace);
      setLocalSummary({
        files: workspace.uploadedFiles.length,
        analyses: workspace.analyses.length,
        outputs:
          Object.keys(workspace.portfolioOutputs).length +
          Object.keys(workspace.coverLetterOutputs).length +
          Object.keys(workspace.resumeBullets).length +
          Object.keys(workspace.feedbackScores).length +
          Object.keys(workspace.interviewQuestions).length,
      });
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/storage/status")
      .then(async (response) => {
        const payload = (await response.json()) as StorageStatus;
        if (isMounted) setStorageStatus(payload);
      })
      .catch(() => {
        if (!isMounted) return;
        setStorageStatus({
          mode: "local-file",
          ok: false,
          label: "저장소 상태 확인 실패",
          message:
            "현재 저장소 연결 상태를 읽지 못했습니다. 서버 로그와 환경변수를 확인해 주세요.",
        });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      const workspace = loadFromLocalStorage(sampleProofolioWorkspace);
      const result = await loginToAccount({
        email,
        password,
        name,
        workspace,
      });

      saveToLocalStorage(result.workspace);
      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "로그인에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-8 text-[#14213d] sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.8fr)]">
        <section>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3"
            aria-label="Proofolio 대시보드"
          >
            <Image
              src="/icons/icon-192.png"
              alt=""
              width={44}
              height={44}
              priority
              className="size-11 rounded-[14px] shadow-[0_10px_25px_rgba(16,33,61,0.18)]"
            />
            <span>
              <strong className="block text-[20px] font-black tracking-[-0.045em] text-[#10213d]">
                Proofolio
              </strong>
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a98aa]">
                Career Intelligence
              </span>
            </span>
          </Link>

          <div className="mt-12">
            <p className="pf-tag pf-tag-primary">
              <Cloud size={14} />
              ACCOUNT SYNC
            </p>
            <h1 className="mt-4 max-w-2xl text-[38px] font-black leading-tight tracking-[-0.055em] text-[#10213d] sm:text-[48px]">
              같은 계정으로 접속하면 같은 커리어 워크스페이스를 봅니다
            </h1>
            <p className="mt-5 max-w-2xl text-[14px] leading-7 text-[#66758c]">
              이메일과 비밀번호로 로그인하면 업로드 파일 목록, 분석 리포트,
              포트폴리오, 자기소개서, 피드백과 면접 질문이 계정 단위로
              저장됩니다.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "업로드 파일",
                value: localSummary.files,
              },
              {
                label: "분석 리포트",
                value: localSummary.analyses,
              },
              {
                label: "생성 결과물",
                value: localSummary.outputs,
              },
            ].map((item) => (
              <article
                key={item.label}
                className="rounded-2xl border border-[#dfe6ef] bg-white p-4 shadow-[0_12px_30px_rgba(30,56,92,0.045)]"
              >
                <p className="text-[11px] font-bold text-[#78879a]">
                  현재 브라우저
                </p>
                <strong className="mt-2 block text-[28px] font-black tracking-[-0.04em] text-[#142541]">
                  {item.value}
                </strong>
                <p className="mt-1 text-[12px] font-semibold text-[#52657d]">
                  {item.label}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-[#d9e5f6] bg-[#f8fbff] p-5 text-[12px] leading-6 text-[#52657d]">
            <span className="mr-2 inline-flex rounded-full bg-[#eaf1ff] px-2.5 py-1 text-[10px] font-black text-[#2563eb]">
              예시
            </span>
            학교 노트북에서 분석한 포트폴리오를 집 노트북에서 같은 이메일로
            로그인해 이어서 수정할 수 있습니다.
          </div>

          {storageStatus ? (
            <div
              className={`mt-4 rounded-2xl border p-5 text-[12px] leading-6 ${
                storageStatus.ok
                  ? "border-[#cfe5d8] bg-[#f7fcf8] text-[#4f705b]"
                  : "border-[#f1d7dc] bg-[#fff7f8] text-[#9f3e4d]"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${
                    storageStatus.ok
                      ? "bg-[#e5f6eb] text-[#1f8a4c]"
                      : "bg-[#ffe8ec] text-[#b54455]"
                  }`}
                >
                  {storageStatus.mode === "supabase"
                    ? "WEB STORAGE"
                    : "LOCAL STORAGE"}
                </span>
                <strong className="text-[13px] text-[#10213d]">
                  {storageStatus.label}
                </strong>
                {typeof storageStatus.accountCount === "number" ? (
                  <span className="font-bold text-[#7a8ba3]">
                    계정 {storageStatus.accountCount}개
                  </span>
                ) : null}
              </div>
              <p className="mt-2">{storageStatus.message}</p>
              {storageStatus.table ? (
                <p className="mt-2 font-bold text-[#66758c]">
                  연결 테이블: {storageStatus.table}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="rounded-[28px] border border-[#dfe6ef] bg-white p-6 shadow-[0_24px_70px_rgba(30,56,92,0.12)] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black tracking-[0.16em] text-[#2563eb]">
                SIGN IN
              </p>
              <h2 className="mt-2 text-[24px] font-black tracking-[-0.04em] text-[#10213d]">
                계정 로그인
              </h2>
              <p className="mt-2 text-[12px] leading-6 text-[#7a8ba3]">
                처음 사용하는 이메일이면 계정이 자동 생성됩니다.
              </p>
            </div>
            <span className="grid size-11 place-items-center rounded-2xl bg-[#eaf1ff] text-[#2563eb]">
              <ShieldCheck size={20} />
            </span>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[12px] font-extrabold text-[#40536d]">
                <Mail size={14} className="text-[#2563eb]" />
                이메일
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                required
                className="h-12 w-full rounded-xl border border-[#dce4ef] bg-[#fafbfd] px-4 text-[13px] font-semibold text-[#40536d] outline-none transition placeholder:text-[#a4afbd] focus:border-[#8faef0] focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[12px] font-extrabold text-[#40536d]">
                <LockKeyhole size={14} className="text-[#2563eb]" />
                비밀번호
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="6자 이상"
                required
                minLength={6}
                className="h-12 w-full rounded-xl border border-[#dce4ef] bg-[#fafbfd] px-4 text-[13px] font-semibold text-[#40536d] outline-none transition placeholder:text-[#a4afbd] focus:border-[#8faef0] focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[12px] font-extrabold text-[#40536d]">
                <UserRound size={14} className="text-[#2563eb]" />
                이름 또는 표시명
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="처음 계정 생성 시 사용"
                className="h-12 w-full rounded-xl border border-[#dce4ef] bg-[#fafbfd] px-4 text-[13px] font-semibold text-[#40536d] outline-none transition placeholder:text-[#a4afbd] focus:border-[#8faef0] focus:bg-white"
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-[#f1d7dc] bg-[#fff7f8] px-4 py-3 text-[12px] font-semibold text-[#b54455]">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="pf-button-primary min-h-12 w-full text-[13px]"
            >
              {isSubmitting ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <CheckCircle2 size={17} />
              )}
              {isSubmitting ? "계정 동기화 중" : "로그인하고 동기화"}
              <ArrowRight size={15} />
            </button>
          </form>

          <p className="mt-5 text-[11px] leading-5 text-[#8b98aa]">
            로컬 실행과 임시 공개에서는 이 서버의 로컬 파일 저장소에 계정
            데이터가 저장됩니다. 무료 고정 배포에서는 Supabase 환경변수를
            연결하면 같은 계정 워크스페이스가 Supabase에 동기화됩니다.
          </p>
        </section>
      </div>
    </main>
  );
}
