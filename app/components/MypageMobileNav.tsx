"use client";

import Link from "next/link";
import { CalendarDays, Home, Menu, MessageCircle, Plus } from "lucide-react";
import { usePathname } from "next/navigation";

type MobileNavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
  primary?: boolean;
  tutorial: string;
  match?: (pathname: string) => boolean;
};

const items: MobileNavItem[] = [
  { href: "/mypage", label: "ホーム", icon: Home, exact: true, tutorial: "mobile-home" },
  { href: "/mypage/my-calendar", label: "カレンダー", icon: CalendarDays, tutorial: "mobile-calendar", match: (pathname) => pathname === "/mypage/my-calendar" || pathname === "/mypage/schedules" },
  { href: "/performance", label: "記録", icon: Plus, primary: true, tutorial: "mobile-record" },
  { href: "/mypage/consult", label: "相談", icon: MessageCircle, tutorial: "mobile-consult", match: (pathname) => ["/mypage/consult", "/mypage/ai-navigator", "/mypage/video-feedback"].some((path) => pathname.startsWith(path)) },
  { href: "/mypage/menu", label: "その他", icon: Menu, tutorial: "mobile-menu" },
];

export default function MypageMobileNav() {
  const pathname = usePathname();
  const isMemberPage = pathname === "/mypage" || pathname.startsWith("/mypage/") || pathname === "/performance";
  if (!isMemberPage) return null;

  return (
    <>
      <div aria-hidden="true" className="h-24 md:hidden" />
      <nav aria-label="マイページメニュー" className="fixed inset-x-2 bottom-[max(.5rem,env(safe-area-inset-bottom))] z-[90] grid grid-cols-5 rounded-2xl border border-white/10 bg-[#111]/95 p-1.5 text-white shadow-[0_16px_50px_rgba(0,0,0,.7)] backdrop-blur-xl md:hidden">
        {items.map(({ href, label, icon: Icon, tutorial, ...item }) => {
          const baseHref = href.split("#")[0];
          const active = item.match ? item.match(pathname) : item.exact ? pathname === baseHref : pathname.startsWith(baseHref);
          const primary = item.primary;
          return (
            <Link key={href} href={href} data-tutorial={tutorial} aria-current={active ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[9px] font-black transition ${primary ? "bg-orange-500 text-black shadow-lg shadow-orange-500/15" : active ? "bg-white/[.08] text-orange-300" : "text-white/45"}`}>
              <Icon aria-hidden="true" size={primary ? 21 : 19} strokeWidth={primary ? 3 : 2.3} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
