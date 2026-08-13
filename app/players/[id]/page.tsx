import { createClient } from "@/lib/supabase-server";


export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {

const { id } = await params;

  const supabase = await createClient();


  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .eq("member_status", "active")
    .single();



  if (!player) {
    return (
      <main>
        <h1>
          選手が見つかりません
        </h1>
      </main>
    );
  }



  return (
    <main
      style={{
        maxWidth:700,
        margin:"80px auto",
        color:"white"
      }}
    >

      <h1>
        {player.name}
      </h1>


      <div
        style={{
          marginTop:30,
          padding:30,
          background:"#111",
          borderRadius:20
        }}
      >

        <p>
          学年：{player.grade}
        </p>

        <p>
          種目：{player.event}
        </p>

        <p>
          所属：{player.school}
        </p>

        <p>
          自己ベスト：{player.personal_best}
        </p>


      </div>


    </main>
  );
}
