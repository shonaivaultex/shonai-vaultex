"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center gap-2 border border-white/15 px-4 py-3 text-xs font-black tracking-[0.12em] text-white/60 transition hover:border-orange-500 hover:text-orange-400 disabled:cursor-wait disabled:opacity-50"
    >
      <LogOut aria-hidden="true" size={16} />
      {loading ? "LOGGING OUT..." : "LOGOUT"}
    </button>
  );
}
