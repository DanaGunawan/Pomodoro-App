'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LogOut, Moon, Sun, LogIn, Menu, X, Settings } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import SettingsForm from '@/components/SettingsForm'

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    location.reload()
  }

  

  return (
    <>
      {/* Navbar utama */}
      <nav className="glass p-4 mb-8 rounded-xl relative z-10">
        <div className="flex justify-between items-center">
          <Link href="/">
            <h1 className="text-xl font-bold">🌐 Pomodoro Timer</h1>
          </Link>

          <div className="flex md:hidden">
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-white">
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          <div className="hidden md:flex gap-4 items-center">
            <button onClick={() => setDarkMode(!darkMode)} className="hover:scale-110 transition">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {user && (
              <button onClick={() => setShowSettings(true)} className="hover:scale-110 transition">
                <Settings size={20} />
              </button>
            )}

            {user ? (
              <>
                <Link href="/leaderboard" className="hover:underline">🏆 Leaderboard</Link>
                <Link href="/analytics" className="hover:underline">📊 Analytics</Link>
                <button onClick={handleLogout} className="hover:text-red-500">
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <Link href="/login" className="hover:underline flex items-center gap-1">
                <LogIn size={18} /> <span>Login</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="mt-4 flex flex-col gap-3 md:hidden text-sm">
            <button onClick={() => setDarkMode(!darkMode)} className="flex items-center gap-2">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {user && (
              <button
                onClick={() => {
                  setMenuOpen(false)
                  setShowSettings(true)
                }}
                className="flex items-center gap-2"
              >
                <Settings size={18} /> Settings
              </button>
            )}

            {user ? (
              <>
                <Link href="/leaderboard" onClick={() => setMenuOpen(false)}>🏆 Leaderboard</Link>
                <Link href="/analytics" onClick={() => setMenuOpen(false)}>📊 Analytics</Link>
                <button onClick={handleLogout} className="flex items-center gap-2 text-red-400">
                  <LogOut size={18} /> Logout
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-2">
                <LogIn size={18} /> <span>Login</span>
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* Modal Settings - diposisikan di luar navbar dan di atas semua elemen */}
      {showSettings && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="relative bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl w-full max-w-sm text-black dark:text-white animate-fade-in">
            <h2 className="text-xl font-bold mb-4">⚙️ Settings</h2>
            <SettingsForm onClose={() => setShowSettings(false)} />

            {/* Tombol close di pojok kanan atas */}
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
              onClick={() => setShowSettings(false)}
              aria-label="Close Settings"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
