"use client";

import { useState } from "react";

import type { ProjectAnalysis } from "@/types/proofolio";

export function useAnalysisSelection(
  analyses: ProjectAnalysis[],
  initialAnalysisId?: string,
) {
  const [requestedId, setRequestedId] = useState(initialAnalysisId ?? "");
  const selectedAnalysis =
    analyses.find((analysis) => analysis.id === requestedId) ?? analyses[0];
  const selectedId = selectedAnalysis?.id ?? "";

  const selectAnalysis = (analysisId: string) => {
    setRequestedId(analysisId);

    const url = new URL(window.location.href);
    url.searchParams.set("analysis", analysisId);
    window.history.replaceState(null, "", url);
  };

  return {
    selectedId,
    selectedAnalysis,
    selectAnalysis,
  };
}
