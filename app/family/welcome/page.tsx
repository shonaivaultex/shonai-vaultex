import Link from "next/link";

export default function FamilyWelcomePage() {
  return <main className="grid min-h-screen place-items-center bg-[#f5f2ec] px-5 py-24 text-[#151515]"><section className="w-full max-w-xl rounded-3xl border border-black/10 bg-white p-8 text-center shadow-xl"><p className="text-[10px] font-black tracking-[.25em] text-orange-600">VAULTEX FAMILY</p><h1 className="mt-4 text-3xl font-black">ご家族との紐付けを確認中です</h1><p className="mt-5 text-sm leading-7 text-black/55">FAMILYは、VAULTEXから届く招待メールの「VAULTEX FAMILYをはじめる」から登録します。選手IDの入力は必要ありません。</p><Link href="/" className="mt-7 inline-flex rounded-xl bg-black px-5 py-3 text-sm font-black text-white">ホームへ戻る</Link></section></main>;
}
