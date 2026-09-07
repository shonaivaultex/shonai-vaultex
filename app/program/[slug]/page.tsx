import { notFound } from "next/navigation";
import { ProgramDetailPage } from "./ProgramDetailPage";
import { programBySlug, type Program } from "../../components/program-data";
import type { Metadata } from "next";
import { createAdminClient, hasAdminKey } from "@/lib/supabase-admin";

export const revalidate = 300;

type Props = {
  params: Promise<{
    slug: "junior" | "youth" | "elite" | "masters";
  }>;
};

const classBySlug = {
  junior: "ジュニア",
  youth: "ユース",
  elite: "エリート",
  masters: "マスターズ",
} as const;

async function getUpcomingSchedules(slug: Program["slug"]) {
  if (!hasAdminKey()) return [];
  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 3);
  const { data } = await createAdminClient()
    .from("schedules")
    .select("id,title,location,starts_at,ends_at,all_day,schedule_type,audience,program_class,is_personal_slot")
    .gte("starts_at", now.toISOString())
    .lt("starts_at", end.toISOString())
    .order("starts_at")
    .limit(100);
  const programClass = classBySlug[slug];
  return (data ?? [])
    .filter((item) => !item.is_personal_slot && item.schedule_type !== "competition" && (item.audience === "all" || item.program_class === programClass))
    .slice(0, 4);
}

export default async function Page({ params }: Props) {
  const { slug } = await params;

  const program = programBySlug[slug];

  if (!program) {
    notFound();
  }

  const schedules = await getUpcomingSchedules(slug);
  return <ProgramDetailPage program={program} schedules={schedules} />;
}

export async function generateStaticParams() {
  return [
    { slug: "junior" },
    { slug: "youth" },
    { slug: "elite" },
    { slug: "masters" },
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const program = programBySlug[slug];

  return {
    title: program ? `${program.name} PROGRAM` : "Program",
    description: program?.description,
  };
}
