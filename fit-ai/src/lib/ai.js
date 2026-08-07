import { supabase } from './supabaseClient'

// supabase/functions/generate-recommendation를 호출한다.
// 실제 티어 판별은 서버(Edge Function)에서 Authorization 헤더 기준으로 다시 검증하므로
// 여기서는 입력값만 전달한다.
export async function requestRecommendation(formValues) {
  const { data, error } = await supabase.functions.invoke('generate-recommendation', {
    body: formValues,
  })

  if (error) throw error
  return data
}
