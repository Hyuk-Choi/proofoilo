import type { Metadata } from "next";

import { PortfolioView } from "@/components/portfolio/portfolio-view";

export const metadata: Metadata = {
  title: "Portfolio",
};

type PortfolioPageProps = {
  searchParams: Promise<{ analysis?: string | string[] }>;
};

export default async function PortfolioPage({
  searchParams,
}: PortfolioPageProps) {
  const { analysis } = await searchParams;
  const initialAnalysisId = Array.isArray(analysis) ? analysis[0] : analysis;

  return <PortfolioView initialAnalysisId={initialAnalysisId} />;
}
