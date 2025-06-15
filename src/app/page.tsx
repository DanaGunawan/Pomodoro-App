"use client";

import { useTimer } from "@/context/TimerContext";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";

export default function HomePage() {
  const {
    timeLeft,
    isRunning,
    sessionType,
    startTimer,
    pauseTimer,
    resetTimer,
    skipSession,
    focusCount,
  } = useTimer();

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60).toString().padStart(2, "0");
    const s = (t % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
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
        {isRunning ? (
          <button
            className="bg-yellow-500 hover:bg-yellow-600 p-3 rounded-full"
            onClick={pauseTimer}
          >
            <Pause />
          </button>
        ) : (
          <button
            className="bg-green-600 hover:bg-green-700 p-3 rounded-full"
            onClick={startTimer}
          >
            <Play />
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
