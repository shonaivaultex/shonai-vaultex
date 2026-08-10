import Link from "next/link";
import DeleteRecordButton from "@/app/components/DeleteRecordButton";
import PerformanceChart from "@/app/components/PerformanceChart";

type PerformanceRecord = {
  id: number;
  value: number | string;
  date: string;
};

type PerformanceEventCardProps = {
  category: string;
  unit: string;
  best: PerformanceRecord;
  records: PerformanceRecord[];
};

export default function PerformanceEventCard({
  category,
  unit,
  best,
  records,
}: PerformanceEventCardProps) {
  return (
    <article
      style={{
        marginBottom: 16,
        borderRadius: 20,
        background: "#111",
        border: "1px solid rgba(255, 122, 0, 0.75)",
        color: "white",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "22px 24px 18px" }}>
        <p style={{ margin: 0, fontSize: 14, opacity: 0.7 }}>{category}</p>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            marginTop: 8,
          }}
        >
          <span
            style={{
              color: "#ff7a00",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.12em",
            }}
          >
            PB
          </span>
          <strong style={{ fontSize: 36, lineHeight: 1 }}>
            {best.value}
            <span style={{ marginLeft: 6, fontSize: 17 }}>{unit}</span>
          </strong>
        </div>

        <div style={{ marginTop: 24 }}>
          <PerformanceChart
            records={records.map((record) => ({
              date: record.date,
              value: Number(record.value),
            }))}
          />
        </div>
      </div>

      <details style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <summary
          style={{
            padding: "15px 24px",
            color: "#ff7a00",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 700,
            userSelect: "none",
          }}
        >
          履歴を見る（{records.length}件）
        </summary>

        <div style={{ padding: "0 24px 8px" }}>
          {records.map((record) => (
            <div
              key={record.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                padding: "16px 0",
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <strong style={{ fontSize: 20 }}>
                  {record.value}
                  <span style={{ marginLeft: 4, fontSize: 13 }}>{unit}</span>
                </strong>
                <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.55 }}>
                  {record.date}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Link
                  href={`/edit/${record.id}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 36,
                    padding: "0 13px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "#1a1a1a",
                    color: "white",
                    textDecoration: "none",
                    fontSize: 14,
                  }}
                >
                  編集
                </Link>
                <DeleteRecordButton recordId={record.id} compact />
              </div>
            </div>
          ))}
        </div>
      </details>
    </article>
  );
}
