"use client";

import { TimerProvider } from "@/context/TimerContext";
import { TaskProvider } from "@/context/TaskContext";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TaskProvider>
      <TimerProvider>
        {children}
      </TimerProvider>
    </TaskProvider>
  );
}
