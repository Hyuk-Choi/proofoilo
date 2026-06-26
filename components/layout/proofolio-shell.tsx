"use client";

import {
  Bell,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  ChevronDown,
  ClipboardCheck,
  FileOutput,
  FileText,
  Fingerprint,
  FolderSearch2,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageSquareText,
  PenLine,
  Search,
  Settings2,
  Sparkles,
  UploadCloud,
  UserRoundSearch,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import {
  clearAccountFromLocalStorage,
  logoutAccount,
} from "@/lib/auth/client-account";
import { clearProofolioLocalStorage } from "@/lib/storage";
import { useProofolioWorkspace } from "@/hooks/use-proofolio-workspace";
import type { ProofolioNavItem } from "@/types/proofolio";
import { InstallAppButton } from "./install-app-button";

const navigation: ProofolioNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Profile", href: "/profile", icon: Settings2 },
  { label: "My Inputs", href: "/inputs", icon: PenLine },
  { label: "Upload", href: "/upload", icon: UploadCloud },
  { label: "Analysis", href: "/analysis", icon: FolderSearch2 },
  { label: "Personal Brand", href: "/personal-brand", icon: Fingerprint },
  {
    label: "Skill Analysis",
    href: "/skill-analysis",
    icon: ChartNoAxesCombined,
  },
  { label: "Portfolio", href: "/portfolio", icon: BriefcaseBusiness },
  { label: "Cover Letter", href: "/cover-letter", icon: FileText },
  { label: "Resume", href: "/resume", icon: ClipboardCheck },
  { label: "Feedback", href: "/feedback", icon: MessageSquareText },
  { label: "Interview", href: "/interview", icon: UserRoundSearch },
  { label: "Export", href: "/export", icon: FileOutput },
];

const pageMeta: Record<string, { eyebrow: string; title: string }> = {
  "/dashboard": { eyebrow: "CAREER WORKSPACE", title: "Dashboard" },
  "/profile": { eyebrow: "PROFILE SETTINGS", title: "My Profile" },
  "/inputs": { eyebrow: "CAREER SOURCE", title: "My Inputs" },
  "/upload": { eyebrow: "SOURCE LIBRARY", title: "Upload" },
  "/analysis": { eyebrow: "AI INSIGHT", title: "Analysis" },
  "/personal-brand": {
    eyebrow: "BRAND IDENTITY",
    title: "Personal Brand",
  },
  "/skill-analysis": {
    eyebrow: "SKILL INTELLIGENCE",
    title: "Skill Analysis",
  },
  "/portfolio": { eyebrow: "CAREER STORY", title: "Portfolio" },
  "/cover-letter": { eyebrow: "APPLICATION", title: "Cover Letter" },
  "/resume": { eyebrow: "EXPERIENCE", title: "Resume" },
  "/feedback": { eyebrow: "EXPERT REVIEW", title: "Feedback" },
  "/interview": { eyebrow: "PREPARATION", title: "Interview" },
  "/export": { eyebrow: "FINAL OUTPUT", title: "Export" },
};

function ProofolioLogo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3" aria-label="Proofolio 대시보드">
      <Image
        src="/icons/icon-192.png"
        alt=""
        width={40}
        height={40}
        priority
        className="size-10 rounded-[13px] shadow-[0_10px_25px_rgba(16,33,61,0.18)]"
      />
      <span>
        <strong className="block text-[18px] font-black tracking-[-0.045em] text-[#10213d]">
          Proofolio
        </strong>
        <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-[#8a98aa]">
          Career Intelligence
        </span>
      </span>
    </Link>
  );
}

