import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Menu, UserRound } from "lucide-react";
import { primaryNavigation } from "./site";

export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#090a0c]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Brand />

        <nav aria-label="Main navigation" className="hidden items-center gap-6 lg:flex">
          {primaryNavigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="relative text-xs font-bold tracking-[0.16em] text-white/80 transition-all duration-300 hover:text-orange-400 after:absolute after:left-0 after:-bottom-2 after:h-[2px] after:w-0 after:bg-orange-500 after:transition-all after:duration-300 hover:after:w-full"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/mypage"
          className="hidden items-center gap-2 rounded-md bg-orange-500 px-5 py-3 text-xs font-black tracking-[0.12em] shadow-lg shadow-orange-500/30 transition-all duration-300 hover:scale-105 hover:bg-orange-400 sm:inline-flex"
        >
          <UserRound aria-hidden="true" size={15} /> MY PAGE
        </Link>
        <details className="group relative lg:hidden">
          <summary aria-label="メニューを開く" className="grid size-11 cursor-pointer list-none place-items-center border border-white/20 bg-black/20 marker:hidden"><Menu size={21} /></summary>
          <div className="fixed inset-x-0 top-16 border-t border-white/10 bg-[#090a0c] shadow-2xl">
            <nav aria-label="Mobile navigation" className="mx-auto max-w-7xl px-5 pb-8 pt-4 sm:px-8">
              {primaryNavigation.map((item) => <Link key={item.label} href={item.href} className="flex items-center justify-between border-b border-white/10 py-4 text-xl font-black tracking-[-0.03em] hover:text-orange-400">{item.label}<ArrowRight aria-hidden="true" size={18} className="text-orange-500"/></Link>)}
              <Link href="/mypage" className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-4 text-xs font-black tracking-[0.14em]"><UserRound aria-hidden="true" size={16}/>MY PAGE</Link>
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}

function Brand() {
  return (
   <Link
  href="/"
  className="flex items-center gap-1 py-2"
>

  <Image
  src="/logo.png"
  alt="SHONAI VAULTEX"
  width={62}
  height={62}
/>

  <div
  className="scale-90"
>
  <p
  className="text-2xl font-black tracking-[0.25em]"
>
    SHONAI
  </p>

  <p className="text-xl font-black tracking-[0.3em] text-orange-500">
    VAULTEX
  </p>
</div>

</Link>
  );
}
