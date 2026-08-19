export type SchedulePeriod = {
  id: number;
  author_id: string;
  label: string | null;
  phase: string;
  starts_on: string;
  ends_on: string;
  audience: "all" | "class";
  program_class: string | null;
};
