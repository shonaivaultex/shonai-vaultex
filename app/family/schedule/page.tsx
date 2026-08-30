import { MapPin } from "lucide-react";
import FamilyShell, { Card, SectionTitle } from "../FamilyShell";
import { loadFamilyData, requireFamilyContext } from "@/lib/family";
import { updateFamilyAttendance } from "../actions";

const typeLabel: Record<string,string> = { practice:"SESSION",competition:"大会",measurement:"CONTROL TEST",other:"イベント" };
const statusLabel: Record<string,string> = { attending:"参加",absent:"欠席",undecided:"未定",unanswered:"未回答" };
const scheduleDate = (value: string, allDay: boolean) => new Date(value).toLocaleString("ja-JP", {
  timeZone: "Asia/Tokyo",
  month: "long",
  day: "numeric",
  weekday: "short",
  hour: allDay ? undefined : "2-digit",
  minute: allDay ? undefined : "2-digit",
});
export default async function FamilySchedulePage({ searchParams }: { searchParams: Promise<{ athlete?: string }> }) { const { athlete }=await searchParams; const context=await requireFamilyContext(athlete); const data=await loadFamilyData(context); const primary=context.athlete.guardianRole==="primary_guardian"; return <FamilyShell context={context} active="/family/schedule"><SectionTitle eyebrow="SCHEDULE & ATTENDANCE">予定・出欠</SectionTitle><p className="mt-3 text-sm text-black/50">既存のクラブ予定と出欠を表示しています。{primary ? "PRIMARY GUARDIANは出欠を回答できます。" : "出欠の変更はPRIMARY GUARDIANが行います。"}</p><div className="mt-6 space-y-4">{data.schedules.map((item)=><Card key={item.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><span className="text-[10px] font-black tracking-[.12em] text-orange-600">{typeLabel[item.schedule_type] ?? "予定"}</span><h3 className="mt-2 text-lg font-black">{item.title}</h3><p className="mt-2 text-sm font-bold text-black/55">{scheduleDate(item.starts_at, item.all_day)}</p>{item.location ? <p className="mt-2 flex items-center gap-1 text-xs text-black/40"><MapPin size={13}/>{item.location}</p>:null}</div><span className="rounded-full bg-black px-3 py-1.5 text-xs font-black text-white">{statusLabel[item.attendance]}</span></div>{primary ? <form action={updateFamilyAttendance} className="mt-5 flex flex-wrap gap-2"><input type="hidden" name="athlete_id" value={context.athlete.id}/><input type="hidden" name="schedule_id" value={item.id}/>{[["attending","参加"],["absent","欠席"],["undecided","未定"]].map(([value,label])=><button key={value} name="status" value={value} className={`rounded-lg border px-4 py-2 text-xs font-black ${item.attendance===value?"border-orange-500 bg-orange-500 text-black":"border-black/10 bg-white"}`}>{label}</button>)}</form>:null}</Card>)}{!data.schedules.length?<Card><p className="text-sm text-black/45">これからの予定はありません。</p></Card>:null}</div></FamilyShell>; }
