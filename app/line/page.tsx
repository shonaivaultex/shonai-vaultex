import Link from "next/link";
import { Home, MessageCircle, Users } from "lucide-react";

const items = [
  { href: "https://line.me/R/ti/p/@082fhyco", label: "参加・体験を相談する", detail: "初めての方は、LINEのトークで「参加希望」または「体験希望」と送ってください。パーソナルの相談もこちら。", icon: MessageCircle },
  { href: "/mypage?openExternalBrowser=1", label: "マイページを開く", detail: "登録済みの方：予定確認・参加申込み・キャンセルはこちら。", icon: Home },
  { href: "/mypage/consult?openExternalBrowser=1", label: "コーチに相談する", detail: "登録後の練習・目標についての個別相談。ログインが必要です。", icon: Users },
];

export default function LineMenuPage() {
  return <main className="min-h-screen bg-[#090a0c] px-4 pb-16 pt-20 text-white"><div className="mx-auto max-w-xl">
    <p className="text-xs font-black tracking-[.24em] text-[#06c755]">VAULTEX × LINE</p>
    <h1 className="mt-3 text-3xl font-black tracking-tight">目的に合わせて選ぶ</h1>
    <p className="mt-3 text-sm leading-7 text-white/65">初めての方はLINEで相談。登録済みの方はマイページから参加日を選べます。</p>
    <section className="mt-8 grid gap-3">{items.map(({ href, label, detail, icon: Icon }) => <Link key={href} href={href} className="rounded-2xl border border-white/15 bg-[#111] p-6 transition hover:border-[#06c755]/50"><Icon className="text-[#06c755]"/><h2 className="mt-3 text-lg font-bold">{label}</h2><p className="mt-3 text-sm leading-7 text-white/65">{detail}</p></Link>)}</section>
    <p className="mt-6 text-sm leading-7 text-white/65">参加希望の相談だけでは各回の申込みは完了しません。登録後に参加日を選び、「申込み済み・参加確定」を確認してください。</p>
    <Link href="/family?openExternalBrowser=1" className="mt-4 inline-block py-3 text-sm text-white/65 underline">保護者ページをご利用の方はこちら</Link>
  </div></main>;
}
