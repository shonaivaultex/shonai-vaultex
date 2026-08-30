import Link from "next/link";
import { Bell, CalendarCheck, ChartNoAxesCombined, ChevronRight, Home, LockKeyhole, UserRoundPlus } from "lucide-react";
import FamilyShell, { Card, SectionTitle } from "../FamilyShell";
import { requireFamilyContext } from "@/lib/family";

const guides = [
  {
    icon: Home,
    number: "01",
    title: "HOMEで最近の様子を確認",
    text: "今月の活動、最近の成長、次回予定、コーチコメント、重要なお知らせをまとめて確認できます。毎回すべての画面を開く必要はありません。",
  },
  {
    icon: ChartNoAxesCombined,
    number: "02",
    title: "「成長」で変化を見守る",
    text: "ATHLETE SCANや主要記録を、現在の点数ではなく前回・初回からの変化として表示します。弱点を探す画面ではなく、次の成長を見守るための画面です。",
  },
  {
    icon: CalendarCheck,
    number: "03",
    title: "予定を確認して出欠を回答",
    text: "SESSION、CLASS、CONTROL TEST、大会、イベントを確認できます。出欠を変更できるのはPRIMARY GUARDIANです。FAMILY MEMBERは予定を閲覧できます。",
  },
  {
    icon: Bell,
    number: "04",
    title: "お知らせを確認",
    text: "会場変更、休講、持ち物、CONTROL TEST、大会連絡など、活動を支えるために必要な連絡を確認できます。",
  },
  {
    icon: UserRoundPlus,
    number: "05",
    title: "家族を追加する",
    text: "PRIMARY GUARDIANは設定から家族を招待できます。家族ごとに別のメールアドレスとパスワードを使用し、同じアカウントを共有しないでください。",
  },
] as const;

export default async function FamilyHelpPage({ searchParams }: { searchParams: Promise<{ athlete?: string }> }) {
  const { athlete } = await searchParams;
  const context = await requireFamilyContext(athlete);
  return <FamilyShell context={context} active="/family/settings">
    <SectionTitle eyebrow="HOW TO USE">VAULTEX FAMILYの使い方</SectionTitle>
    <p className="mt-3 max-w-2xl text-sm leading-7 text-black/50">FAMILYは、お子さまを監視・指導する画面ではありません。成長を理解し、予定・連絡・手続きを支えるための保護者向けサービスです。</p>
    <div className="mt-7 space-y-4">{guides.map(({ icon: Icon, number, title, text }) => <Card key={number}><div className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-700"><Icon size={21}/></span><div><p className="text-[10px] font-black tracking-[.18em] text-orange-600">STEP {number}</p><h2 className="mt-1 text-lg font-black">{title}</h2><p className="mt-2 text-sm leading-7 text-black/55">{text}</p></div></div></Card>)}</div>
    <Card className="mt-5 border-orange-200 bg-orange-50"><div className="flex gap-4"><LockKeyhole className="shrink-0 text-orange-700"/><div><h2 className="font-black">保護者へ公開されない情報</h2><p className="mt-2 text-sm leading-7 text-black/55">選手本人の感覚メモ、日誌、VAULTEX AIの相談、コーチとの個別相談、心理的な自由記述、動画は自動公開されません。</p></div></div></Card>
    <div className="mt-6 grid gap-3 sm:grid-cols-2"><Link href={`/family?athlete=${context.athlete.id}`} className="flex items-center justify-between rounded-xl bg-black px-5 py-4 text-sm font-black text-white">FAMILY HOMEへ<ChevronRight size={18}/></Link><Link href={`/family/settings?athlete=${context.athlete.id}`} className="flex items-center justify-between rounded-xl border border-black/10 bg-white px-5 py-4 text-sm font-black">設定へ戻る<ChevronRight size={18}/></Link></div>
  </FamilyShell>;
}
