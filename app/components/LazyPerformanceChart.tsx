"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const PerformanceChart = dynamic(() => import("@/app/components/PerformanceChart"), {
  loading: () => <ChartPlaceholder />,
  ssr: false,
});

type Props = {
  records: Array<{ date: string; value: number }>;
  unit?: string;
};

export default function LazyPerformanceChart(props: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: "240px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={containerRef}>{visible ? <PerformanceChart {...props} /> : <ChartPlaceholder />}</div>;
}

function ChartPlaceholder() {
  return <div className="h-[200px] w-full animate-pulse rounded-[20px] bg-white/[0.035]" aria-label="グラフを読み込み中" />;
}
