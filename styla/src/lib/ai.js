import { supabase } from './supabaseClient'

export class LimitExceededError extends Error {}

// supabase/functions/generate-recommendation를 호출한다.
// 실제 티어 판별과 하루 이용 한도 체크는 서버(Edge Function)에서 다시 검증하므로
// (클라이언트 사전 체크는 UX용일 뿐 실제 강제력은 없음) 여기서는 입력값만 전달한다.
export async function requestRecommendation(formValues) {
  const { data, error } = await supabase.functions.invoke('generate-recommendation', {
    body: formValues,
  })

  if (error) {
    if (error.context?.status === 429) {
      throw new LimitExceededError('오늘의 이용 횟수를 모두 사용했습니다.')
    }
    throw error
  }
  return data
}
