import { ProofolioShell } from "@/components/layout/proofolio-shell";

export default function ProofolioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProofolioShell>{children}</ProofolioShell>;
}
