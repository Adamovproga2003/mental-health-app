"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { MoodLog } from "@/types";
import { useDark } from "@/hooks/useDark";

interface Props {
  logs: MoodLog[];
}

export default function EmotionChart({ logs }: Props) {
  const dark = useDark();

  const tooltipStyle = dark
    ? { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "10px", color: "#f1f5f9" }
    : { backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", color: "#0f172a" };

  const axisStyle = { fontSize: 12, fill: dark ? "#94a3b8" : "#64748b" };
  const gridColor = dark ? "#334155" : "#f1f5f9";

  const data = [...logs]
    .reverse()
    .map((l) => ({
      date: new Date(l.created_at).toLocaleDateString("uk-UA", { day: "2-digit", month: "short" }),
      score: l.score,
      label: l.label,
      emoji: l.emoji,
    }));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
      <h2 className="font-semibold text-lg text-slate-800 dark:text-white mb-4">Динаміка настрою</h2>
      {data.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-8">Ще немає даних. Зафіксуйте перший настрій!</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="date" tick={axisStyle} />
            <YAxis domain={[1, 10]} tick={axisStyle} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, _, p) => [`${p.payload.emoji} ${v}/10`, "Настрій"]}
            />
            <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4, fill: "#8b5cf6" }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
