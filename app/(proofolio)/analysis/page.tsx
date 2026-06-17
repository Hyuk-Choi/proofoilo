import type { Metadata } from "next";

import { AnalysisView } from "@/components/analysis/analysis-view";

export const metadata: Metadata = {
  title: "Analysis",
};

export default function AnalysisPage() {
  return <AnalysisView />;
}
