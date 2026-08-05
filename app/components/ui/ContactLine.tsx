import type { LucideIcon } from "lucide-react";

type ContactLineProps = {
  icon: LucideIcon;
  children: React.ReactNode;
};

export function ContactLine({ icon: Icon, children }: ContactLineProps) {
  return (
    <p className="flex items-start gap-3">
      <Icon aria-hidden="true" size={18} className="mt-0.5 shrink-0" />
      {children}
    </p>
  );
}
