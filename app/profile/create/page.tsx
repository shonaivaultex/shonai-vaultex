"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { programClasses } from "@/lib/program-classes";

export default function CreateProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [eventName, setEventName] = useState("");
  const [school, setSchool] = useState("");
  const [programClass, setProgramClass] = useState("");
  const [gender, setGender] = useState("");
  const [rankingNamePublic, setRankingNamePublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function checkProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login?next=/profile/create");
        return;
      }

      const { data } = await supabase.from("players").select("user_id").eq("user_id", user.id).maybeSingle();
      if (data) {
        router.replace("/mypage");
        return;
      }

      const { data: acceptedFamilyInvitation } = await supabase.rpc("accept_pending_family_invitation");
      if (acceptedFamilyInvitation?.length) {
        router.replace("/family");
        return;
      }

      if (active) setChecking(false);
    }

    checkProfile();
    return () => { active = false; };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setLoading(true);

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      router.replace("/login?next=/profile/create");
      return;
    }

    const { error } = await supabase.from("players").insert({
      user_id: user.id,
      name: name.trim(),
      grade: grade.trim(),
      event: eventName.trim(),
      school: school.trim(),
      program_class: programClass,
      gender,
      ranking_name_public: rankingNamePublic,
    });

    setLoading(false);
    if (error) {
      setErrorMessage("プロフィールを保存できませんでした。入力内容を確認して、もう一度お試しください。");
      return;
    }

    router.replace("/mypage");
    router.refresh();
  }

  if (checking) {
    return <main className="grid min-h-[calc(100vh-5rem)] place-items-center px-5 pt-20 text-sm font-bold tracking-wide text-white/50">PROFILE CHECKING...</main>;
  }

  return (
    <main className="relative grid min-h-[calc(100vh-5rem)] place-items-center overflow-hidden px-5 pb-20 pt-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(249,115,22,0.16),transparent_32%)]" />
      <section className="relative w-full max-w-xl border border-white/10 bg-[#101216]/95 p-7 shadow-2xl shadow-black/40 sm:p-10">
        <p className="flex items-center gap-3 text-[11px] font-black tracking-[0.24em] text-orange-400"><span className="h-px w-8 bg-orange-500" /> ATHLETE PROFILE</p>
        <div className="mt-6 flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center bg-orange-500/15 text-orange-400"><UserRound aria-hidden="true" /></span>
          <div><h1 className="text-3xl font-black tracking-[-0.04em]">プロフィール作成</h1><p className="mt-2 text-sm leading-6 text-white/55">選手情報を入力するとマイページを利用できます。</p></div>
        </div>

        <form onSubmit={handleSubmit} className="mt-9 grid gap-5 sm:grid-cols-2">
          <ProfileField label="NAME / 名前" value={name} onChange={setName} placeholder="庄内 太郎" />
          <ProfileField label="GRADE / 学年" value={grade} onChange={setGrade} placeholder="中学2年" />
          <ProfileField label="EVENT / 専門種目" value={eventName} onChange={setEventName} placeholder="100m" />
          <ProfileField label="SCHOOL / 所属" value={school} onChange={setSchool} placeholder="〇〇中学校" />
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-[11px] font-black tracking-[0.14em] text-white/55">GENDER / ランキング区分</span>
            <select value={gender} onChange={(event) => setGender(event.target.value)} required className="w-full border border-white/15 bg-[#101216] px-4 py-4 text-sm text-white outline-none transition focus:border-orange-500">
              <option value="">男子／女子を選択</option><option value="male">男子</option><option value="female">女子</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-[11px] font-black tracking-[0.14em] text-white/55">VAULTEX CLASS / クラス</span>
            <select value={programClass} onChange={(event) => setProgramClass(event.target.value)} required className="w-full border border-white/15 bg-[#101216] px-4 py-4 text-sm text-white outline-none transition focus:border-orange-500">
              <option value="">クラスを選択</option>
              {programClasses.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="flex items-start gap-3 border border-white/10 bg-black/20 p-4 sm:col-span-2">
            <input type="checkbox" checked={rankingNamePublic} onChange={(event) => setRankingNamePublic(event.target.checked)} className="mt-1 accent-orange-500" />
            <span><strong className="block text-sm">ランキングに名前を公開する</strong><span className="mt-1 block text-xs leading-5 text-white/45">OFFの場合は「ユース会員」など匿名で表示されます。</span></span>
          </label>

          {errorMessage && <p role="alert" className="border-l-2 border-orange-500 bg-orange-500/10 px-4 py-3 text-sm text-orange-200 sm:col-span-2">{errorMessage}</p>}

          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 bg-orange-500 px-5 py-4 text-xs font-black tracking-[0.16em] text-white transition hover:bg-orange-400 disabled:cursor-wait disabled:opacity-60 sm:col-span-2">
            {loading ? "SAVING..." : "SAVE & OPEN MY PAGE"}
            {!loading && <ArrowRight aria-hidden="true" size={16} />}
          </button>
        </form>
      </section>
    </main>
  );
}

function ProfileField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black tracking-[0.14em] text-white/55">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required maxLength={100} className="w-full border border-white/15 bg-black/20 px-4 py-4 text-sm outline-none transition placeholder:text-white/25 focus:border-orange-500" />
    </label>
  );
}
