// ✅ pomodoro-app/app/analytics/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

interface Session {
  id: string;
  start_time: string;
  end_time: string;
  type: string;
  created_at: string;
}

export default function AnalyticsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);

  useEffect(() => {
    const fetchSessions = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) return;

      const { data, error } = await supabase
        .from("pomodoro_sessions")
        .select("*")
        .eq("user_id", user.user.id)
        .order("start_time", { ascending: false });

      if (error) {
        console.error("Error fetching sessions:", error.message);
      }

      if (data) {
        setSessions(data);
        const minutes = data.reduce((sum, s) => {
          const start = new Date(s.start_time).getTime();
          const end = new Date(s.end_time).getTime();
          return sum + Math.round((end - start) / 60000);
        }, 0);
        setTotalMinutes(minutes);
      }
    };
    fetchSessions();
  }, []);

  return (
    <div className="glass p-6">
      <h1 className="text-2xl font-bold mb-4">📊 Your Analytics</h1>
      <p className="mb-4">
        Total Focus Time: <strong>{totalMinutes}</strong> minutes
      </p>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {sessions.map((session) => (
          <div key={session.id} className="p-3 rounded bg-white/5">
            <div className="text-sm">
              🕒 {format(new Date(session.start_time), "PPpp")} →{" "}
              {format(new Date(session.end_time), "pp")}
            </div>
            <div className="text-xs text-gray-400">
              {session.type.toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
