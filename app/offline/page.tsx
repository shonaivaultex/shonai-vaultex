import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return <main className="grid min-h-[75vh] place-items-center px-5 pt-24 text-center text-white"><section className="max-w-sm"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-500/15 text-orange-400"><WifiOff size={30} /></span><h1 className="mt-6 text-2xl font-black">オフラインです</h1><p className="mt-3 text-sm leading-7 text-white/55">通信状態を確認して、もう一度お試しください。記録やフィードバックは接続後に最新状態で表示されます。</p><Link href="/mypage" className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-3 text-sm font-black">再読み込み</Link></section></main>;
}
