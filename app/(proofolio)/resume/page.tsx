import type { Metadata } from "next";

import { ResumeView } from "@/components/resume/resume-view";

export const metadata: Metadata = {
  title: "Resume",
};

type ResumePageProps = {
  searchParams: Promise<{ analysis?: string | string[] }>;
};

export default async function ResumePage({ searchParams }: ResumePageProps) {
  const { analysis } = await searchParams;
  const initialAnalysisId = Array.isArray(analysis) ? analysis[0] : analysis;

  return <ResumeView initialAnalysisId={initialAnalysisId} />;
}
