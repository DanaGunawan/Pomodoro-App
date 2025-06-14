'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function Footer() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }
    fetchUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  return (
    <footer className="glass w-full p-4 text-center text-sm text-gray-300 flex flex-col md:flex-row justify-between items-center">
      <p>
        © {new Date().getFullYear()} Pomodoro-App by <span className="font-semibold text-white">Dana Gunawan</span>
      </p>
      <div className="flex items-center gap-4">
        <Link href="/" className="hover:underline">🏠 Home</Link>
        {user && <Link href="/analytics" className="hover:underline">📊 Analytics</Link>}
        <Link href="https://github.com/DanaGunawan/Pomodoro-App" target="_blank" className="hover:underline">GitHub</Link>
      </div>
    </footer>
  )
}
