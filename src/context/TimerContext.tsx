"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface TimerContextType {
  timeLeft: number;
  isRunning: boolean;
  sessionType: "focus" | "break";
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipSession: () => void;
  focusCount: number;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const FOCUS_DEFAULT = 25 * 60;
const BREAK_DEFAULT = 5 * 60;

export const TimerProvider = ({ children }: { children: React.ReactNode }) => {
  const [timeLeft, setTimeLeft] = useState(FOCUS_DEFAULT);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState<"focus" | "break">("focus");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [focusCount, setFocusCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const durations = {
    focus: FOCUS_DEFAULT,
    break: BREAK_DEFAULT,
  };

  useEffect(() => {
    const restoreState = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (user) setUserId(user.id);

      const settingsRes = await supabase.from("user_settings").select("*").eq("id", user?.id).single();
      if (settingsRes.data) {
        durations.focus = settingsRes.data.focus_duration;
        durations.break = settingsRes.data.break_duration;
      }

      const saved = localStorage.getItem("pomodoro_state");
      if (saved) {
        const parsed = JSON.parse(saved);
        setTimeLeft(parsed.timeLeft);
        setIsRunning(parsed.isRunning);
        setSessionType(parsed.sessionType);
        setStartTime(parsed.startTime ? new Date(parsed.startTime) : null);
        setEndTime(parsed.endTime ? new Date(parsed.endTime) : null);
      }
    };
    restoreState();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "pomodoro_state",
      JSON.stringify({ timeLeft, isRunning, sessionType, startTime, endTime })
    );
  }, [timeLeft, isRunning, sessionType, startTime, endTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setEndTime(new Date());
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    const save = async () => {
      if (startTime && endTime && userId) {
        await supabase.from("pomodoro_sessions").insert({
          user_id: userId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          type: sessionType,
        });

        if (sessionType === "focus") {
          const { count } = await supabase
            .from("pomodoro_sessions")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("type", "focus");

          if (typeof count === "number") setFocusCount(count);
        }

        const next = sessionType === "focus" ? "break" : "focus";
        setSessionType(next);
        setTimeLeft(durations[next]);
        setStartTime(null);
        setEndTime(null);
        localStorage.removeItem("pomodoro_state");
      }
    };
    save();
  }, [endTime]);

  const startTimer = () => {
    if (!isRunning) {
      setIsRunning(true);
      if (!startTime) setStartTime(new Date());
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(durations[sessionType]);
    setStartTime(null);
    setEndTime(null);
  };

  const skipSession = () => {
    setEndTime(new Date());
    setIsRunning(false);
  };

  return (
    <TimerContext.Provider
      value={{
        timeLeft,
        isRunning,
        sessionType,
        startTimer,
        pauseTimer,
        resetTimer,
        skipSession,
        focusCount,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
};
