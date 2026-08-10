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