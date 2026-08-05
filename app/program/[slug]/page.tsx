import { notFound } from "next/navigation";
import { ProgramDetailPage } from "./ProgramDetailPage";
import { programBySlug } from "../../components/program-data";
import type { Metadata } from "next";

type Props = {
  params: Promise<{
    slug: "junior" | "youth" | "elite" | "masters";
  }>;
};

export default async function Page({ params }: Props) {
  const { slug } = await params;

  const program = programBySlug[slug];

  if (!program) {
    notFound();
  }

  return <ProgramDetailPage program={program} />;
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
