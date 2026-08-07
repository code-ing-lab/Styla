import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // .env에 VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY가 설정되기 전까지는
  // 개발 서버가 죽지 않도록 더미 값으로 폴백한다. (Auth/DB 호출은 실패하지만 앱은 렌더된다.)
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY가 설정되지 않았습니다. .env를 채워주세요.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)
