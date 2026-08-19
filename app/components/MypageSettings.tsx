"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { BookOpen, ChevronDown, ChevronRight, Download, Settings } from "lucide-react";
import { useState } from "react";

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
      className="group mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#111] text-white open:border-orange-500/35"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 marker:hidden">
        <Settings size={19} className="text-white/45" />
        <strong>その他</strong>
        <span className="text-xs text-white/35">設定・保存・ヘルプ</span>
        <ChevronDown size={18} className="ml-auto text-white/40 transition group-open:rotate-180" />
      </summary>
      {opened ? (
        <div className="border-t border-white/10 p-4">
          <PushNotificationButton />
          <a href="/api/performance/export" download className="mt-3 flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white/75 transition hover:border-orange-500/40 hover:text-white"><span className="flex items-center gap-2 font-bold"><Download size={17} className="text-orange-400" />記録データをCSVで保存</span><span className="text-xs text-white/35">バックアップ</span></a>
          <a href="/member-manual.pdf" target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm text-white/75"><span className="flex items-center gap-2 font-bold"><BookOpen size={17} className="text-orange-400" />使用マニュアル</span><ChevronRight size={16} /></a>
          <BugReportButton />
          <Link href="/edit" className="mt-3 block rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/70">プロフィール編集</Link>
        </div>
      ) : null}
    </details>
  );
}
