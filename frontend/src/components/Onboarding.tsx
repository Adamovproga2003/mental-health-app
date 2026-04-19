"use client";
import { useState } from "react";

const STEPS = [
  {
    icon: "😊",
    title: "Відстежуйте настрій",
    desc: "Фіксуйте свій емоційний стан щодня. Обирайте настрій, позначайте тригери та додавайте нотатки.",
  },
  {
    icon: "📓",
    title: "Ведіть щоденник",
    desc: "Записуйте думки та отримуйте AI-аналіз емоцій вашого тексту. Використовуйте підказки для натхнення.",
  },
  {
    icon: "📊",
    title: "Аналізуйте себе",
    desc: "Переглядайте графіки настрою, емоційний профіль та місячну теплову карту вашого стану.",
  },
];

interface Props {
  onFinish: () => void;
}

export default function Onboarding({ onFinish }: Props) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4 text-center space-y-6 animate-slide-up">
        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-calm-500" : "w-2 bg-slate-200 dark:bg-slate-600"
              }`}
            />
          ))}
        </div>

        <div className="text-6xl">{current.icon}</div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{current.title}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{current.desc}</p>
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Назад
            </button>
          )}
          <button
            onClick={() => isLast ? onFinish() : setStep((s) => s + 1)}
            className="flex-1 py-3 rounded-xl bg-calm-500 text-white text-sm font-semibold hover:bg-calm-600 transition"
          >
            {isLast ? "Розпочати" : "Далі"}
          </button>
        </div>

        {!isLast && (
          <button onClick={onFinish} className="text-xs text-slate-400 hover:text-slate-600 transition">
            Пропустити
          </button>
        )}
      </div>
    </div>
  );
}
