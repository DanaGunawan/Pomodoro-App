"use client";

import { useTimer } from "@/context/TimerContext";
import { useTasks } from "@/context/TaskContext";
import { supabase } from "@/lib/supabase";
import { Play, Pause, RotateCcw, SkipForward, Plus } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface TaskSession {
  task_id: string;
  total_sessions: number;
}

type SessionType = "focus" | "short_break" | "long_break";

export default function HomePage() {
  const {
    timeLeft,
    isRunning,
    sessionType,
    startTimer,
    pauseTimer,
    resetTimer,
    skipSession,
    setSessionType,
    setTimeLeft,
    durations,
  } = useTimer();

  const { tasks, addTask, updateTask, setTasks } = useTasks();

  const [newTask, setNewTask] = useState("");
  const [totalSessionsCount, setTotalSessionsCount] = useState(0);
  const [taskSessions, setTaskSessions] = useState<
    Record<string, { total_sessions: number }>
  >({});

  const startAlarmRef = useRef<HTMLAudioElement | null>(null);
  const endAlarmRef = useRef<HTMLAudioElement | null>(null);
  const skipCalledRef = useRef(false);

  const fetchSessionsData = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Gagal mengambil user:", userError?.message);
      return;
    }

    const userId = user.id;

    const { data, error } = await supabase.rpc("get_total_pomodoros_per_user", {
      p_user_id: userId,
    });

    if (error) {
      console.error("Gagal mengambil total sesi:", error.message);
    } else if (data?.[0]) {
      setTotalSessionsCount(data[0].total_all_sessions);
    }

    const { data: taskData, error: taskErr } = await supabase.rpc(
      "get_task_sessions",
      { p_user_id: userId }
    );

    if (taskErr) {
      console.error("Gagal mengambil task sessions:", taskErr.message);
    } else {
      const taskSessionMap: Record<string, { total_sessions: number }> = {};
      (taskData as TaskSession[]).forEach((item) => {
        taskSessionMap[item.task_id] = {
          total_sessions: item.total_sessions,
        };
      });
      setTaskSessions(taskSessionMap);
    }
  };

  useEffect(() => {
    fetchSessionsData();
  }, []);

  useEffect(() => {
    startAlarmRef.current = new Audio("/sounds/start-alarm.wav");
    endAlarmRef.current = new Audio("/sounds/end-alarm.wav");
  }, []);

  useEffect(() => {
    if (timeLeft === 2 && isRunning && !skipCalledRef.current) {
      const alarm = endAlarmRef.current;
      const activeTask = tasks[0];

      if (!activeTask || !activeTask.id || !alarm) {
        skipSession();
        skipCalledRef.current = false;
        return;
      }

      skipCalledRef.current = true;

      alarm.play().catch((err) => {
        console.error("End alarm error:", err);
        handleEndSession();
      });

      const handleEndSession = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const start = new Date(Date.now() - durations[sessionType] * 1000);
        const end = new Date();

        const { error: insertError } = await supabase.from("pomodoro_sessions").insert({
          user_id: user.id,
          task_id: activeTask.id,
          type: sessionType,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
        });

        if (insertError) {
          console.error("Gagal menyimpan sesi:", insertError.message);
        }

        const updated = {
          ...activeTask,
          completedPomodoros: activeTask.completedPomodoros + 1,
        };
        await updateTask(updated);
        await fetchSessionsData();
        skipSession();
        skipCalledRef.current = false;
      };

      const onEnded = () => {
        handleEndSession();
        alarm.removeEventListener("ended", onEnded);
      };

      alarm.addEventListener("ended", onEnded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isRunning, sessionType]);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60).toString().padStart(2, "0");
    const s = (t % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getBackground = () => {
    if (!isRunning) return "from-gray-900 via-gray-800 to-gray-900";
    return sessionType === "focus"
      ? "from-indigo-800 via-purple-900 to-black"
      : sessionType === "short_break"
      ? "from-green-400 via-emerald-600 to-teal-700"
      : "from-blue-700 via-blue-900 to-black";
  };

  const setActiveTask = (index: number) => {
    if (index === 0) return;
    const selectedTask = tasks[index];
    const newTasks = [selectedTask, ...tasks.filter((_, i) => i !== index)];
    setTasks(newTasks);
  };

  const handleAddTask = async () => {
    if (newTask.trim()) {
      const task = { name: newTask.trim(), completedPomodoros: 0 };
      const newAdded = await addTask(task);
      if (newAdded) {
        const newList = [newAdded, ...tasks];
        setTasks(newList);
      }
      setNewTask("");
    }
  };

  const handleSessionChange = (type: SessionType) => {
    pauseTimer();
    setSessionType(type);
    setTimeLeft(durations[type]);
    skipCalledRef.current = false;
  };

  const handleStartWithAlarm = () => {
    startAlarmRef.current?.play().catch((err) =>
      console.error("Start alarm error:", err)
    );
    startTimer();
  };

  return (
    <div
      className={`glass mt-10 p-8 text-center bg-gradient-to-br ${getBackground()} transition-all duration-700 rounded-xl`}
    >
      <h1 className="text-3xl font-bold mb-2">⏱ Pomodoro Timer</h1>

      <p className="text-sm text-gray-200 mb-4">
        Current:{" "}
        <strong>
          {sessionType === "focus"
            ? "Focus"
            : sessionType === "short_break"
            ? "Short Break"
            : "Long Break"}
        </strong>
      </p>

      <div className="flex justify-center gap-4 mb-6">
        {["focus", "short_break", "long_break"].map((type) => (
          <button
            key={type}
            className={`px-4 py-2 rounded-full ${
              sessionType === type
                ? type === "focus"
                  ? "bg-indigo-600 text-white"
                  : type === "short_break"
                  ? "bg-green-600 text-white"
                  : "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-200"
            }`}
            onClick={() => handleSessionChange(type as SessionType)}
          >
            {type === "focus"
              ? "Pomodoro"
              : type === "short_break"
              ? "Short Break"
              : "Long Break"}
          </button>
        ))}
      </div>

      <div className="text-6xl font-mono mb-6">{formatTime(timeLeft)}</div>

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

      <div className="mt-20 border-t border-gray-700 pt-6">
        <h2 className="text-lg font-semibold mb-2 text-white">📝 Tasks</h2>

        <p className="text-sm text-gray-400 mb-4">
          📊 <strong>All Sessions Completed:</strong> {totalSessionsCount}
        </p>

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
              key={task.id ?? i}
              onClick={() => setActiveTask(i)}
              className={`cursor-pointer bg-white bg-opacity-10 px-4 py-2 rounded flex justify-between items-center hover:bg-opacity-20 ${
                i === 0 ? "border border-yellow-400" : ""
              }`}
            >
              <span>
                {i === 0 ? "🔥 " : "✅ "} {task.name}
              </span>
              <span className="text-sm text-gray-300">
                🍅 {taskSessions[task.id ?? ""]?.total_sessions ?? 0}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
