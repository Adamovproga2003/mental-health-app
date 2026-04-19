"use client";
import { useState } from "react";
import { moodApi } from "@/lib/api";
import type { MoodLog } from "@/types";

const MOODS = [
  { score: 1, emoji: "😢", label: "Дуже погано" },
  { score: 3, emoji: "😕", label: "Погано" },
  { score: 5, emoji: "😐", label: "Нейтрально" },
  { score: 7, emoji: "🙂", label: "Добре" },
  { score: 9, emoji: "😁", label: "Чудово" },
];

const TRIGGERS = [
  { label: "Робота", icon: "💼" },
  { label: "Дім", icon: "🏠" },
  { label: "Люди", icon: "👥" },
  { label: "Спорт", icon: "🏃" },
  { label: "Сон", icon: "😴" },
  { label: "Здоров'я", icon: "💊" },
  { label: "Навчання", icon: "📚" },
  { label: "Відпочинок", icon: "🌿" },
];

interface Props {
  onLogged: (log: MoodLog) => void;
}

export default function MoodPicker({ onLogged }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [tips, setTips] = useState<string[]>([]);

  function toggleTag(label: string) {
    setTags((prev) =>
      prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]
    );
  }

  async function submit() {
    if (!selected) return;
    setLoading(true);
    try {
      const { data } = await moodApi.log(selected, note, tags);
      setTips(data.tips || []);
      onLogged(data);
      setNote("");
      setSelected(null);
      setTags([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
      <h2 className="font-semibold text-lg text-slate-800 dark:text-white">Як ви себе почуваєте?</h2>

      <div className="flex gap-3 justify-between">
        {MOODS.map((m) => (
          <button
            key={m.score}
            onClick={() => setSelected(m.score)}
            className={`flex flex-col items-center p-3 rounded-xl transition ${
              selected === m.score
                ? "bg-calm-100 dark:bg-calm-900/30 ring-2 ring-calm-500"
                : "hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <span className="text-3xl">{m.emoji}</span>
            <span className="text-xs text-slate-500 mt-1">{m.label}</span>
          </button>
        ))}
      </div>

      <div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Що вплинуло на ваш настрій?</p>
        <div className="flex flex-wrap gap-2">
          {TRIGGERS.map((t) => (
            <button
              key={t.label}
              onClick={() => toggleTag(t.label)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition ${
                tags.includes(t.label)
                  ? "bg-calm-500 border-calm-500 text-white font-medium"
                  : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-calm-400 dark:hover:border-calm-400"
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Поділіться думками (необов'язково)..."
        rows={2}
        className="w-full border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-calm-500 resize-none placeholder:text-slate-400"
      />

      <button
        onClick={submit}
        disabled={!selected || loading}
        className="w-full bg-calm-500 text-white py-3 rounded-xl font-semibold hover:bg-calm-600 transition disabled:opacity-40"
      >
        {loading ? "Зберігаю..." : "Зафіксувати настрій"}
      </button>

      {tips.length > 0 && (
        <div className="bg-calm-50 dark:bg-calm-900/20 rounded-xl p-4 space-y-1">
          <p className="text-sm font-medium text-calm-700 dark:text-calm-300">Поради для вас:</p>
          {tips.map((t, i) => (
            <p key={i} className="text-sm text-slate-600">• {t}</p>
          ))}
        </div>
      )}
    </div>
  );
}
