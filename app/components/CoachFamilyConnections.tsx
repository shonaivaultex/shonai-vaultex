"use client";

import { createFamilyInvitation, coachRevokeFamilyLink, coachUpdateFamilyLinkRole } from "@/app/family/actions";

export type CoachFamilyConnection = {
  guardianId: string;
  name: string;
  email: string;
  phone: string | null;
  relationship: string;
  guardianRole: "primary_guardian" | "family_member";
  linkedAt: string;
};

export type CoachFamilyInvitation = {
  id: string;
  email: string;
  guardianName: string;
  phone: string | null;
  relationship: string;
  guardianRole: "primary_guardian" | "family_member";
  acceptedAt: string | null;
  expiresAt: string;
  createdAt: string;
};

const relationshipLabels: Record<string, string> = { mother: "母", father: "父", guardian: "保護者", other: "その他" };
const roleLabels = { primary_guardian: "主となる保護者", family_member: "家族メンバー" };
const formatDate = (value: string) => new Date(value).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

export default function CoachFamilyConnections({ athleteId, athleteName, connections, invitations }: { athleteId: string; athleteName: string; connections: CoachFamilyConnection[]; invitations: CoachFamilyInvitation[] }) {
  return <section className="rounded-2xl border border-sky-400/20 bg-sky-400/[.04] p-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black tracking-[.16em] text-sky-300">FAMILY CONNECTIONS</p><h2 className="mt-1 text-xl font-black">現在の保護者連携</h2><p className="mt-2 text-sm text-white/45">{athleteName}さんに連携中のアカウントと招待履歴です。</p></div><span className="rounded-full bg-sky-400/10 px-3 py-1.5 text-xs font-black text-sky-300">連携中 {connections.length}名</span></div>
    <div className="mt-5 space-y-3">{connections.length ? connections.map((connection) => <article key={connection.guardianId} className="rounded-xl border border-white/10 bg-black/20 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><strong className="block">{connection.name}</strong><span className="mt-1 block break-all text-xs text-white/45">{connection.email}</span>{connection.phone ? <span className="mt-1 block text-xs text-white/35">{connection.phone}</span> : null}<span className="mt-2 block text-[10px] text-white/30">{relationshipLabels[connection.relationship] ?? connection.relationship}・{formatDate(connection.linkedAt)}に連携</span></div><span className="rounded-full border border-sky-400/25 px-3 py-1 text-[10px] font-black text-sky-300">{roleLabels[connection.guardianRole]}</span></div><div className="mt-4 flex flex-wrap gap-2"><form action={coachUpdateFamilyLinkRole}><input type="hidden" name="athlete_id" value={athleteId}/><input type="hidden" name="guardian_id" value={connection.guardianId}/><input type="hidden" name="guardian_role" value={connection.guardianRole === "primary_guardian" ? "family_member" : "primary_guardian"}/><button className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white/65">{connection.guardianRole === "primary_guardian" ? "家族メンバーへ変更" : "主となる保護者に変更"}</button></form><form action={coachRevokeFamilyLink} onSubmit={(event) => { if (!window.confirm(`${connection.name}さんと${athleteName}さんの連携を解除しますか？`)) event.preventDefault(); }}><input type="hidden" name="athlete_id" value={athleteId}/><input type="hidden" name="guardian_id" value={connection.guardianId}/><button className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-bold text-red-300">連携を解除</button></form></div></article>) : <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/35">連携済みの保護者はいません。</p>}</div>
    <details className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4"><summary className="cursor-pointer text-sm font-black">招待履歴を確認（{invitations.length}件）</summary><div className="mt-4 space-y-2">{invitations.length ? invitations.map((invitation) => { const expired = new Date(invitation.expiresAt) <= new Date(); const status = invitation.acceptedAt ? "連携済み" : expired ? "期限切れ" : "招待中"; return <article key={invitation.id} className="rounded-lg border border-white/[.08] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="min-w-0"><strong className="block text-sm">{invitation.guardianName}</strong><span className="block break-all text-xs text-white/40">{invitation.email}</span><span className="mt-1 block text-[10px] text-white/25">送信：{formatDate(invitation.createdAt)}・期限：{formatDate(invitation.expiresAt)}</span></div><span className={`text-xs font-black ${invitation.acceptedAt ? "text-emerald-300" : expired ? "text-red-300" : "text-amber-300"}`}>{status}</span></div>{!invitation.acceptedAt ? <form action={createFamilyInvitation} className="mt-3"><input type="hidden" name="athlete_id" value={athleteId}/><input type="hidden" name="guardian_name" value={invitation.guardianName}/><input type="hidden" name="email" value={invitation.email}/><input type="hidden" name="phone" value={invitation.phone ?? ""}/><input type="hidden" name="relationship" value={invitation.relationship}/><input type="hidden" name="guardian_role" value={invitation.guardianRole}/><button className="rounded-lg border border-orange-500/35 px-3 py-2 text-xs font-bold text-orange-300">招待メールを再送</button></form> : null}</article>; }) : <p className="py-5 text-center text-xs text-white/35">招待履歴はありません。</p>}</div></details>
  </section>;
}
