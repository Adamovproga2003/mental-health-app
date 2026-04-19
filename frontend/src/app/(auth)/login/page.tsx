"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import { authApi } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await authApi.login(email, password);
      Cookies.set("token", data.access_token, { expires: 7 });
      router.push("/dashboard");
    } catch {
      setError("Невірний email або пароль.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-calm-50 to-primary-50 p-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center text-calm-600">Увійти</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-calm-500"
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-calm-500"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-calm-500 text-white py-3 rounded-xl font-semibold hover:bg-calm-600 transition disabled:opacity-50"
          >
            {loading ? "Завантаження..." : "Увійти"}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500">
          Немає акаунту?{" "}
          <Link href="/register" className="text-calm-600 font-medium hover:underline">
            Зареєструватися
          </Link>
        </p>
      </div>
    </main>
  );
}
