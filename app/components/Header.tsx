"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { primaryNavigation } from "./site";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updateHeader = () => setIsScrolled(window.scrollY > 24);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        isScrolled || isMenuOpen
          ? "border-b border-white/10 bg-[#090a0c]/95 backdrop-blur-md"
          : "bg-gradient-to-b from-black/55 to-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Brand onClick={closeMenu} />

        <nav aria-label="Main navigation" className="hidden items-center gap-6 lg:flex">
          {primaryNavigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-xs font-bold tracking-[0.14em] text-white/80 transition-colors hover:text-orange-400"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/#contact"
          className="hidden items-center gap-2 bg-orange-500 px-5 py-3 text-xs font-black tracking-[0.12em] transition-colors hover:bg-orange-400 sm:inline-flex"
        >
          JOIN US <ArrowRight aria-hidden="true" size={15} />
        </Link>

        <button
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsMenuOpen((open) => !open)}
          className="grid size-11 place-items-center border border-white/20 bg-black/20 transition-colors hover:border-orange-500 lg:hidden"
        >
          {isMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {isMenuOpen && (
        <div id="mobile-navigation" className="border-t border-white/10 bg-[#090a0c] lg:hidden">
          <nav aria-label="Mobile navigation" className="mx-auto max-w-7xl px-5 pb-8 pt-4 sm:px-8">
            {primaryNavigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeMenu}
                className="flex items-center justify-between border-b border-white/10 py-5 text-2xl font-black tracking-[-0.03em] transition-colors hover:text-orange-400"
              >
                {item.label}
                <ArrowRight aria-hidden="true" size={19} className="text-orange-500" />
              </Link>
            ))}
            <Link
              href="/#contact"
              onClick={closeMenu}
              className="mt-8 flex items-center justify-center gap-2 bg-orange-500 py-4 text-xs font-black tracking-[0.14em]"
            >
              JOIN US <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function Brand({ onClick }: { onClick: () => void }) {
  return (
    <Link href="/" onClick={onClick} className="leading-none" aria-label="SHONAI VAULTEX home">
      <span className="block text-lg font-black tracking-[0.16em] sm:text-xl">SHONAI</span>
      <span className="block text-sm font-black tracking-[0.28em] text-orange-500">VAULTEX</span>
    </Link>
  );
}
