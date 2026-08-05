import Link from "next/link";
import { ArrowRight } from "lucide-react";

type CtaLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: "dark" | "outline";
  className?: string;
};

export function CtaLink({
  href,
  children,
  variant = "dark",
  className = "",
}: CtaLinkProps) {
  const styles =
    variant === "dark"
      ? "bg-[#090a0c] text-white hover:bg-white hover:text-[#090a0c]"
      : "border border-current text-current hover:bg-[#090a0c] hover:text-white";

  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-3 px-6 py-4 text-xs font-black tracking-[0.14em] transition-colors ${styles} ${className}`}
    >
      {children}
      <ArrowRight
        aria-hidden="true"
        size={16}
        className="transition-transform group-hover:translate-x-1"
      />
    </Link>
  );
}
