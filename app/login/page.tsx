import type { Metadata } from "next";

import { LoginView } from "@/components/auth/login-view";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Proofolio 계정으로 로그인하고 같은 워크스페이스 정보를 동기화합니다.",
};

export default function LoginPage() {
  return <LoginView />;
}
