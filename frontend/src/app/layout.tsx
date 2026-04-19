import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MindCare — Mental Health Companion",
  description: "Track your emotional wellbeing and nurture your mental health.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