function getProfileInitials(name: string, englishName: string) {
  const source = name.trim() || englishName.trim();
  if (!source) return "ME";

  const words = source.split(/\s+/);
  if (words.length > 1) {
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function ProofolioShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { account, workspace } = useProofolioWorkspace();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const sidebarId = useId();
  const meta = pageMeta[pathname] ?? pageMeta["/dashboard"];
  const profile = workspace.userProfile;
  const initials = getProfileInitials(profile.name, profile.englishName);

  const handleLogout = async () => {
    await logoutAccount();
    clearProofolioLocalStorage();
    clearAccountFromLocalStorage();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-[#14213d]">
      <aside
        id={sidebarId}
        className="proofolio-sidebar fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-[#e4eaf2] bg-white px-4 py-5 transition-transform duration-200 ease-out"
        data-open={mobileNavOpen}
        aria-label="Proofolio 사이드바"
      >
        <div className="flex items-center justify-between px-2">
          <ProofolioLogo />
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="grid size-9 place-items-center rounded-xl text-[#7d8ba0] hover:bg-[#f3f6fa] lg:hidden"
            aria-label="사이드바 닫기"
          >
            <X size={18} />
          </button>
        </div>

        <Link
          href="/profile"
          onClick={() => setMobileNavOpen(false)}
          className="mt-7 flex w-full items-center gap-3 rounded-2xl border border-[#e4eaf2] bg-[#f8fafc] p-3 text-left transition hover:border-[#cfd9e8] hover:bg-white"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#10213d] text-[11px] font-black text-white">
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-extrabold text-[#263853]">
              {profile.name ? `${profile.name}의 워크스페이스` : "내 워크스페이스"}
            </span>
            <span className="mt-0.5 block truncate text-[10px] font-medium text-[#8794a7]">
              {profile.targetRole || "목표 직무를 설정하세요"}
            </span>
          </span>
          <ChevronDown size={14} className="text-[#9aa6b7]" />
        </Link>

        {account.status === "authenticated" ? (
          <div className="mt-3 rounded-2xl border border-[#cfe8df] bg-[#f4fbf8] px-4 py-3 text-[11px] font-bold text-[#168765]">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#15966f]" />
              계정 저장 활성화
            </span>
            <span className="mt-1 block truncate text-[#5f8d7c]">
              {account.user.email}
            </span>
          </div>
        ) : (
          <Link
            href="/login"
            onClick={() => setMobileNavOpen(false)}
            className="mt-3 flex items-center gap-2 rounded-2xl border border-[#dce4ef] bg-white px-4 py-3 text-[12px] font-extrabold text-[#52657d] transition hover:border-[#b9c9df] hover:text-[#2563eb]"
          >
            <LogIn size={15} />
            로그인하고 계정 동기화
          </Link>
        )}

        <nav
          className="mt-7 min-h-0 flex-1 overflow-y-auto pr-1"
          aria-label="Proofolio 주요 메뉴"
        >
          <p className="mb-2 px-3 text-[9px] font-black uppercase tracking-[0.18em] text-[#a0abba]">
            Workspace
          </p>
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-bold transition ${
                    active
                      ? "bg-[#eaf1ff] text-[#1e5bd7]"
                      : "text-[#66758c] hover:bg-[#f5f7fa] hover:text-[#263853]"
                  }`}
                >
                  <Icon size={17} strokeWidth={active ? 2.4 : 2} />
                  <span className="flex-1">{item.label}</span>
                  {active && <span className="size-1.5 rounded-full bg-[#2563eb]" />}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="mt-5">
          <div className="rounded-2xl bg-[#10213d] p-4 text-white shadow-[0_16px_35px_rgba(16,33,61,0.15)]">
            <div className="flex items-center justify-between">
              <span className="grid size-8 place-items-center rounded-lg bg-white/10 text-[#8eb5ff]">
                <Sparkles size={16} />
              </span>
              <span className="rounded-full bg-[#1f6feb] px-2.5 py-1 text-[9px] font-black tracking-[0.1em]">
                PRO
              </span>
            </div>
            <strong className="mt-4 block text-[13px] font-extrabold">
              더 강한 커리어 스토리
            </strong>
            <p className="mt-1.5 text-[10px] leading-4 text-white/55">
              프로젝트 근거를 채용 담당자가 이해하는 역량으로 정리하세요.
            </p>
          </div>
        </div>
      </aside>

      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[#0f1e36]/35 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-label="사이드바 배경 닫기"
        />
      )}

      <div className="min-h-screen lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-[#e4eaf2] bg-white/90 px-4 backdrop-blur-xl sm:px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="grid size-11 place-items-center rounded-xl border border-[#dfe6ef] text-[#4d5f78] lg:hidden"
              aria-label="사이드바 열기"
              aria-controls={sidebarId}
              aria-expanded={mobileNavOpen}
            >
              <Menu size={19} />
            </button>
            <div>
              <p className="text-[9px] font-black tracking-[0.16em] text-[#7a8ba3]">
                {meta.eyebrow}
              </p>
              <h1 className="mt-0.5 text-[18px] font-black tracking-[-0.035em] text-[#132440]">
                {meta.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="md:hidden">
              <InstallAppButton compact />
            </div>
            <div className="hidden md:block">
              <InstallAppButton />
            </div>
            {account.status === "authenticated" ? (
              <div className="hidden items-center gap-2 rounded-xl border border-[#cfe8df] bg-[#f4fbf8] px-3 py-2 text-[11px] font-extrabold text-[#168765] xl:flex">
                <span className="size-2 rounded-full bg-[#15966f]" />
                {account.user.email}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden items-center gap-2 rounded-xl border border-[#dce4ef] bg-white px-3 py-2 text-[11px] font-extrabold text-[#52657d] transition hover:border-[#b9c9df] hover:text-[#2563eb] md:flex"
              >
                <LogIn size={14} />
                로그인
              </Link>
            )}
            <label className="relative hidden md:block">
              <span className="sr-only">워크스페이스 검색</span>
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa7b8]"
              />
              <input
                type="search"
                placeholder="프로젝트 또는 파일 검색"
                className="h-10 w-[260px] rounded-xl border border-transparent bg-[#f3f6fa] pl-10 pr-4 text-[11px] font-semibold text-[#31435d] outline-none transition placeholder:text-[#9aa7b8] focus:border-[#9dbaf7] focus:bg-white"
              />
            </label>
            <button
              type="button"
              className="relative grid size-11 place-items-center rounded-xl border border-[#e1e7ef] bg-white text-[#64748b] transition hover:bg-[#f7f9fc] sm:size-10"
              aria-label="알림"
            >
              <Bell size={17} />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#2563eb] ring-2 ring-white" />
            </button>
            <Link
              href="/profile"
              className="flex h-11 items-center gap-2 rounded-xl border border-[#e1e7ef] bg-white px-2.5 transition hover:bg-[#f7f9fc] sm:h-10"
              aria-label="내 정보 설정"
            >
              <span className="grid size-7 place-items-center rounded-lg bg-[#dbe8ff] text-[10px] font-black text-[#1e5bd7]">
                {initials}
              </span>
              <ChevronDown size={13} className="hidden text-[#8d9aab] sm:block" />
            </Link>
            {account.status === "authenticated" ? (
              <button
                type="button"
                onClick={handleLogout}
                className="grid size-11 place-items-center rounded-xl border border-[#f1d7dc] bg-white text-[#c24b5a] transition hover:bg-[#fff7f8] sm:size-10"
                aria-label="로그아웃"
              >
                <LogOut size={16} />
              </button>
            ) : null}
          </div>
        </header>

        <main className="mx-auto min-w-0 w-full max-w-[1500px] px-4 py-7 sm:px-5 lg:px-8 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
