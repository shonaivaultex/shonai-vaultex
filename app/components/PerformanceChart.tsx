"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";


type RecordData = {
  date: string;
  value: number;
};


export default function PerformanceChart({
  records,
  unit,
}: {
  records: RecordData[];
  unit?: string;
}) {

  const data = [...records]
    .reverse()
    .map((record) => ({
      date: record.date,
      value: record.value,
    }));

  const values = data.map((record) => record.value).filter(Number.isFinite);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum;
  const center = (minimum + maximum) / 2;
  const padding = range > 0
    ? Math.max(range * 0.25, Math.abs(center) * 0.005)
    : Math.max(Math.abs(center) * 0.1, 0.1);
  const yDomain: [number, number] = values.length === 0
    ? [0, 1]
    : [Math.max(0, minimum - padding), maximum + padding];


  return (
    <div
      style={{
        width: "100%",
        height: 200,
        background: "#111",
        borderRadius: 20,
        padding: 20,
      }}
    >

      <ResponsiveContainer width="100%" height="100%">

        <LineChart data={data}>

          <CartesianGrid
            stroke="rgba(255,255,255,0.1)"
          />

          <XAxis
            dataKey="date"
            stroke="white"
          />

          <YAxis
            stroke="white"
            domain={yDomain}
            allowDataOverflow
            tickFormatter={(value: number) => value.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}
            width={48}
          />

          <Tooltip
            cursor={{ stroke: "rgba(255,122,0,0.35)", strokeDasharray: "4 4" }}
            contentStyle={{
              border: "1px solid rgba(255,122,0,0.75)",
              borderRadius: 10,
              background: "rgba(9,10,12,0.92)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
              padding: "8px 11px",
            }}
            labelStyle={{ color: "rgba(255,255,255,0.55)", fontSize: 11, marginBottom: 3 }}
            itemStyle={{ color: "#ff7a00", fontSize: 13, fontWeight: 700, padding: 0 }}
            labelFormatter={(label) => `日付：${label}`}
            formatter={(value) => [`${value}${unit ?? ""}`, "記録"]}
          />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#ff7a00"
            strokeWidth={3}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>
  );
}
