'use client'

import { TimerProvider } from '@/context/TimerContext'

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return <TimerProvider>{children}</TimerProvider>
}
