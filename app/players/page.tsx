import { createClient } from "@/lib/supabase-server";
import Link from "next/link";


export default async function PlayersPage(){

  const supabase = await createClient();


  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("member_status", "active");


  return (
    <main
      style={{
        maxWidth:800,
        margin:"80px auto"
      }}
    >

      <h1>
        ATHLETES
      </h1>


      <div
        style={{
          display:"grid",
          gap:20,
          marginTop:30
        }}
      >

      {players?.map((player)=>(

<Link
  key={player.id}
  href={`/players/${player.id}`}
  style={{
    display:"block",
    padding:25,
    borderRadius:20,
    background:"#111",
    color:"white"
  }}
>

<h2>
  {player.name}
</h2>

<p>
  {player.grade}
</p>

<p>
  種目：{player.event}
</p>

<p>
  PB：{player.personal_best}
</p>


</Link>

))}

      


      </div>

    </main>
  );
}
