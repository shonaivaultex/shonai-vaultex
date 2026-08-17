"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { programClasses } from "@/lib/program-classes";

export default function EditPage() {

  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState("");
  const [event, setEvent] = useState("");
  const [best, setBest] = useState("");
  const [programClass, setProgramClass] = useState("");
  const [gender, setGender] = useState("");
  const [rankingNamePublic, setRankingNamePublic] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from("players").select("*").eq("user_id", user?.id).single();
      if (!active || !data) return;
      setName(data.name);
      setEvent(data.event);
      setBest(data.personal_best);
      setProgramClass(data.program_class ?? "");
      setGender(data.gender ?? "");
      setRankingNamePublic(data.ranking_name_public ?? false);
    }
    void loadProfile();
    return () => { active = false; };
  }, [supabase]);


  async function saveProfile(){

    const {
      data:{
        user
      }
    } = await supabase.auth.getUser();


   const { error } = await supabase
  .from("players")
  .update({
    name:name,
    event:event,
    personal_best:best,
    program_class:programClass || null,
    gender: gender || null,
    ranking_name_public: rankingNamePublic
  })
  .eq("user_id", user?.id);

if(error){
  alert(error.message);
  return;
}


    router.push("/mypage");
  }


  return (
  <main
    style={{
      maxWidth: 700,
      margin: "80px auto",
      padding: 20,
      color: "white",
    }}
  >
    <h1
      style={{
        fontSize: 42,
        marginBottom: 40,
      }}
    >
      記録編集
    </h1>

    <div
      style={{
        background: "#111",
        border: "1px solid rgba(255,255,255,.1)",
        borderRadius: 20,
        padding: 30,
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <label>
        <p>種目</p>

        <input
          value={event}
          onChange={(e) => setEvent(e.target.value)}
          style={{
            width: "100%",
            padding: 15,
            borderRadius: 12,
            background: "#1a1a1a",
            color: "white",
            border: "1px solid #333",
          }}
        />
      </label>

      <label style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 15, border: "1px solid #333", borderRadius: 12 }}>
        <input type="checkbox" checked={rankingNamePublic} onChange={(e) => setRankingNamePublic(e.target.checked)} style={{ marginTop: 4 }} />
        <span><strong>ランキングに名前を公開する</strong><small style={{ display: "block", marginTop: 6, color: "#888" }}>OFFの場合はクラス名を使った匿名表示になります。</small></span>
      </label>

      <label>
        <p>ランキング区分</p>
        <select value={gender} onChange={(e) => setGender(e.target.value)} required style={{ width: "100%", padding: 15, borderRadius: 12, background: "#1a1a1a", color: "white", border: "1px solid #333" }}>
          <option value="">男子／女子を選択</option><option value="male">男子</option><option value="female">女子</option>
        </select>
      </label>

      <label>
        <p>VAULTEXクラス</p>
        <select value={programClass} onChange={(e) => setProgramClass(e.target.value)} style={{ width: "100%", padding: 15, borderRadius: 12, background: "#1a1a1a", color: "white", border: "1px solid #333" }}>
          <option value="">クラスを選択</option>
          {programClasses.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>

      <label>
        <p>自己ベスト</p>

        <input
          value={best}
          onChange={(e) => setBest(e.target.value)}
          style={{
            width: "100%",
            padding: 15,
            borderRadius: 12,
            background: "#1a1a1a",
            color: "white",
            border: "1px solid #333",
          }}
        />
      </label>

      <label>
        <p>名前</p>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: "100%",
            padding: 15,
            borderRadius: 12,
            background: "#1a1a1a",
            color: "white",
            border: "1px solid #333",
          }}
        />
      </label>

      <button
        onClick={saveProfile}
        style={{
          marginTop: 20,
          height: 55,
          borderRadius: 14,
          border: "none",
          background: "#ff7a00",
          color: "white",
          fontSize: 18,
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        保存する
      </button>
    </div>
  </main>
);
}
