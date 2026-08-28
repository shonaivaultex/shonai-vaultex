"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { BookOpen, ChevronDown, ChevronRight, Download, MessageCircle, Settings } from "lucide-react";
import { useState } from "react";
import { lineOfficialUrl } from "@/app/components/site";

const PushNotificationButton = dynamic(() => import("@/app/components/PushNotificationButton"), {
  loading: () => <div className="h-12 animate-pulse rounded-xl bg-white/[0.04]" />,
});
const BugReportButton = dynamic(() => import("@/app/components/BugReportButton"));

export default function MypageSettings() {
  const [opened, setOpened] = useState(false);

  return (
    <details
      data-tutorial="settings"
      onToggle={(event) => setOpened(event.currentTarget.open)}
      className="group mt-8 scroll-mt-24 overflow-hidden rounded-2xl border border-white/10 bg-[#111] text-white open:border-orange-500/35"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 marker:hidden">
        <Settings size={19} className="text-white/45" />
        <strong>設定・ヘルプ</strong>
        <span className="text-xs text-white/35">通知・プロフィール・サポート</span>
        <ChevronDown size={18} className="ml-auto text-white/40 transition group-open:rotate-180" />
      </summary>
      {opened ? (
        <div className="border-t border-white/10 p-4">
          <PushNotificationButton />
          <a href="/member-manual.pdf" target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm text-white/75"><span className="flex items-center gap-2 font-bold"><BookOpen size={17} className="text-orange-400" />使用マニュアル</span><ChevronRight size={16} /></a>
          <a href={lineOfficialUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-between rounded-xl border border-[#06c755]/30 bg-[#06c755]/5 px-4 py-3 text-sm text-white/75 transition hover:border-[#06c755]/60 hover:text-white"><span className="flex items-center gap-2 font-bold"><MessageCircle size={17} className="text-[#06c755]" />SHONAI VAULTEX公式LINE</span><span className="text-xs text-white/35">お知らせ・問い合わせ</span></a>
          <BugReportButton />
          <Link href="/edit" className="mt-3 block rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/70">プロフィール編集</Link>
          <details className="group/tools mt-3 rounded-xl border border-white/[.07] bg-black/15">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-bold text-white/35">
              詳細ツール
              <ChevronDown size={15} className="transition group-open/tools:rotate-180" />
            </summary>
            <div className="border-t border-white/[.07] p-3">
              <a href="/api/performance/export" download className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white/65 transition hover:border-orange-500/40 hover:text-white"><span className="flex items-center gap-2 font-bold"><Download size={17} className="text-orange-400" />記録データをCSVで保存</span><span className="text-xs text-white/30">バックアップ</span></a>
            </div>
          </details>
        </div>
      ) : null}
    </details>
  );
}
