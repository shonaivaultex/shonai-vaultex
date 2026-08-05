type SectionLabelProps = {
  index?: string;
  children: React.ReactNode;
};

export function SectionLabel({ index, children }: SectionLabelProps) {
  return (
    <p className="flex items-center gap-3 text-xs font-black tracking-[0.22em] text-orange-500">
      {index && <span className="text-white/35">{index}</span>}
      <span className="h-px w-8 bg-orange-500" />
      {children}
    </p>
  );
}
