"use client";
import type { MoodLog } from "@/types";

interface Props {
  logs: MoodLog[];
}

function scoreToColor(score: number | null): string {
  if (score === null) return "bg-purple-100 dark:bg-purple-900/30";
  if (score <= 2) return "bg-purple-200 dark:bg-purple-800";
  if (score <= 4) return "bg-purple-300 dark:bg-purple-700";
  if (score <= 6) return "bg-purple-400 dark:bg-purple-600";
  if (score <= 8) return "bg-purple-500 dark:bg-purple-500";
  return "bg-purple-700 dark:bg-purple-400";
}

function scoreToLabel(score: number | null): string {
  if (score === null) return "Немає даних";
  if (score <= 2) return "Дуже погано";
  if (score <= 4) return "Погано";
  if (score <= 6) return "Нейтрально";
  if (score <= 8) return "Добре";
  return "Чудово";
}

const LEGEND = [
  { color: "bg-purple-100 dark:bg-purple-900/30", label: "Немає" },
  { color: "bg-purple-200 dark:bg-purple-800", label: "1–2" },
  { color: "bg-purple-300 dark:bg-purple-700", label: "3–4" },
  { color: "bg-purple-400 dark:bg-purple-600", label: "5–6" },
  { color: "bg-purple-500 dark:bg-purple-500", label: "7–8" },
  { color: "bg-purple-700 dark:bg-purple-400", label: "9–10" },
];

export default function MoodHeatmap({ logs }: Props) {
  const scoreByDate: Record<string, number[]> = {};
  logs.forEach((l) => {
    const key = new Date(l.created_at).toLocaleDateString("sv-SE");
    if (!scoreByDate[key]) scoreByDate[key] = [];
    scoreByDate[key].push(l.score);
  });

  const avgByDate: Record<string, number> = {};
  Object.entries(scoreByDate).forEach(([d, scores]) => {
    avgByDate[d] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  });

  const today = new Date();
  const days: Date[] = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }

  const startPad = (days[0].getDay() + 6) % 7;
  const paddedDays: (Date | null)[] = [...Array(startPad).fill(null), ...days];
  const weekCount = Math.ceil(paddedDays.length / 7);

  const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
      <h2 className="font-semibold text-lg text-slate-800 dark:text-white mb-4">Настрій за місяць</h2>

      <div className="flex gap-2">
        {/* Day labels */}
        <div className="flex flex-col gap-1 shrink-0">
          {WEEK_DAYS.map((d) => (
            <span key={d} className="h-6 flex items-center text-xs text-slate-400 dark:text-slate-500">{d}</span>
          ))}
        </div>

        {/* Full-width grid */}
        <div className="flex flex-1 gap-1">
          {Array.from({ length: weekCount }).map((_, wi) => (
            <div key={wi} className="flex flex-col flex-1 gap-1">
              {paddedDays.slice(wi * 7, wi * 7 + 7).map((day, di) => {
                if (!day) return <div key={di} className="h-6 w-full" />;
                const key = day.toLocaleDateString("sv-SE");
                const score = avgByDate[key] ?? null;
                const isToday = key === today.toLocaleDateString("sv-SE");
                const dateLabel = day.toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
                const scoreLabel = score !== null ? `${scoreToLabel(score)} (${score}/10)` : "Немає даних";

                return (
                  <div key={key} className="relative group h-6 w-full">
                    {/* Tooltip — appears above the cell via CSS */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 hidden group-hover:block pointer-events-none">
                      <div className="bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                        <div className="font-medium">{dateLabel}</div>
                        <div className="text-slate-300">{scoreLabel}</div>
                      </div>
                      {/* Arrow */}
                      <div className="w-2 h-2 bg-slate-800 dark:bg-slate-700 rotate-45 mx-auto -mt-1" />
                    </div>

                    <div
                      className={`h-6 w-full rounded-md ${scoreToColor(score)} ${
                        isToday ? "ring-2 ring-calm-500" : ""
                      } hover:opacity-75 transition-opacity cursor-default`}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 flex-wrap">
        <span className="text-xs text-slate-400">Менше</span>
        {LEGEND.map(({ color, label }) => (
          <div key={label} className="flex flex-col items-center gap-0.5">
            <div className={`w-5 h-5 rounded ${color}`} />
            <span className="text-xs text-slate-400 dark:text-slate-500">{label}</span>
          </div>
        ))}
        <span className="text-xs text-slate-400">Більше</span>
      </div>
    </div>
  );
}
