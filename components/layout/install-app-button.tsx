"use client";

import { Download, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function getInstallGuide() {
  if (typeof window === "undefined") {
    return "브라우저 메뉴에서 앱 설치 또는 홈 화면에 추가를 선택하세요.";
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(userAgent);
  const isSafari =
    isIos && /safari/.test(userAgent) && !/crios|fxios|edgios/.test(userAgent);

  if (isSafari) {
    return "Safari 공유 버튼을 누른 뒤 '홈 화면에 추가'를 선택하세요.";
  }

  if (/android/.test(userAgent)) {
    return "브라우저 메뉴에서 '앱 설치' 또는 '홈 화면에 추가'를 선택하세요.";
  }

  return "주소창 또는 브라우저 메뉴에서 Proofolio 앱 설치를 선택하세요.";
}

function getIsStandalone() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function InstallAppButton({ compact = false }: { compact?: boolean }) {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(getIsStandalone);
  const [message, setMessage] = useState("");

  const guide = useMemo(() => getInstallGuide(), []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setMessage("");
    };

    const handleInstalled = () => {
      setIsStandalone(true);
      setInstallPrompt(null);
      setMessage("Proofolio가 앱으로 설치되었습니다.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (isStandalone) {
      setMessage("이미 앱 모드로 실행 중입니다.");
      return;
    }

    if (!installPrompt) {
      setMessage(guide);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    setInstallPrompt(null);
    setMessage(
      choice.outcome === "accepted"
        ? "Proofolio 앱 설치가 시작되었습니다."
        : guide,
    );
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleInstall}
        className={
          compact
            ? "grid size-11 place-items-center rounded-xl border border-[#d7e2f2] bg-[#eef5ff] text-[#2563eb] shadow-[0_8px_18px_rgba(37,99,235,0.1)] transition hover:border-[#b7cff9] hover:bg-[#e6f0ff] sm:size-10"
            : "inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#d7e2f2] bg-[#eef5ff] px-3 text-[11px] font-extrabold text-[#2563eb] shadow-[0_8px_18px_rgba(37,99,235,0.1)] transition hover:border-[#b7cff9] hover:bg-[#e6f0ff]"
        }
        aria-label="Proofolio 앱 다운로드"
      >
        {compact ? <Download size={17} /> : <Smartphone size={15} />}
        {!compact ? <span>앱 다운로드</span> : null}
      </button>
      {message ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[260px] rounded-2xl border border-[#dce4ef] bg-white p-3 text-[11px] font-semibold leading-5 text-[#52657d] shadow-[0_18px_45px_rgba(30,56,92,0.14)]">
          {message}
        </div>
      ) : null}
    </div>
  );
}
