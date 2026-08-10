"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function EditPage() {

  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState("");
  const [event, setEvent] = useState("");
  const [best, setBest] = useState("");

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {

    const {
      data:{
        user
      }
    } = await supabase.auth.getUser();


    const { data } = await supabase
      .from("players")
      .select("*")
      .eq("user_id", user?.id)
      .single();


    if(data){
      setName(data.name);
      setEvent(data.event);
      setBest(data.personal_best);
    }
  }


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
    personal_best:best
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