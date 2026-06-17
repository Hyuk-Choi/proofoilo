import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Clock3, LockKeyhole, Sparkles } from "lucide-react";
import Link from "next/link";

type WorkflowPlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  nextStep?: string;
};

export function WorkflowPlaceholder({
  eyebrow,
  title,
  description,
  icon: Icon,
  nextStep,
}: WorkflowPlaceholderProps) {
  return (
    <div className="grid min-h-[calc(100vh-145px)] place-items-center">
      <section className="w-full max-w-3xl overflow-hidden rounded-3xl border border-[#e0e7f0] bg-white shadow-[0_22px_55px_rgba(31,55,86,0.08)]">
        <div className="border-b border-[#e8edf3] bg-[linear-gradient(135deg,#f7faff_0%,#eef4ff_100%)] px-7 py-8 sm:px-10">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#2563eb] text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)]">
            <Icon size={22} />
          </span>
          <p className="mt-5 text-[10px] font-black tracking-[0.18em] text-[#2563eb]">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-[27px] font-black tracking-[-0.04em] text-[#10213d]">
            {title}
          </h2>
          <p className="mt-3 max-w-xl text-[12px] leading-6 text-[#6b7b91]">
            {description}
          </p>
        </div>

        <div className="grid gap-4 p-7 sm:grid-cols-2 sm:p-10">
          <div className="rounded-2xl border border-[#e4eaf2] bg-[#f8fafc] p-5">
            <span className="grid size-9 place-items-center rounded-xl bg-white text-[#66758c] shadow-sm">
              <Clock3 size={17} />
            </span>
            <strong className="mt-4 block text-[12px] font-extrabold text-[#31435d]">
              단계별 구현 예정
            </strong>
            <p className="mt-2 text-[10px] leading-5 text-[#8593a5]">
              현재 단계에서는 전체 워크플로우와 화면 이동 구조를 먼저 완성했습니다.
            </p>
          </div>
          <div className="rounded-2xl border border-[#e4eaf2] bg-[#f8fafc] p-5">
            <span className="grid size-9 place-items-center rounded-xl bg-white text-[#2563eb] shadow-sm">
              {nextStep ? <Sparkles size={17} /> : <LockKeyhole size={17} />}
            </span>
            <strong className="mt-4 block text-[12px] font-extrabold text-[#31435d]">
              {nextStep ?? "분석 완료 후 사용"}
            </strong>
            <p className="mt-2 text-[10px] leading-5 text-[#8593a5]">
              실제 파일 처리와 AI 생성 기능은 이후 단계에서 안전하게 연결됩니다.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#e8edf3] px-7 py-5 sm:px-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-[10px] font-extrabold text-[#66758c] hover:text-[#2563eb]"
          >
            <ArrowLeft size={14} />
            Dashboard로 돌아가기
          </Link>
          <span className="rounded-full bg-[#eaf1ff] px-3 py-1.5 text-[9px] font-extrabold text-[#2563eb]">
            Proofolio MVP
          </span>
        </div>
      </section>
    </div>
  );
}
