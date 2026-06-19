import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      '❌ Supabase 환경변수가 없습니다. .env.local.example을 참고해 .env.local을 만들어주세요.'
    )
  }

  return createBrowserClient<Database>(url, key)
}
