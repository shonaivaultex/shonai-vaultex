import { supabase } from "@/lib/supabase";

export default async function TestPage() {
  const { data, error } = await supabase
    .from("players")
    .select("*");

  return (
    <main style={{ paddingTop: 200, paddingLeft: 40, color: "white" }}>
      <h1>Supabase接続テスト</h1>

      <pre>ERROR: {JSON.stringify(error, null, 2)}</pre>

      <pre>DATA: {JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}