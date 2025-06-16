"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTimer } from "@/context/TimerContext";

interface Props {
  onClose: () => void;
}

export default function SettingsForm({ onClose }: Props) {
  const [focusDuration, setFocusDuration] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [longBreakInterval, setLongBreakIntervalLocal] = useState(4);
  const [autoStartPomodoro, setAutoStartPomodoro] = useState(false);
  const [autoStartBreak, setAutoStartBreak] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const {
    setDurations,
    sessionType,
    setTimeLeft,
    setLongBreakInterval,
  } = useTimer();

  useEffect(() => {
    const loadSettings = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("user_settings")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        const focus = data.focus_duration / 60;
        const short = data.short_break_duration / 60;
        const long = data.long_break_duration / 60;

        setFocusDuration(focus);
        setShortBreak(short);
        setLongBreak(long);
        setLongBreakIntervalLocal(data.long_break_interval || 4);
        setAutoStartBreak(data.auto_start_break || false);
        setAutoStartPomodoro(data.auto_start_pomodoro || false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!userId) return;

    const updates = {
      focus_duration: focusDuration * 60,
      short_break_duration: shortBreak * 60,
      long_break_duration: longBreak * 60,
      long_break_interval: longBreakInterval,
      auto_start_break: autoStartBreak,
      auto_start_pomodoro: autoStartPomodoro,
    };

    await supabase.from("user_settings").upsert({ id: userId, ...updates });

    setDurations({
      focus: focusDuration * 60,
      short_break: shortBreak * 60,
      long_break: longBreak * 60,
    });

    if (sessionType === "focus") setTimeLeft(focusDuration * 60);
    else if (sessionType === "short_break") setTimeLeft(shortBreak * 60);
    else if (sessionType === "long_break") setTimeLeft(longBreak * 60);

    setLongBreakInterval(longBreakInterval);

    onClose();
  };

  return (
    <div className="p-4 max-w-md">
      <h2 className="text-lg font-semibold mb-4">Timer</h2>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm">Pomodoro</label>
          <input
            type="number"
            min={1}
            value={focusDuration}
            onChange={(e) => setFocusDuration(Number(e.target.value))}
            className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800 border dark:border-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm">Short Break</label>
          <input
            type="number"
            min={1}
            value={shortBreak}
            onChange={(e) => setShortBreak(Number(e.target.value))}
            className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800 border dark:border-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm">Long Break</label>
          <input
            type="number"
            min={1}
            value={longBreak}
            onChange={(e) => setLongBreak(Number(e.target.value))}
            className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800 border dark:border-gray-700"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <label className="text-sm">Auto Start Breaks</label>
        <input
          type="checkbox"
          checked={autoStartBreak}
          onChange={() => setAutoStartBreak(!autoStartBreak)}
        />
      </div>

      <div className="flex items-center justify-between mb-2">
        <label className="text-sm">Auto Start Pomodoros</label>
        <input
          type="checkbox"
          checked={autoStartPomodoro}
          onChange={() => setAutoStartPomodoro(!autoStartPomodoro)}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm mb-1">Long Break Interval (Setiap X sesi fokus)</label>
        <input
          type="number"
          min={1}
          value={longBreakInterval}
          onChange={(e) => setLongBreakIntervalLocal(Number(e.target.value))}
          className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800 border dark:border-gray-700"
        />
      </div>

      <hr className="my-4" />
      <h2 className="text-lg font-semibold mb-2">Task</h2>

      <div className="flex justify-end mt-4">
        <button
          onClick={handleSave}
          className="bg-blue-900 text-white hover:bg-blue-800 px-4 py-2 rounded-lg shadow-md transition-colors duration-200"
        >
          Save
        </button>
      </div>
    </div>
  );
}
