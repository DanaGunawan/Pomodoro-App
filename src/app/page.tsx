'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react'

export default function HomePage() {
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60) // initial: 25 minutes
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [endTime, setEndTime] = useState<Date | null>(null)
  const [sessionType, setSessionType] = useState<'focus' | 'break'>('focus')
  const alarmRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000)
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false)
      setEndTime(new Date())
      if (alarmRef.current) alarmRef.current.play()
    }
    return () => clearInterval(interval)
  }, [isRunning, timeLeft])

  useEffect(() => {
  document.title = `${formatTime(timeLeft)} | ${sessionType === 'focus' ? 'Focus' : 'Break'} - Pomodoro Timer`
}, [timeLeft, sessionType])

  useEffect(() => {
    const saveSession = async () => {
      if (startTime && endTime) {
        const user = (await supabase.auth.getUser()).data.user
        if (user) {
          await supabase.from('pomodoro_sessions').insert({
            user_id: user.id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            type: sessionType,
          })
        }
        // toggle session type after saving
        setSessionType(prev => (prev === 'focus' ? 'break' : 'focus'))
        setTimeLeft(sessionType === 'focus' ? 5 * 60 : 25 * 60)
      }
    }
    saveSession()
  }, [endTime])

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60).toString().padStart(2, '0')
    const s = (t % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const startTimer = () => {
    setStartTime(new Date())
    setIsRunning(true)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(sessionType === 'focus' ? 25 * 60 : 5 * 60)
    setStartTime(null)
    setEndTime(null)
  }

  const skipSession = () => {
    setEndTime(new Date()) // will trigger save + toggle
    setIsRunning(false)
  }

  return (
    <div className="glass mt-10 p-8 text-center">
      <audio ref={alarmRef} src="/alarm.wav" preload="auto" />
      <h1 className="text-3xl font-bold mb-4">⏱ Pomodoro Timer</h1>
      <p className="text-sm text-gray-400 mb-2">Current: <strong>{sessionType === 'focus' ? 'Focus Time' : 'Break Time'}</strong></p>
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
        <button className="bg-blue-600 hover:bg-blue-700 p-3 rounded-full" onClick={skipSession}>
          <SkipForward />
        </button>
      </div>
    </div>
  )
}
