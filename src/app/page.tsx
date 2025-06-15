"use client";

import { useTimer } from "@/context/TimerContext";
import { Play, Pause, RotateCcw, SkipForward, Plus } from "lucide-react";
import { useState, useEffect, useRef } from "react";

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
    setSessionType,
    tasks,
    addTask,
    setTimeLeft,
    durations,
  } = useTimer();

  const [newTask, setNewTask] = useState("");

  const startAlarmRef = useRef<HTMLAudioElement | null>(null);
  const endAlarmRef = useRef<HTMLAudioElement | null>(null);
  const skipCalledRef = useRef(false);

  useEffect(() => {
    startAlarmRef.current = new Audio("/sounds/start-alarm.wav");
    endAlarmRef.current = new Audio("/sounds/end-alarm.wav");
  }, []);

  // 🔔 Alarm berbunyi saat timeLeft === 2 detik dan sesi berjalan
  useEffect(() => {
    if (timeLeft === 2 && isRunning && !skipCalledRef.current) {
      const alarm = endAlarmRef.current;
      if (!alarm) {
        skipSession();
        return;
      }

      skipCalledRef.current = true;

      alarm.play().catch((err) => {
        console.error("End alarm error:", err);
        skipSession();
      });

      const onEnded = () => {
        skipSession();
        skipCalledRef.current = false;
        alarm.removeEventListener("ended", onEnded);
      };

      alarm.addEventListener("ended", onEnded);
    }
  }, [timeLeft, isRunning, skipSession]);

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

  const handleAddTask = () => {
    if (newTask.trim()) {
      addTask({ name: newTask.trim(), completedPomodoros: 0 });
      setNewTask("");
    }
  };

  const handleSessionChange = (type: "focus" | "short_break" | "long_break") => {
    setSessionType(type);
    setTimeLeft(durations[type]);
  };

  const handleStartWithAlarm = () => {
    startAlarmRef.current?.play().catch((err) => console.error("Start alarm error:", err));
    startTimer();
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
        <strong>
          {sessionType === "focus"
            ? "Focus Time"
            : sessionType === "short_break"
            ? "Short Break"
            : "Long Break"}
        </strong>
      </p>

      {/* Tombol ganti sesi */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded-full ${
            sessionType === "focus"
              ? "bg-indigo-600 text-white"
              : "bg-gray-800 text-gray-200"
          }`}
          onClick={() => handleSessionChange("focus")}
        >
          Pomodoro
        </button>
        <button
          className={`px-4 py-2 rounded-full ${
            sessionType === "short_break"
              ? "bg-green-600 text-white"
              : "bg-gray-800 text-gray-200"
          }`}
          onClick={() => handleSessionChange("short_break")}
        >
          Short Break
        </button>
        <button
          className={`px-4 py-2 rounded-full ${
            sessionType === "long_break"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-200"
          }`}
          onClick={() => handleSessionChange("long_break")}
        >
          Long Break
        </button>
      </div>

      {/* Timer */}
      <div className="text-6xl font-mono mb-6">{formatTime(timeLeft)}</div>

      {/* Kontrol timer */}
      <div className="flex justify-center gap-4 mb-20">
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
            onClick={handleStartWithAlarm}
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

      {/* Tasks */}
      <div className="mt-20 border-t border-gray-700 pt-6">
        <h2 className="text-lg font-semibold mb-2 text-white">📝 Tasks</h2>

        <div className="flex justify-center mb-4">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task"
            className="px-4 py-2 rounded-l bg-gray-100 text-black"
          />
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded-r"
            onClick={handleAddTask}
          >
            <Plus />
          </button>
        </div>

        <ul className="text-left text-gray-200 space-y-2 max-w-md mx-auto">
          {tasks.map((task, i) => (
            <li
              key={i}
              className={`bg-white bg-opacity-10 px-4 py-2 rounded flex justify-between items-center ${
                i === 0 ? "border border-yellow-400" : ""
              }`}
            >
              <span>
                {i === 0 ? "🔥 " : "✅ "}
                {task.name}
              </span>
              <span className="text-sm text-gray-300">🍅 {task.completedPomodoros}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
