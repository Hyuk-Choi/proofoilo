import type { Metadata } from "next";

import { CoverLetterView } from "@/components/cover-letter/cover-letter-view";

export const metadata: Metadata = {
  title: "Cover Letter",
};

type CoverLetterPageProps = {
  searchParams: Promise<{ analysis?: string | string[] }>;
};

export default async function CoverLetterPage({
  searchParams,
}: CoverLetterPageProps) {
  const { analysis } = await searchParams;
  const initialAnalysisId = Array.isArray(analysis) ? analysis[0] : analysis;

  return <CoverLetterView initialAnalysisId={initialAnalysisId} />;
}
