"use client";
import Navbar from "@/components/Navbar";
import Onboarding from "@/components/Onboarding";
import { useOnboarding } from "@/hooks/useOnboarding";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { show, finish } = useOnboarding();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navbar />
      {show && <Onboarding onFinish={finish} />}
      <main className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
        {children}
      </main>
    </div>
  );
}
