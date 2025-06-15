// ✅ Ini untuk server-side / backend only
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, // atau bisa pakai proses.env.SUPABASE_URL
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
