'use client'

import { useEffect, useState } from 'react'

interface UserEntry {
  user_id: string
  email: string
  total_focus_minutes: number
  total_break_minutes: number
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<UserEntry[]>([])

  useEffect(() => {
    const loadLeaderboard = async () => {
      const res = await fetch('/api/leaderboard')
      if (res.ok) {
        const data = await res.json()
        setLeaderboard(data)
      }
    }
    loadLeaderboard()
  }, [])

  return (
    <div className="glass p-6">
      <h1 className="text-2xl font-bold mb-4">🏆 Leaderboard</h1>
      <div className="space-y-2">
        {leaderboard.map((user, i) => (
          <div
            key={user.user_id}
            className="flex justify-between bg-white/5 p-3 rounded text-sm sm:text-base"
          >
            <div>
              <strong>#{i + 1}</strong> {user.email}
            </div>
            <div className="text-right">
              <div>🎯 {user.total_focus_minutes} min focus</div>
              <div>🛀 {user.total_break_minutes} min break</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
