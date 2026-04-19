export interface User {
  id: number;
  email: string;
  name: string;
}

export interface MoodLog {
  id: number;
  score: number;
  emoji: string;
  label: string;
  note: string | null;
  tags: string[] | null;
  emotions: Record<string, number> | null;
  tips: string[];
  created_at: string;
}

export interface JournalEntry {
  id: number;
  title: string;
  content: string;
  sentiment_score: number | null;
  emotions: Record<string, number> | null;
  ai_reflection: string | null;
  created_at: string;
  updated_at: string;
}

export interface MoodStats {
  avg_score: number;
  total_logs: number;
  streak: number;
  avg_this_week: number | null;
  avg_last_week: number | null;
}
