import type { Metadata } from "next";

import { MarketFitLab } from "@/components/market-fit-lab";

export const metadata: Metadata = {
  title: "Market Fit Lab",
};

export default function MarketFitLabPage() {
  return <MarketFitLab />;
}
