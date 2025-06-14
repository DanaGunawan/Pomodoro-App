// ✅ pomodoro-app/app/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { Play, Pause, RotateCcw } from 'lucide-react'
import Navbar from '@/components/Navbar'

export default function HomePage() {
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [endTime, setEndTime] = useState<Date | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000)
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false)
      setEndTime(new Date())
    }
    return () => clearInterval(interval)
  }, [isRunning, timeLeft])

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60).toString().padStart(2, '0')
    const s = (t % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const startTimer = () => {
    setStartTime(new Date())
    setTimeLeft(25 * 60)
    setIsRunning(true)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(25 * 60)
    setStartTime(null)
    setEndTime(null)
  }

  useEffect(() => {
    const saveSession = async () => {
      if (startTime && endTime) {
        const user = (await supabase.auth.getUser()).data.user
        if (user) {
          await supabase.from('pomodoro_sessions').insert({
            user_id: user.id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            type: 'focus',
          })
        }
      }
    }
    saveSession()
  }, [endTime])

  return (
    <div className="glass mt-10 p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">⏱ Pomodoro Timer</h1>
      <div className="text-6xl font-mono mb-6">{formatTime(timeLeft)}</div>
      <div className="flex justify-center gap-4">
        {!isRunning ? (
          <button className="bg-green-600 hover:bg-green-700 p-3 rounded-full" onClick={startTimer}>
            <Play />
          </button>
        ) : (
          <button className="bg-yellow-500 hover:bg-yellow-600 p-3 rounded-full" onClick={() => setIsRunning(false)}>
            <Pause />
          </button>
        )}
        <button className="bg-red-600 hover:bg-red-700 p-3 rounded-full" onClick={resetTimer}>
          <RotateCcw />
        </button>
      </div>
    </div>
  )
}
