"use client";

import { ExternalLink, X } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

const TARGET_PATHS = ["/mypage", "/family"];

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function subscribe() {
  return () => undefined;
}

function getExternalUrl() {
  const current = new URL(window.location.href);
  const supportedPath = TARGET_PATHS.some((path) => current.pathname === path || current.pathname.startsWith(`${path}/`));
  const isLineBrowser = /\bLine\//i.test(navigator.userAgent);

  if (!supportedPath || !isLineBrowser || isStandalone() || current.searchParams.get("openExternalBrowser") === "1") return null;

  current.searchParams.set("openExternalBrowser", "1");
  return current.toString();
}

export default function LineExternalBrowserPrompt() {
  const externalUrl = useSyncExternalStore(subscribe, getExternalUrl, () => null);
  const [dismissed, setDismissed] = useState(false);

  if (!externalUrl || dismissed) return null;

  return (
    <aside className="sticky top-[70px] z-[85] border-y border-[#06c755]/30 bg-[#07130c]/95 px-4 py-3 text-white shadow-xl backdrop-blur md:top-[76px]" aria-label="VAULTEXアプリで開く案内">
      <div className="mx-auto flex max-w-[1480px] items-center gap-3">
        <span className="min-w-0 flex-1">
          <strong className="block text-sm">VAULTEXアプリで開く</strong>
          <span className="mt-0.5 block text-[11px] leading-4 text-white/55">LINE内ではなく、スマホのブラウザからアプリ版を開きます。</span>
        </span>
        <a href={externalUrl} target="_blank" rel="noopener noreferrer external" className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#06c755] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#05b64d]">
          アプリで開く <ExternalLink size={14} />
        </a>
        <button type="button" onClick={() => setDismissed(true)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white" aria-label="案内を閉じる">
          <X size={17} />
        </button>
      </div>
    </aside>
  );
}
