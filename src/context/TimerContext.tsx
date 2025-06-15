"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface Task {
  id?: string;
  name: string;
  completedPomodoros: number;
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
  addTask: (task: Task) => Promise<void>;
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
  const [focusCount, setFocusCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [longBreakInterval, setLongBreakInterval] = useState(4);

  const [durations, setDurations] = useState({
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
        const { focus_duration, short_break_duration, long_break_duration, long_break_interval } =
          settingsRes.data;

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
        const { data: taskData } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (taskData) {
          setTasks(
            taskData.map((t) => ({
              id: t.id,
              name: t.name,
              completedPomodoros: t.completed_pomodoros,
            }))
          );
        }
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
    document.title = `${formatTime(timeLeft)} | ${getTitleIcon(sessionType)} ${capitalize(
      sessionType.replace("_", " ")
    )}`;
  }, [timeLeft, sessionType]);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60).toString().padStart(2, "0");
    const s = (t % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getTitleIcon = (type: TimerContextType["sessionType"]) => {
    if (type === "focus") return "🧠";
    if (type === "short_break") return "☕";
    if (type === "long_break") return "💤";
    return "⏱";
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setEndTime(new Date());

            if (sessionType === "focus" && tasks.length > 0) {
              const activeTask = tasks[0];
              const updatedPomodoros = activeTask.completedPomodoros + 1;

              if (userId && activeTask.id) {
                supabase
                  .from("tasks")
                  .update({ completed_pomodoros: updatedPomodoros })
                  .eq("id", activeTask.id);
              }

              setTasks((prevTasks) => {
                const updated = [...prevTasks];
                updated[0].completedPomodoros = updatedPomodoros;
                return updated;
              });
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, sessionType, tasks, userId]);

 useEffect(() => {
  const save = async () => {
    if (startTime && endTime && userId) {
      await supabase.from("pomodoro_sessions").insert({
        user_id: userId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        type: sessionType,
      });

      const nextSession =
        sessionType === "focus"
          ? (focusCount + 1) % longBreakInterval === 0
            ? "long_break"
            : "short_break"
          : "focus";

      if (sessionType === "focus") {
        setFocusCount((count) => count + 1);
      }

      setSessionType(nextSession);
      setTimeLeft(durations[nextSession]);
      setStartTime(null);
      setEndTime(null);
      localStorage.removeItem("pomodoro_state");
    }
  };

  if (endTime) {
    save();
  }
}, [endTime, startTime, userId, sessionType, focusCount, longBreakInterval, durations]);

  const startTimer = () => {
    if (!isRunning) {
      setIsRunning(true);
      if (!startTime) setStartTime(new Date());
    }
  };

  const pauseTimer = () => setIsRunning(false);

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

  const addTask = async (task: Task) => {
    if (!userId) return;
    const { data } = await supabase
      .from("tasks")
      .insert([{ user_id: userId, name: task.name, completed_pomodoros: task.completedPomodoros }])
      .select();

    if (data && data.length > 0) {
      const newTask = {
        id: data[0].id,
        name: data[0].name,
        completedPomodoros: data[0].completed_pomodoros,
      };
      setTasks((prev) => [...prev, newTask]);
    }
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
        setSessionType,
        tasks,
        addTask,
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
