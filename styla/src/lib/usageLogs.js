import { supabase } from './supabaseClient'

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

// 조회만 클라이언트에서 가능 (RLS: select만 허용).
// 실제 한도 체크·증가는 generate-recommendation Edge Function이 서비스 롤로 처리한다
// (클라이언트가 직접 쓰기 권한을 가지면 본인 한도를 마음대로 조작할 수 있기 때문).
export async function getTodayUsageCount(userId) {
  const { data, error } = await supabase
    .from('usage_logs')
    .select('count')
    .eq('user_id', userId)
    .eq('usage_date', todayString())
    .maybeSingle()

  if (error) throw error
  return data?.count ?? 0
}
