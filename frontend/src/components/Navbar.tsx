"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useTheme } from "@/hooks/useTheme";

const links = [
  { href: "/dashboard", label: "Головна" },
  { href: "/journal", label: "Щоденник" },
  { href: "/analytics", label: "Аналітика" },
  { href: "/breathing", label: "Дихання" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { dark, toggle } = useTheme();

  function logout() {
    Cookies.remove("token");
    router.push("/login");
  }

  return (
    <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between transition-colors">
      <Link href="/dashboard" className="text-xl font-bold text-calm-600">
        MindCare
      </Link>
      <div className="flex items-center gap-6">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm font-medium transition ${
              pathname === l.href
                ? "text-calm-600"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {l.label}
          </Link>
        ))}

        <button
          onClick={toggle}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition text-base"
          title={dark ? "Світла тема" : "Темна тема"}
        >
          {dark ? "☀️" : "🌙"}
        </button>

        <a
          href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/docs`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-slate-400 dark:text-slate-500 hover:text-calm-500 transition"
          title="API документація"
        >
          API
        </a>

        <button
          onClick={logout}
          className="text-sm text-slate-400 hover:text-red-500 transition"
        >
          Вийти
        </button>
      </div>
    </nav>
  );
}
