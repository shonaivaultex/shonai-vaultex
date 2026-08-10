"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Menu, UserRound, X } from "lucide-react";
import { primaryNavigation } from "./site";
import { createClient } from "@/lib/supabase-browser";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const updateHeader = () => setIsScrolled(window.scrollY > 24);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(Boolean(data.user));
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session?.user));
    });

    return () => data.subscription.unsubscribe();
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
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        isScrolled || isMenuOpen
         ? "border-b border-white/10 bg-[#090a0c]/80 backdrop-blur-xl"
          : "bg-gradient-to-b from-black/55 to-transparent"
      }`}
    >
      <div
  className={`mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10 transition-all duration-500 ${
    isScrolled ? "h-16" : "h-20"
  }`}
>
        <Brand onClick={closeMenu} 
        isScrolled={isScrolled}/>

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
          href={isLoggedIn ? "/mypage" : "/login"}
          className="hidden items-center gap-2 rounded-md bg-orange-500 px-5 py-3 text-xs font-black tracking-[0.12em] shadow-lg shadow-orange-500/30 transition-all duration-300 hover:scale-105 hover:bg-orange-400 sm:inline-flex"
        >
          {isLoggedIn ? (
            <><UserRound aria-hidden="true" size={15} /> MY PAGE</>
          ) : (
            <>MEMBER LOGIN <ArrowRight aria-hidden="true" size={15} /></>
          )}
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
              href={isLoggedIn ? "/mypage" : "/login"}
              onClick={closeMenu}
              className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-4 text-xs font-black tracking-[0.14em] shadow-lg shadow-orange-500/30 transition-all duration-300 hover:scale-[1.02]"
            >
              {isLoggedIn ? (
                <><UserRound aria-hidden="true" size={16} /> MY PAGE</>
              ) : (
                <>MEMBER LOGIN <ArrowRight aria-hidden="true" size={16} /></>
              )}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function Brand({
  onClick,
  isScrolled,
}: {
  onClick: () => void;
  isScrolled: boolean;
}) {
  return (
   <Link
  href="/"
  onClick={onClick}
  className={`flex items-center py-2 transition-all duration-500 ${
  isScrolled ? "gap-1" : "gap-2"
}`}
>

  <Image
  src="/logo.png"
  alt="SHONAI VAULTEX"
  width={isScrolled ? 62 : 82}
  height={isScrolled ? 62 : 82}
  className="transition-all duration-500 ease-out"
/>

  <div
  className={`transition-all duration-500 ${
    isScrolled ? "scale-90" : "scale-100"
  }`}
>
  <p
  className={`font-black tracking-[0.25em] transition-all duration-500 ${
    isScrolled ? "text-2xl" : "text-3xl"
  }`}
>
    SHONAI
  </p>

  <p className={`text-xl font-black tracking-[0.3em] transition-all duration-500 ${
    isScrolled ? "text-orange-500" : "text-orange-400"
  }`}>
    VAULTEX
  </p>
</div>

</Link>
  );
}
