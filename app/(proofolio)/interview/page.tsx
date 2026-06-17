import type { Metadata } from "next";

import { InterviewView } from "@/components/interview/interview-view";

export const metadata: Metadata = {
  title: "Interview",
};

type InterviewPageProps = {
  searchParams: Promise<{ analysis?: string | string[] }>;
};

export default async function InterviewPage({
  searchParams,
}: InterviewPageProps) {
  const { analysis } = await searchParams;
  const initialAnalysisId = Array.isArray(analysis) ? analysis[0] : analysis;

  return <InterviewView initialAnalysisId={initialAnalysisId} />;
}
