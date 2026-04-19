"use client";
import { useEffect, useState } from "react";
import { moodApi } from "@/lib/api";
import type { MoodLog, MoodStats } from "@/types";
import MoodPicker from "@/components/MoodPicker";
import EmotionChart from "@/components/EmotionChart";

function TrendArrow({ thisWeek, lastWeek }: { thisWeek: number | null; lastWeek: number | null }) {
  if (!thisWeek || !lastWeek) return null;
  const diff = thisWeek - lastWeek;
  if (Math.abs(diff) < 0.1) return null;
  const up = diff > 0;
  return (
    <span
      className={`text-sm font-semibold ${up ? "text-green-500" : "text-red-400"}`}
      title={`Минулого тижня: ${lastWeek.toFixed(1)}`}
    >
      {up ? "↑" : "↓"} {Math.abs(diff).toFixed(1)}
    </span>
  );
}

export default function DashboardPage() {
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [stats, setStats] = useState<MoodStats | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [logsRes, statsRes] = await Promise.all([moodApi.list(14), moodApi.stats()]);
    setLogs(logsRes.data);
    setStats(statsRes.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Мій настрій</h1>
        {stats && stats.total_logs > 0 && (
          <div className="flex gap-3 text-center">
            <div className="bg-white dark:bg-slate-800 rounded-xl px-4 py-2 shadow-sm">
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-2xl font-bold text-calm-600">{stats.avg_score.toFixed(1)}</span>
                <TrendArrow thisWeek={stats.avg_this_week} lastWeek={stats.avg_last_week} />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Середній бал</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl px-4 py-2 shadow-sm">
              <div className="text-2xl font-bold text-calm-600">{stats.total_logs}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Записів</div>
            </div>
            {stats.streak > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl px-4 py-2 shadow-sm">
                <div className="text-2xl font-bold text-orange-500">🔥 {stats.streak}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Днів поспіль</div>
              </div>
            )}
          </div>
        )}
      </div>

      <MoodPicker
        onLogged={(log) => {
          setLogs((p) => [log, ...p]);
          load();
        }}
      />
      <EmotionChart logs={logs} />

      <div className="space-y-2">
        <h2 className="font-semibold text-slate-800 dark:text-white">Останні записи</h2>

        {!loading && logs.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-10 shadow-sm flex flex-col items-center text-center gap-3">
            <span className="text-5xl">🌱</span>
            <p className="font-medium text-slate-700 dark:text-slate-300">Ще немає жодного запису</p>
            <p className="text-sm text-slate-400">Зафіксуйте свій перший настрій вище — це займе 10 секунд.</p>
          </div>
        ) : (
          logs.slice(0, 5).map((l, i) => (
            <div
              key={l.id}
              style={{ animationDelay: `${i * 60}ms` }}
              className="bg-white dark:bg-slate-800 rounded-xl px-4 py-3 shadow-sm flex items-center gap-4 animate-fade-in-up"
            >
              <span className="text-2xl">{l.emoji}</span>
              <div className="flex-1">
                <div className="font-medium text-slate-800 dark:text-slate-100">
                  {l.label} — {l.score}/10
                </div>
                {l.tags && l.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {l.tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs bg-calm-50 dark:bg-calm-900/30 dark:text-slate-500 text-calm-700 dark:text-calm-300 border border-calm-200 dark:border-calm-700 rounded-full px-2 py-0.5"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {l.note && (
                  <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{l.note}</div>
                )}
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500">
                {new Date(l.created_at).toLocaleString("uk-UA", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
