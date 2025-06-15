"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTimer } from "@/context/TimerContext";

interface Props {
  onClose: () => void;
}

type SettingValue = boolean | number;

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
    durations,
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

        setDurations({
          focus: focus * 60,
          short_break: short * 60,
          long_break: long * 60,
        });

        if (sessionType === "focus") setTimeLeft(focus * 60);
        else if (sessionType === "short_break") setTimeLeft(short * 60);
        else if (sessionType === "long_break") setTimeLeft(long * 60);

        setLongBreakInterval(data.long_break_interval || 4);
      }
    };
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChangeDuration = async (
    type: "focus_duration" | "short_break_duration" | "long_break_duration",
    value: number
  ) => {
    if (!userId) return;

    await supabase.from("user_settings").update({ [type]: value * 60 }).eq("id", userId);

    const updatedDurations = {
      ...durations,
      [type === "focus_duration"
        ? "focus"
        : type === "short_break_duration"
        ? "short_break"
        : "long_break"]: value * 60,
    };

    setDurations(updatedDurations);

    if (
      (type === "focus_duration" && sessionType === "focus") ||
      (type === "short_break_duration" && sessionType === "short_break") ||
      (type === "long_break_duration" && sessionType === "long_break")
    ) {
      setTimeLeft(value * 60);
    }
  };

  const handleChangeOther = async (field: string, value: SettingValue) => {
    if (!userId) return;
    await supabase.from("user_settings").update({ [field]: value }).eq("id", userId);

    if (field === "long_break_interval") {
      setLongBreakInterval(value as number);
      setLongBreakIntervalLocal(value as number);
    }
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
            onChange={(e) => {
              const val = Number(e.target.value);
              setFocusDuration(val);
              handleChangeDuration("focus_duration", val);
            }}
            className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800 border dark:border-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm">Short Break</label>
          <input
            type="number"
            min={1}
            value={shortBreak}
            onChange={(e) => {
              const val = Number(e.target.value);
              setShortBreak(val);
              handleChangeDuration("short_break_duration", val);
            }}
            className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800 border dark:border-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm">Long Break</label>
          <input
            type="number"
            min={1}
            value={longBreak}
            onChange={(e) => {
              const val = Number(e.target.value);
              setLongBreak(val);
              handleChangeDuration("long_break_duration", val);
            }}
            className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800 border dark:border-gray-700"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <label className="text-sm">Auto Start Breaks</label>
        <input
          type="checkbox"
          checked={autoStartBreak}
          onChange={() => {
            const val = !autoStartBreak;
            setAutoStartBreak(val);
            handleChangeOther("auto_start_break", val);
          }}
        />
      </div>

      <div className="flex items-center justify-between mb-2">
        <label className="text-sm">Auto Start Pomodoros</label>
        <input
          type="checkbox"
          checked={autoStartPomodoro}
          onChange={() => {
            const val = !autoStartPomodoro;
            setAutoStartPomodoro(val);
            handleChangeOther("auto_start_pomodoro", val);
          }}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm mb-1">Long Break Interval</label>
        <input
          type="number"
          min={1}
          value={longBreakInterval}
          onChange={(e) => {
            const val = Number(e.target.value);
            setLongBreakIntervalLocal(val);
            handleChangeOther("long_break_interval", val);
          }}
          className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800 border dark:border-gray-700"
        />
      </div>

      <hr className="my-4" />
      <h2 className="text-lg font-semibold mb-2">Task</h2>

      <div className="flex justify-end mt-4">
        <button
          onClick={onClose}
          className="bg-blue-900 text-white hover:bg-blue-800 px-4 py-2 rounded-lg shadow-md transition-colors duration-200"
        >
          Save
        </button>
      </div>
    </div>
  );
}
