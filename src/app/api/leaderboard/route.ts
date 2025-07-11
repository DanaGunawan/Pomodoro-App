// ✅ Server-side API route
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 🛡️ Aman karena ini hanya di server
)

export async function GET() {
  const { data, error } = await supabaseAdmin.rpc('get_leaderboard')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
