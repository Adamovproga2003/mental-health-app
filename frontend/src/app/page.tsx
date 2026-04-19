import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-calm-50 to-primary-50 p-8">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-bold text-calm-600">MindCare</h1>
        <p className="text-xl text-slate-600">
          Ваш персональний супутник ментального здоров'я та емоційного добробуту.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="px-6 py-3 bg-calm-500 text-white rounded-xl font-semibold hover:bg-calm-600 transition"
          >
            Розпочати
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border border-calm-500 text-calm-600 rounded-xl font-semibold hover:bg-calm-50 transition"
          >
            Увійти
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-8">
          {[
            { icon: "📊", title: "Трекер настрою", desc: "Щоденна фіксація емоційного стану" },
            { icon: "📓", title: "Щоденник", desc: "Аналіз тексту та AI-рефлексія" },
            { icon: "💡", title: "Поради", desc: "Персоналізовані рекомендації" },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="text-3xl mb-2">{f.icon}</div>
              <div className="font-semibold text-slate-800">{f.title}</div>
              <div className="text-sm text-slate-500 mt-1">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
