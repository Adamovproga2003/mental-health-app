"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const PATTERNS = {
  "4-7-8": {
    label: "4-7-8 Дихання",
    desc: "Знижує тривогу та допомагає заснути",
    phases: [
      { name: "Вдих",     duration: 4, targetScale: 1.5, animate: true  },
      { name: "Затримка", duration: 7, targetScale: 1.5, animate: false },
      { name: "Видих",    duration: 8, targetScale: 1.0, animate: true  },
    ],
  },
  box: {
    label: "Квадратне дихання",
    desc: "Покращує концентрацію та знімає стрес",
    phases: [
      { name: "Вдих",     duration: 4, targetScale: 1.5, animate: true  },
      { name: "Затримка", duration: 4, targetScale: 1.5, animate: false },
      { name: "Видих",    duration: 4, targetScale: 1.0, animate: true  },
      { name: "Пауза",    duration: 4, targetScale: 1.0, animate: false },
    ],
  },
};

export default function BreathingPage() {
  const [pattern, setPattern] = useState<keyof typeof PATTERNS>("4-7-8");
  const [running, setRunning] = useState(false);
  // phaseIdx and countdown are display-only — logic lives in the effect
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [cycles, setCycles] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const middleRef = useRef<HTMLDivElement>(null);

  const phases = PATTERNS[pattern].phases;
  const currentPhase = phases[phaseIdx];

  // ── Timer: single effect, phase cycling via local variable ──────────────
  // No phaseIdx in deps — phase logic is self-contained, state is display only
  useEffect(() => {
    if (!running) return;

    let idx = 0;
    let completedCycles = 0;

    function runPhase() {
      const currentPhases = PATTERNS[pattern].phases;
      const phase = currentPhases[idx];

      setPhaseIdx(idx);
      setCountdown(phase.duration);

      let remaining = phase.duration;
      timerRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          clearInterval(timerRef.current!);
          idx = (idx + 1) % currentPhases.length;
          if (idx === 0) {
            completedCycles += 1;
            setCycles(completedCycles);
          }
          runPhase();
        } else {
          setCountdown(remaining);
        }
      }, 1000);
    }

    runPhase();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, pattern]); // intentionally excludes phaseIdx

  // ── Circle animation: DOM-direct to guarantee CSS transition fires ───────
  useLayoutEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    function applyScale(scale: number, durationMs: number) {
      for (const el of [outerRef.current, middleRef.current]) {
        if (!el) continue;
        el.style.transitionProperty = "transform";
        el.style.transitionTimingFunction = "ease-in-out";
        el.style.transitionDuration = `${durationMs}ms`;
        el.style.transform = `scale(${scale})`;
      }
    }

    if (!running) {
      applyScale(1, 300);
      return;
    }

    const phase = PATTERNS[pattern].phases[phaseIdx];

    if (!phase.animate) {
      // Hold phase: snap to hold scale, no animation
      applyScale(phase.targetScale, 0);
      return;
    }

    // Animate phase: snap to start → flush layout → animate to target
    const fromScale = phase.targetScale === 1.5 ? 1.0 : 1.5;
    applyScale(fromScale, 0);
    void outer.getBoundingClientRect(); // forces browser to commit the snap
    applyScale(phase.targetScale, phase.duration * 1000);
  }, [running, phaseIdx, pattern]);

  function start() {
    setCycles(0);
    setPhaseIdx(0);
    setCountdown(0);
    setRunning(true);
  }

  function stop() {
    setRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setPhaseIdx(0);
    setCountdown(0);
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Дихальні вправи</h1>

      {/* Pattern selector */}
      <div className="flex gap-3">
        {(Object.keys(PATTERNS) as (keyof typeof PATTERNS)[]).map((key) => (
          <button
            key={key}
            onClick={() => { stop(); setPattern(key); }}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium border transition ${
              pattern === key
                ? "bg-calm-500 text-white border-calm-500"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-calm-400"
            }`}
          >
            <div>{PATTERNS[key].label}</div>
            <div className={`text-xs mt-0.5 ${pattern === key ? "text-calm-100" : "text-slate-400"}`}>
              {PATTERNS[key].desc}
            </div>
          </button>
        ))}
      </div>

      {/* Breathing circle */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center w-48 h-48">
          {/* Starts at 2/3 of container; at scale(1.5) fills exactly to the edge */}
          <div ref={outerRef}
            className="absolute w-2/3 h-2/3 rounded-full bg-calm-100 dark:bg-calm-900/30"
            style={{ transform: "scale(1)" }}
          />
          <div ref={middleRef}
            className="absolute w-1/2 h-1/2 rounded-full bg-calm-200 dark:bg-calm-800/50"
            style={{ transform: "scale(1)" }}
          />
          <div className="relative z-10 w-24 h-24 rounded-full bg-calm-500 flex flex-col items-center justify-center text-white shadow-lg">
            {running ? (
              <>
                <span className="text-sm font-semibold">{currentPhase.name}</span>
                <span className="text-2xl font-bold">{countdown}</span>
              </>
            ) : (
              <span className="text-sm font-semibold text-center leading-tight px-2">
                {cycles > 0 ? `✓ ${cycles} цикл${cycles > 1 ? "и" : ""}` : "Готово"}
              </span>
            )}
          </div>
        </div>

        {/* Phase indicators */}
        {running && (
          <div className="flex gap-2">
            {phases.map((p, i) => (
              <div key={i} className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                i === phaseIdx
                  ? "bg-calm-500 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-400"
              }`}>
                {p.name} {p.duration}с
              </div>
            ))}
          </div>
        )}

        {cycles > 0 && !running && (
          <p className="text-sm text-calm-600 dark:text-calm-400 font-medium">
            Виконано {cycles} цикл{cycles > 1 ? "и" : ""}. Чудово!
          </p>
        )}

        <button
          onClick={running ? stop : start}
          className={`px-8 py-3 rounded-xl font-semibold transition ${
            running
              ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600"
              : "bg-calm-500 text-white hover:bg-calm-600"
          }`}
        >
          {running ? "Зупинити" : "Розпочати"}
        </button>
      </div>

      {/* Tips */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <h2 className="font-semibold text-slate-800 dark:text-white">Як виконувати</h2>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li>• Сядьте зручно з прямою спиною</li>
          <li>• Дихайте через ніс (вдих і затримка) і через рот (видих)</li>
          <li>• Виконуйте від 3 до 6 циклів за сесію</li>
          <li>• Практикуйте двічі на день для кращого ефекту</li>
        </ul>
      </div>
    </div>
  );
}
