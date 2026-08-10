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
}: {
  records: RecordData[];
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

          <Tooltip />

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
