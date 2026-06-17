import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type ProofolioButtonProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  variant?: "primary" | "secondary";
};

export function ProofolioButton({
  href,
  label,
  icon: Icon,
  variant = "primary",
}: ProofolioButtonProps) {
  return (
    <Link
      href={href}
      className={`min-h-11 text-[12px] ${
        variant === "primary"
          ? "pf-button-primary"
          : "pf-button-secondary"
      }`}
    >
      <Icon size={16} />
      {label}
    </Link>
  );
}
