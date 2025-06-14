'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LogOut, Moon, Sun, LogIn } from 'lucide-react'

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Toggle dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  // Check login state
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

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    location.reload()
  }

  return (
    <nav className="glass p-4 flex justify-between items-center mb-8">
      <Link href="/">
        <h1 className="text-xl font-bold">🌐 Web3 Pomodoro</h1>
      </Link>

      <div className="flex gap-4 items-center">
        {/* Dark mode toggle */}
        <button onClick={() => setDarkMode(!darkMode)} className="hover:scale-110 transition">
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* If user is logged in */}
        {user ? (
          <>
            <Link href="/leaderboard" className="hover:underline">🏆 Leaderboard</Link>
            <Link href="/analytics" className="hover:underline">📊 Analytics</Link>
            <button onClick={handleLogout} className="hover:text-red-500">
              <LogOut size={20} />
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:underline flex items-center gap-1">
              <LogIn size={18} /> <span>Login</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
