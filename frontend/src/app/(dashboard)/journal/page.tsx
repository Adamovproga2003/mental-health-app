"use client";
import { useEffect, useState } from "react";
import { journalApi } from "@/lib/api";
import type { JournalEntry } from "@/types";

const PROMPTS = {
  Ранок: [
    "Який у мене настрій сьогодні вранці і чому?",
    "Що я хочу досягти сьогодні?",
    "За що я вдячний/вдячна прямо зараз?",
  ],
  Вечір: ["Що сьогодні пройшло добре?", "Що мене сьогодні засмутило або напружило?", "Що я зроблю інакше завтра?"],
  Подяка: [
    "Три речі, за які я вдячний/вдячна сьогодні:",
    "Хто сьогодні зробив мій день кращим і як?",
    "Яка маленька радість трапилась сьогодні?",
  ],
};

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<JournalEntry | null>(null);
  const [activeTab, setActiveTab] = useState<keyof typeof PROMPTS>("Ранок");

  async function load() {
    const { data } = await journalApi.list();
    setEntries(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await journalApi.create(title, content);
      setEntries((p) => [data, ...p]);
      setTitle("");
      setContent("");
      setSelected(data);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: number) {
    await journalApi.delete(id);
    setEntries((p) => p.filter((e) => e.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  const EMOTION_UA: Record<string, string> = {
    Happy: "Радість",
    Sad: "Смуток",
    Angry: "Злість",
    Fear: "Тривога",
    Surprise: "Здивування",
  };

  const sentimentColor = (s: number | null) => {
    if (!s) return "text-slate-400";
    if (s > 0.2) return "text-green-600";
    if (s < -0.2) return "text-red-500";
    return "text-yellow-500";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Щоденник</h1>
        <form onSubmit={submit} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Заголовок"
            required
            className="w-full border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-calm-500 placeholder:text-slate-400"
          />

          {/* Guided prompts */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1.5">Підказки для запису</p>
            <div className="flex gap-1 mb-2">
              {(Object.keys(PROMPTS) as (keyof typeof PROMPTS)[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    activeTab === tab
                      ? "bg-calm-500 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="space-y-1">
              {PROMPTS[activeTab].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setContent((c) => (c ? `${c}\n\n${prompt}\n` : `${prompt}\n`))}
                  className="w-full text-left text-xs text-slate-500 dark:text-slate-400 hover:text-calm-600 hover:bg-calm-50 dark:hover:bg-calm-900/20 px-2 py-1.5 rounded-lg transition"
                >
                  + {prompt}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Що у вас на думці?"
            required
            rows={5}
            className="w-full border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-calm-500 resize-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-calm-500 text-white py-2 rounded-xl text-sm font-semibold hover:bg-calm-600 transition disabled:opacity-40"
          >
            {loading ? "Зберігаю..." : "Зберегти запис"}
          </button>
        </form>

        <div className="space-y-2">
          {entries.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center shadow-sm space-y-2">
              <span className="text-4xl">📝</span>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Щоденник порожній</p>
              <p className="text-xs text-slate-400">Напишіть свій перший запис вище.</p>
            </div>
          ) : (
            entries.map((e, i) => (
              <button
                key={e.id}
                onClick={() => setSelected(e)}
                style={{ animationDelay: `${i * 50}ms` }}
                className={`w-full text-left bg-white dark:bg-slate-800 rounded-xl px-4 py-3 shadow-sm transition hover:ring-2 hover:ring-calm-300 animate-fade-in-up ${
                  selected?.id === e.id ? "ring-2 ring-calm-500" : ""
                }`}
              >
                <div className="font-medium text-slate-800 dark:text-slate-100 line-clamp-1">{e.title}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {new Date(e.created_at).toLocaleDateString("uk-UA")}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="md:col-span-2">
        {selected ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in-up">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{selected.title}</h2>
              <button
                onClick={() => remove(selected.id)}
                className="text-red-400 hover:text-red-600 text-sm transition"
              >
                Видалити
              </button>
            </div>
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{selected.content}</p>
            {selected.ai_reflection && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <p className="text-sm font-medium text-calm-700 dark:text-calm-300">AI-рефлексія</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selected.ai_reflection}</p>
              </div>
            )}
            {selected.emotions && Object.keys(selected.emotions).length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Емоції у тексті</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selected.emotions)
                    .filter(([, v]) => v > 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([k, v]) => (
                      <span
                        key={k}
                        className="text-xs bg-white dark:bg-slate-600 border dark:border-slate-500 text-slate-700 dark:text-slate-200 rounded-full px-3 py-1"
                      >
                        {EMOTION_UA[k] ?? k}: {(v * 100).toFixed(0)}%
                      </span>
                    ))}
                </div>
              </div>
            )}
            {selected.sentiment_score !== null && (
              <p className={`text-sm font-medium ${sentimentColor(selected.sentiment_score)}`}>
                Сентимент: {selected.sentiment_score > 0 ? "+" : ""}
                {selected.sentiment_score}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
            <span className="text-5xl">✍️</span>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Оберіть запис зі списку або створіть новий</p>
          </div>
        )}
      </div>
    </div>
  );
}
