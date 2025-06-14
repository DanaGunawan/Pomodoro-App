// ✅ pomodoro-app/app/leaderboard/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface UserEntry {
  user_id: string
  total_minutes: number
  email: string
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<UserEntry[]>([])

  useEffect(() => {
    const loadLeaderboard = async () => {
      const { data, error } = await supabase.rpc('get_leaderboard')
      if (!error && data) setLeaderboard(data)
    }
    loadLeaderboard()
  }, [])

  return (
    <div className="glass p-6">
      <h1 className="text-2xl font-bold mb-4">🏆 Leaderboard</h1>
      <div className="space-y-2">
        {leaderboard.map((user, i) => (
          <div key={user.user_id} className="flex justify-between bg-white/5 p-3 rounded">
            <div>#{i + 1} {user.email}</div>
            <div>{user.total_minutes} mins</div>
          </div>
        ))}
      </div>
    </div>
  )
}
