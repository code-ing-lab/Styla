import { supabase } from './supabaseClient'

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

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

export async function incrementTodayUsage(userId) {
  const current = await getTodayUsageCount(userId)

  const { error } = await supabase
    .from('usage_logs')
    .upsert(
      { user_id: userId, usage_date: todayString(), count: current + 1 },
      { onConflict: 'user_id,usage_date' }
    )

  if (error) throw error
  return current + 1
}
