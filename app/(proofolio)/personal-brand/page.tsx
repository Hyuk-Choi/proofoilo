import type { Metadata } from "next";

import { PersonalBrandView } from "@/components/personal-brand/personal-brand-view";

export const metadata: Metadata = {
  title: "Personal Brand",
};

export default function PersonalBrandPage() {
  return <PersonalBrandView />;
}
