export const programClasses = ["ジュニア", "ユース", "エリート", "マスターズ"] as const;
export type ProgramClass = (typeof programClasses)[number];
