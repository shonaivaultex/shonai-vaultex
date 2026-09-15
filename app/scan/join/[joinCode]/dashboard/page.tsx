import Dashboard from "./Dashboard";
export default async function Page({ params }: { params: Promise<{ joinCode: string }> }) {
  const { joinCode } = await params;
  return <Dashboard joinCode={joinCode} />;
}
