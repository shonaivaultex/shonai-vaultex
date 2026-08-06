import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { siteNavigation } from "./site";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#090a0c] py-12 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end lg:px-10">
        <div>
          <Link href="/" className="inline-block leading-none">
            <span className="block text-lg font-black tracking-[0.16em]">SHONAI</span>
            <span className="block text-sm font-black tracking-[0.28em] text-orange-500">VAULTEX</span>
          </Link>
          <p className="mt-4 text-xs leading-6 text-white/45">ATHLETICS CLUB / SHONAI, YAMAGATA</p>
          <p className="mt-4 max-w-xs text-sm leading-7 text-white/55">
  庄内から、全国へ。
  <br />
  挑戦する人を増やす総合陸上クラブ。
</p>
        </div>

        <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-10 gap-y-4 sm:grid-cols-3">
          {siteNavigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-xs font-bold tracking-[0.1em] text-white/65 transition-colors hover:text-orange-500"
            >
              {item.label}
            </Link>
          ))}
          <a
            href="mailto:info@shonai-vaultex.jp"
            className="flex items-center gap-1 text-xs font-bold tracking-[0.1em] text-white/65 transition-colors hover:text-orange-500"
          >
            EMAIL <ArrowUpRight aria-hidden="true" size={14} />
          </a>
          <a
  href="https://www.instagram.com/"
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center gap-1 text-xs font-bold tracking-[0.1em] text-white/65 transition-colors hover:text-orange-500"
>
  INSTAGRAM <ArrowUpRight size={14} />
</a>
        </nav>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 px-5 pt-5 text-[10px] font-medium tracking-[0.12em] text-white/35 sm:px-8 lg:px-10">
       © {new Date().getFullYear()} SHONAI VAULTEX.
All Rights Reserved.
      </div>
    </footer>
  );
}
