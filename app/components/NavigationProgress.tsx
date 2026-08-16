"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => { setLoading(false); }, [pathname]);

  useEffect(() => {
    const beginNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (!target || target.target === "_blank" || target.hasAttribute("download")) return;
      const href = target.href; if (!href) return; const url = new URL(href);
      if (url.origin !== window.location.origin || (url.pathname === window.location.pathname && url.search === window.location.search)) return;
      setLoading(true);
    };
    document.addEventListener("click", beginNavigation, true);
    return () => document.removeEventListener("click", beginNavigation, true);
  }, []);

  useEffect(() => {
    if (!loading) return;
    const timeout = window.setTimeout(() => setLoading(false), 10000);
    return () => window.clearTimeout(timeout);
  }, [loading]);

  if (!loading) return null;
  return <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-orange-950/40" role="progressbar" aria-label="画面を読み込んでいます"><span className="navigation-progress block h-full w-1/3 bg-orange-500 shadow-[0_0_14px_rgba(249,115,22,0.9)]" /></div>;
}
