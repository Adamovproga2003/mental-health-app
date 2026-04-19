"use client";
import { useEffect, useState } from "react";
import { moodApi, journalApi } from "@/lib/api";
import type { MoodLog, JournalEntry } from "@/types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import MoodHeatmap from "@/components/MoodHeatmap";
import { useDark } from "@/hooks/useDark";

function exportCSV(logs: MoodLog[]) {
  const header = ["Дата", "Оцінка", "Emoji", "Настрій", "Нотатка", "Теги"];
  const rows = logs.map((l) => [
    new Date(l.created_at).toLocaleString("uk-UA"),
    l.score,
    l.emoji,
    l.label,
    `"${(l.note ?? "").replace(/"/g, '""')}"`,
    `"${(l.tags ?? []).join(", ")}"`,
  ]);
  const csv = [header, ...rows].map((r) => r.join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mindcare_mood_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const DAY_UA = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const EMOTION_UA: Record<string, string> = {
  Happy: "Радість", Sad: "Смуток", Angry: "Злість", Fear: "Тривога", Surprise: "Здивування",
};

export default function AnalyticsPage() {
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const dark = useDark();

  const tooltipStyle = dark
    ? { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "10px", color: "#f1f5f9" }
    : { backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", color: "#0f172a" };

  const axisStyle = { fontSize: 12, fill: dark ? "#94a3b8" : "#64748b" };
  const gridColor = dark ? "#334155" : "#f1f5f9";

  useEffect(() => {
    moodApi.list(60).then((r) => setLogs(r.data));
    journalApi.list(30).then((r) => setEntries(r.data));
  }, []);

  // Weekly bar chart
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayLogs = logs.filter((l) => new Date(l.created_at).toDateString() === d.toDateString());
    const avg = dayLogs.length ? dayLogs.reduce((s, l) => s + l.score, 0) / dayLogs.length : null;
    return {
      day: d.toLocaleDateString("uk-UA", { weekday: "short" }),
      score: avg ? parseFloat(avg.toFixed(1)) : 0,
    };
  });

  // Emotion radar
  const aggregatedEmotions: Record<string, number> = {};
  [...logs, ...entries].forEach((item) => {
    if (item.emotions) {
      Object.entries(item.emotions).forEach(([k, v]) => {
        aggregatedEmotions[k] = (aggregatedEmotions[k] || 0) + (v as number);
      });
    }
  });
  const total = Object.values(aggregatedEmotions).reduce((s, v) => s + v, 0) || 1;
  const radarData = Object.entries(aggregatedEmotions).map(([k, v]) => ({
    emotion: EMOTION_UA[k] ?? k,
    value: parseFloat(((v / total) * 100).toFixed(1)),
  }));

  // Tag analytics — avg score per tag
  const tagMap: Record<string, { sum: number; count: number }> = {};
  logs.forEach((l) => {
    (l.tags ?? []).forEach((t) => {
      if (!tagMap[t]) tagMap[t] = { sum: 0, count: 0 };
      tagMap[t].sum += l.score;
      tagMap[t].count += 1;
    });
  });
  const tagData = Object.entries(tagMap)
    .map(([tag, { sum, count }]) => ({ tag, avg: parseFloat((sum / count).toFixed(1)), count }))
    .sort((a, b) => b.avg - a.avg);

  // Sentiment trend from journal entries
  const sentimentData = [...entries]
    .filter((e) => e.sentiment_score !== null)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((e) => ({
      date: new Date(e.created_at).toLocaleDateString("uk-UA", { day: "2-digit", month: "short" }),
      sentiment: parseFloat((e.sentiment_score ?? 0).toFixed(2)),
    }));

  // Insight cards
  const dayScores: Record<number, number[]> = {};
  logs.forEach((l) => {
    const day = new Date(l.created_at).getDay();
    if (!dayScores[day]) dayScores[day] = [];
    dayScores[day].push(l.score);
  });
  const dayAvgs = Object.entries(dayScores).map(([d, scores]) => ({
    day: parseInt(d),
    avg: scores.reduce((s, v) => s + v, 0) / scores.length,
  }));
  const bestDay = dayAvgs.sort((a, b) => b.avg - a.avg)[0];
  const worstDay = [...dayAvgs].sort((a, b) => a.avg - b.avg)[0];

  const morningLogs = logs.filter((l) => new Date(l.created_at).getHours() < 12);
  const eveningLogs = logs.filter((l) => new Date(l.created_at).getHours() >= 17);
  const morningAvg = morningLogs.length ? morningLogs.reduce((s, l) => s + l.score, 0) / morningLogs.length : null;
  const eveningAvg = eveningLogs.length ? eveningLogs.reduce((s, l) => s + l.score, 0) / eveningLogs.length : null;

  const insights: { icon: string; text: string }[] = [];
  if (bestDay) insights.push({ icon: "🌟", text: `Найкращий день тижня: ${DAY_UA[bestDay.day]} (${bestDay.avg.toFixed(1)}/10)` });
  if (worstDay && worstDay.day !== bestDay?.day) insights.push({ icon: "💙", text: `Складніший день: ${DAY_UA[worstDay.day]} (${worstDay.avg.toFixed(1)}/10)` });
  if (morningAvg && eveningAvg) {
    if (morningAvg > eveningAvg + 0.5) insights.push({ icon: "🌅", text: `Ранки у вас бадьоріші (${morningAvg.toFixed(1)} vs ${eveningAvg.toFixed(1)})` });
    else if (eveningAvg > morningAvg + 0.5) insights.push({ icon: "🌙", text: `Вечори у вас кращі (${eveningAvg.toFixed(1)} vs ${morningAvg.toFixed(1)})` });
  }
  if (logs.length >= 7) {
    const recent7 = logs.slice(0, 7).reduce((s, l) => s + l.score, 0) / 7;
    const prev7 = logs.slice(7, 14).reduce((s, l) => s + l.score, 0) / Math.max(logs.slice(7, 14).length, 1);
    if (logs.slice(7, 14).length >= 3) {
      if (recent7 > prev7 + 0.5) insights.push({ icon: "📈", text: `Настрій покращується (+${(recent7 - prev7).toFixed(1)} за тиждень)` });
      else if (prev7 > recent7 + 0.5) insights.push({ icon: "📉", text: `Настрій знизився (−${(prev7 - recent7).toFixed(1)} за тиждень)` });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Аналітика</h1>
        {logs.length > 0 && (
          <button
            onClick={() => exportCSV(logs)}
            className="text-sm px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-calm-400 hover:text-calm-600 transition"
          >
            ↓ Експорт CSV
          </button>
        )}
      </div>

      {/* Insight cards */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {insights.map((ins, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl px-4 py-3 shadow-sm flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
              <span className="text-2xl">{ins.icon}</span>
              <p className="text-sm text-slate-700 dark:text-slate-300">{ins.text}</p>
            </div>
          ))}
        </div>
      )}

      <MoodHeatmap logs={logs} />

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Настрій за тиждень</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="day" tick={axisStyle} />
            <YAxis domain={[0, 10]} tick={axisStyle} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}/10`, "Настрій"]} />
            <Bar dataKey="score" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tag analytics */}
      {tagData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Настрій за тригером</h2>
          <ResponsiveContainer width="100%" height={Math.max(160, tagData.length * 44)}>
            <BarChart data={tagData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis type="number" domain={[0, 10]} tick={axisStyle} />
              <YAxis type="category" dataKey="tag" tick={axisStyle} width={80} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, _, p) => [`${v}/10 (${p.payload.count} зап.)`, "Середній настрій"]}
              />
              <Bar dataKey="avg" fill="#06b6d4" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sentiment trend */}
      {sentimentData.length > 1 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Сентимент щоденника</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={sentimentData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={axisStyle} />
              <YAxis domain={[-1, 1]} tick={axisStyle} tickFormatter={(v) => v > 0 ? `+${v}` : `${v}`} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [v > 0 ? `+${v}` : `${v}`, "Сентимент"]}
              />
              <Line type="monotone" dataKey="sentiment" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: "#10b981" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {radarData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Профіль емоцій</h2>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={gridColor} />
              <PolarAngleAxis dataKey="emotion" tick={axisStyle} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "Частка"]} />
              <Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
