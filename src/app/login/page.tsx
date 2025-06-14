'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) router.push('/')
    else alert(error.message)
  }

  return (
    <div className="max-w-md mx-auto flex items-center justify-center px-4 ">
      <div className="glass p-8 w-full max-w-md rounded-xl border border-white/10 shadow-lg backdrop-blur-lg">
        <h2 className="text-2xl font-bold text-white text-center mb-6">Sign In</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full p-3 mb-4 bg-white/10 text-white placeholder-gray-300 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full p-3 mb-6 bg-white/10 text-white placeholder-gray-300 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleLogin}
          className="w-full py-3 bg-green-600 hover:bg-green-700 transition text-white font-semibold rounded-md"
        >
          Login
        </button>

        <p className="text-center text-sm text-gray-400 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-blue-400 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}
