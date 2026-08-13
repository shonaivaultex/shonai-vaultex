import { PauseCircle } from "lucide-react";
import LogoutButton from "@/app/components/LogoutButton";

export default function AccountInactivePage() {
  return <main className="grid min-h-[75vh] place-items-center px-5 pt-24 text-center text-white"><section className="max-w-md rounded-2xl border border-white/10 bg-[#111] p-8"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-500/15 text-orange-400"><PauseCircle size={30} /></span><h1 className="mt-6 text-2xl font-black">アカウントは利用停止中です</h1><p className="mt-3 text-sm leading-7 text-white/55">休会または退会の処理が行われています。再開やデータについてはSHONAI VAULTEXのコーチへお問い合わせください。</p><div className="mt-6 flex justify-center"><LogoutButton /></div></section></main>;
}
