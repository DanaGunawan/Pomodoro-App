'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  onClose: () => void
}

export default function SettingsForm({ onClose }: Props) {
  const [focusDuration, setFocusDuration] = useState(25)
  const [breakDuration, setBreakDuration] = useState(5)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setFocusDuration(data.focus_duration / 60)
        setBreakDuration(data.break_duration / 60)
      }
    }
    loadSettings()
  }, [])

  const handleSave = async () => {
    if (!userId) return
    setLoading(true)
    setMessage('')

    const updates = {
      id: userId,
      focus_duration: focusDuration * 60,
      break_duration: breakDuration * 60,
    }

    
    const { error } = await supabase
  .from('user_settings')
  .upsert([updates], { onConflict: 'id' })

   if (error) {
  setMessage('❌ Failed to save settings')
} else {
  setMessage('✅ Settings saved!')
  setTimeout(() => {
    onClose()
    window.location.reload()
  }, 1000)
}
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-4">
        <label className="block mb-1">Focus Duration (minutes)</label>
        <input
          type="number"
          min={1}
          value={focusDuration}
          onChange={e => setFocusDuration(Number(e.target.value))}
          className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800 border dark:border-gray-700"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1">Break Duration (minutes)</label>
        <input
          type="number"
          min={1}
          value={breakDuration}
          onChange={e => setBreakDuration(Number(e.target.value))}
          className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800 border dark:border-gray-700"
        />
      </div>

      {message && <p className="text-sm mb-2">{message}</p>}

      <div className="flex justify-between">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          Cancel
        </button>
      </div>
    </div>
  )
}
