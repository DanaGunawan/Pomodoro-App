"use client";

import { createContext, useContext, useEffect, useState } from "react";
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
  total_sessions: number;
  focus_count: number;
  short_break_count: number;
  long_break_count: number;
}

interface TaskContextType {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  addTask: (task: Omit<Task, "id">) => Promise<Task | null>;
  updateTask: (updatedTask: Task) => Promise<void>;
  activeTask: Task | null;
  totalPomodoros: number;
}

interface DatabaseTaskRow {
  id: string;
  name: string;
  completed_pomodoros: number;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: React.ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [totalPomodoros, setTotalPomodoros] = useState<number>(0);

  const loadTasksAndStats = async (uid: string) => {
    try {
      const { data: tasksData, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: true });

      if (taskError) console.error("Task fetch error:", taskError);

      const { data: statsData, error: statsError } = await supabase.rpc("get_task_sessions", {
        p_user_id: uid,
      });

      if (statsError) console.error("Task stats fetch error:", statsError);

      if (tasksData) {
        const mappedTasks = tasksData.map((t: DatabaseTaskRow) => {
          const stat = (statsData as TaskStats[])?.find((s) => s.task_id === t.id);
          return {
            id: t.id,
            name: t.name,
            completedPomodoros: t.completed_pomodoros,
            totalSessions: stat?.total_sessions ?? 0,
            focusCount: stat?.focus_count ?? 0,
            shortBreakCount: stat?.short_break_count ?? 0,
            longBreakCount: stat?.long_break_count ?? 0,
          };
        });
        setTasks(mappedTasks);
      }
    } catch (error) {
      console.error("Error loading tasks and stats:", error);
    }
  };

  const recalculateTotalPomodoros = async (uid: string) => {
    const { data: rpcData, error: rpcError } = await supabase.rpc("get_total_pomodoros_per_user");

    if (rpcError) {
      console.error("RPC total error:", rpcError);
      return;
    }

    const found = (rpcData as { user_id: string; total_pomodoro_sessions: number }[]).find(
      (item) => item.user_id === uid
    );
    setTotalPomodoros(found?.total_pomodoro_sessions ?? 0);
  };

  const fetchAll = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      setUserId(null);
      setTasks([]);
      setTotalPomodoros(0);
      return;
    }

    setUserId(user.id);
    await loadTasksAndStats(user.id);
    await recalculateTotalPomodoros(user.id);
  };

  useEffect(() => {
    fetchAll(); // initial load
  }, []);

  // ✅ Tambahan penting agar saat login logout data terupdate
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.id) {
        setUserId(session.user.id);
        loadTasksAndStats(session.user.id);
        recalculateTotalPomodoros(session.user.id);
      } else {
        setUserId(null);
        setTasks([]);
        setTotalPomodoros(0);
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("realtime-tasks")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        if (!userId) return;
        loadTasksAndStats(userId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const addTask = async (task: Omit<Task, "id">): Promise<Task | null> => {
    if (!userId) return null;

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        name: task.name,
        completed_pomodoros: task.completedPomodoros,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Gagal menambahkan task:", error?.message);
      return null;
    }

    const newTask: Task = {
      id: data.id,
      name: data.name,
      completedPomodoros: data.completed_pomodoros,
    };

    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  };

  const updateTask = async (updatedTask: Task) => {
    if (!updatedTask.id || !userId) return;

    const { error } = await supabase
      .from("tasks")
      .update({
        completed_pomodoros: updatedTask.completedPomodoros,
      })
      .eq("id", updatedTask.id);

    if (error) {
      console.error("Update task error:", error);
    }
  };

  const activeTask = tasks.length > 0 ? tasks[0] : null;

  return (
    <TaskContext.Provider
      value={{
        tasks,
        setTasks,
        addTask,
        updateTask,
        activeTask,
        totalPomodoros,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error("useTasks must be used within a TaskProvider");
  return context;
};
