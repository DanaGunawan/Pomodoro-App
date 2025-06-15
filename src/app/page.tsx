"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";

type SessionType = "focus" | "break";

export default function HomePage() {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1500);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [sessionType, setSessionType] = useState<SessionType>("focus");
  const [userId, setUserId] = useState<string | null>(null);
  const [durations, setDurations] = useState({ focus: 1500, break: 300 });
  const [focusCount, setFocusCount] = useState(0);
  const alarmRef = useRef<HTMLAudioElement | null>(null);

  // Load user and settings
  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (user) {
        setUserId(user.id);

        const { data: setting, error } = await supabase
          .from("user_settings")
          .select("focus_duration, break_duration")
          .eq("id", user.id)
          .single();

        if (setting && !error) {
          const durationsInSeconds = {
            focus: setting.focus_duration,
            break: setting.break_duration,
          };

          setDurations(durationsInSeconds);

          // Restore state from localStorage (only after durations known)
          const saved = localStorage.getItem("pomodoro_state");
          if (saved) {
            const {
              type,
              end,
              running,
            }: { type: SessionType; end: string; running: boolean } =
              JSON.parse(saved);
            const remaining = Math.floor(
              (new Date(end).getTime() - Date.now()) / 1000
            );

            if (remaining > 0) {
              setSessionType(type);
              setTimeLeft(remaining);
              setIsRunning(running);
              setStartTime(
                new Date(
                  Date.now() - (durationsInSeconds[type] - remaining) * 1000
                )
              );
            } else {
              setSessionType("focus");
              setTimeLeft(durationsInSeconds["focus"]);
            }
          }
        }
      }
    };
    init();
  }, []);

  // Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (isRunning && timeLeft <= 0) {
      setIsRunning(false);
      setEndTime(new Date());
      alarmRef.current?.play();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Save session to DB
  useEffect(() => {
    const save = async () => {
      if (startTime && endTime && userId) {
        await supabase.from("pomodoro_sessions").insert({
          user_id: userId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          type: sessionType,
        });

        // Update session count if focus session
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

  // Save state to localStorage
  useEffect(() => {
    if (isRunning) {
      const end = new Date(Date.now() + timeLeft * 1000);
      localStorage.setItem(
        "pomodoro_state",
        JSON.stringify({
          type: sessionType,
          end,
          running: isRunning,
        })
      );
    }
  }, [isRunning, timeLeft, sessionType]);

  // Get focus session count (initial)
  useEffect(() => {
    const fetchCount = async () => {
      if (!userId) return;
      const { count } = await supabase
        .from("pomodoro_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("type", "focus");

      if (typeof count === "number") {
        setFocusCount(count);
      }
    };
    fetchCount();
  }, [userId]);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60)
      .toString()
      .padStart(2, "0");
    const s = (t % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startTimer = () => {
    setStartTime(new Date());
    setTimeLeft(durations[sessionType]);
    setIsRunning(true);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(durations[sessionType]);
    setStartTime(null);
    setEndTime(null);
    localStorage.removeItem("pomodoro_state");
  };

  const skipSession = () => {
    setEndTime(new Date());
    setIsRunning(false);
  };

  const getBackground = () => {
    if (!isRunning) return "from-gray-900 via-gray-800 to-gray-900";
    return sessionType === "focus"
      ? "from-indigo-800 via-purple-900 to-black"
      : "from-green-400 via-emerald-600 to-teal-700";
  };

  return (
    <div
      className={`glass mt-10 p-8 text-center bg-gradient-to-br ${getBackground()} transition-all duration-700 rounded-xl`}
    >
      <audio ref={alarmRef} src="/alarm.wav" preload="auto" />
      <h1 className="text-3xl font-bold mb-2">⏱ Pomodoro Timer</h1>
      <p className="text-sm text-gray-200 mb-2">
        ✅ Total Focus Sessions Completed: <strong>{focusCount}</strong>
      </p>
      <p className="text-sm text-gray-200 mb-4">
        Current:{" "}
        <strong>{sessionType === "focus" ? "Focus Time" : "Break Time"}</strong>
      </p>
      <div className="text-6xl font-mono mb-6">{formatTime(timeLeft)}</div>
      <div className="flex justify-center gap-4">
        {!isRunning ? (
          <button
            className="bg-green-600 hover:bg-green-700 p-3 rounded-full"
            onClick={startTimer}
          >
            <Play />
          </button>
        ) : (
          <button
            className="bg-yellow-500 hover:bg-yellow-600 p-3 rounded-full"
            onClick={() => setIsRunning(false)}
          >
            <Pause />
          </button>
        )}
        <button
          className="bg-red-600 hover:bg-red-700 p-3 rounded-full"
          onClick={resetTimer}
        >
          <RotateCcw />
        </button>
        <button
          className="bg-blue-600 hover:bg-blue-700 p-3 rounded-full"
          onClick={skipSession}
        >
          <SkipForward />
        </button>
      </div>
    </div>
  );
}
