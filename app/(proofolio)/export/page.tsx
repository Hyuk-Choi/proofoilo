import type { Metadata } from "next";

import { ExportView } from "@/components/export/export-view";

export const metadata: Metadata = {
  title: "Export",
};

type ExportPageProps = {
  searchParams: Promise<{ analysis?: string | string[] }>;
};

export default async function ExportPage({
  searchParams,
}: ExportPageProps) {
  const { analysis } = await searchParams;
  const initialAnalysisId = Array.isArray(analysis) ? analysis[0] : analysis;

  return <ExportView initialAnalysisId={initialAnalysisId} />;
}
