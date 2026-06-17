import type { Metadata } from "next";

import { SkillAnalysisView } from "@/components/skill-analysis/skill-analysis-view";

export const metadata: Metadata = {
  title: "Skill Analysis",
};

export default function SkillAnalysisPage() {
  return <SkillAnalysisView />;
}
