type StatProps = {
  value: string;
  label: string;
};

export function Stat({ value, label }: StatProps) {
  return (
    <div className="border-r border-white/10 px-3 first:pl-0 last:border-r-0">
      <p className="text-2xl font-black sm:text-3xl">{value}</p>
      <p className="mt-1 text-[10px] font-bold tracking-[0.13em] text-white/45">
        {label}
      </p>
    </div>
  );
}
