import type { Metadata } from "next";

import {
  FeedbackView,
  type FeedbackTarget,
} from "@/components/feedback/feedback-view";

export const metadata: Metadata = {
  title: "Feedback",
};

type FeedbackPageProps = {
  searchParams: Promise<{
    analysis?: string | string[];
    target?: string | string[];
  }>;
};

export default async function FeedbackPage({
  searchParams,
}: FeedbackPageProps) {
  const { analysis, target } = await searchParams;
  const initialAnalysisId = Array.isArray(analysis) ? analysis[0] : analysis;
  const requestedTarget = Array.isArray(target) ? target[0] : target;
  const initialTarget: FeedbackTarget =
    requestedTarget === "coverLetter" ? "coverLetter" : "portfolio";

  return (
    <FeedbackView
      initialAnalysisId={initialAnalysisId}
      initialTarget={initialTarget}
    />
  );
}
