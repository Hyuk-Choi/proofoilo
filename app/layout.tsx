import type { Metadata, Viewport } from "next";

import { ServiceWorkerRegister } from "@/components/layout/service-worker-register";

import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  applicationName: "Proofolio",
  manifest: "/manifest.webmanifest",
  title: {
    default: "Proofolio",
    template: "%s | Proofolio",
  },
  description:
    "프로젝트 파일과 활동 기록을 직무 역량 중심의 포트폴리오로 전환하는 커리어 브랜딩 워크스페이스",
  appleWebApp: {
    capable: true,
    title: "Proofolio",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      {
        url: "/icons/favicon-32.png?v=10",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/icons/icon-192.png?v=10",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png?v=10",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: "Proofolio",
    description:
      "프로젝트 근거를 채용 담당자가 이해하는 포트폴리오, 자기소개서, 이력서 문장으로 전환하는 커리어 브랜딩 워크스페이스",
    siteName: "Proofolio",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Proofolio",
    description:
      "프로젝트 근거를 직무 역량 중심의 커리어 콘텐츠로 전환하는 SaaS 워크스페이스",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
