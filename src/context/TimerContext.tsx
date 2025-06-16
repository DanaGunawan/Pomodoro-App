"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

export interface Task {
  id?: string;
  name: string;
  completedPomodoros: number;
  totalSessions?: number;
  focusCount?: number;
  shortBreakCount?: number;
  longBreakCount?: number;
}

interface TaskStats {
  task_id: string;
  task_name: string;
  total_sessions: number;
  focus_count: number;
  short_break_count: number;
  long_break_count: number;
}

interface Durations {
  focus: number;
  short_break: number;
  long_break: number;
}

interface TimerContextType {
  timeLeft: number;
  isRunning: boolean;
  sessionType: "focus" | "short_break" | "long_break";
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipSession: () => void;
  focusCount: number;
  setSessionType: (type: "focus" | "short_break" | "long_break") => void;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setTimeLeft: (time: number) => void;
  durations: Durations;
  setDurations: React.Dispatch<React.SetStateAction<Durations>>;
  longBreakInterval: number;
  setLongBreakInterval: React.Dispatch<React.SetStateAction<number>>;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const FOCUS_DEFAULT = 25 * 60;
const SHORT_BREAK_DEFAULT = 5 * 60;
const LONG_BREAK_DEFAULT = 15 * 60;

export const TimerProvider = ({ children }: { children: React.ReactNode }) => {
  const [timeLeft, setTimeLeft] = useState(FOCUS_DEFAULT);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState<"focus" | "short_break" | "long_break">("focus");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [combinedSessionCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [longBreakInterval, setLongBreakInterval] = useState(4);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionChanged, setSessionChanged] = useState(false);
  const hasSavedSession = useRef(false);

  const [durations, setDurations] = useState<Durations>({
    focus: FOCUS_DEFAULT,
    short_break: SHORT_BREAK_DEFAULT,
    long_break: LONG_BREAK_DEFAULT,
  });

  useEffect(() => {
    const restoreState = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (user) setUserId(user.id);

      const settingsRes = await supabase
        .from("user_settings")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (settingsRes.data) {
        const { focus_duration, short_break_duration, long_break_duration, long_break_interval } = settingsRes.data;
        setDurations({
          focus: focus_duration,
          short_break: short_break_duration,
          long_break: long_break_duration,
        });
        setTimeLeft(focus_duration);
        setLongBreakInterval(long_break_interval || 4);
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

      if (user) {
        const { data: taskStats } = await supabase.rpc("get_task_sessions", { p_user_id: user.id });
        if (taskStats) {
          setTasks(
            (taskStats as TaskStats[]).map((t) => ({
              id: t.task_id,
              name: t.task_name,
              completedPomodoros: t.focus_count ?? 0,
              totalSessions: t.total_sessions ?? 0,
              focusCount: t.focus_count ?? 0,
              shortBreakCount: t.short_break_count ?? 0,
              longBreakCount: t.long_break_count ?? 0,
            }))
          );
        }
      }

      setIsInitialized(true);
    };

    restoreState();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem(
      "pomodoro_state",
      JSON.stringify({ timeLeft, isRunning, sessionType, startTime, endTime })
    );
  }, [timeLeft, isRunning, sessionType, startTime, endTime, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    document.title = `${formatTime(timeLeft)} | ${getTitleIcon(sessionType)} ${capitalize(sessionType.replace("_", " "))}`;
  }, [timeLeft, sessionType, isInitialized]);

  const formatTime = (t: number) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  const getTitleIcon = (type: TimerContextType["sessionType"]) =>
    type === "focus" ? "🧠" : type === "short_break" ? "☕" : "🛌";
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  useEffect(() => {
    if (!isInitialized) return;
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
  }, [isRunning, sessionType, tasks, userId, isInitialized]);

  useEffect(() => {
    if (!isInitialized || !endTime || hasSavedSession.current) return;

    hasSavedSession.current = true;



  }, [
    endTime,
    startTime,
    sessionType,
    durations,
    combinedSessionCount,
    longBreakInterval,
    tasks,
    userId,
    isInitialized,
  ]);

  const startTimer = () => {
    if (!isRunning) {
      if (sessionChanged) setSessionChanged(false);
      setIsRunning(true);
      if (!startTime) setStartTime(new Date());
      hasSavedSession.current = false;
    }
  };

  const pauseTimer = () => setIsRunning(false);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(durations[sessionType]);
    setStartTime(null);
    setEndTime(null);
    hasSavedSession.current = false;
  };

  const skipSession = () => {
    setEndTime(new Date());
    setIsRunning(false);
    hasSavedSession.current = false;
  };



  if (!isInitialized) {
    return <div className="text-center mt-20 text-gray-500">Loading settings...</div>;
  }

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
        focusCount: combinedSessionCount,
        setSessionType,
        tasks,
        setTasks,
        setTimeLeft,
        durations,
        setDurations,
        longBreakInterval,
        setLongBreakInterval,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) throw new Error("useTimer must be used within a TimerProvider");
  return context;
};
