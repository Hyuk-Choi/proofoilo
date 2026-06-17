import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Proofolio",
    short_name: "Proofolio",
    description:
      "프로젝트 근거를 포트폴리오, 자기소개서, 이력서 문장, 피드백, 면접 질문으로 전환하는 커리어 브랜딩 워크스페이스",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f4f7fb",
    theme_color: "#2563eb",
  };
}
