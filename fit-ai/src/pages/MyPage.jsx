import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { getTodayUsageCount } from '../lib/usageLogs'
import { DAILY_LIMIT, TIER, getTier } from '../lib/tiers'
import SubscribeBanner from '../components/SubscribeBanner'

export default function MyPage() {
  const navigate = useNavigate()
  const { isLoggedIn, isPremium, user, loading: authLoading } = useAuth()
  const tier = getTier({ isLoggedIn, isPremium })

  const [savedItems, setSavedItems] = useState([])
  const [usageCount, setUsageCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!isLoggedIn) {
      navigate('/login')
      return
    }

    let cancelled = false

    Promise.all([
      supabase.from('saved_items').select('*').eq('user_id', user.id).order('saved_at', { ascending: false }),
      getTodayUsageCount(user.id).catch(() => 0),
    ]).then(([savedRes, count]) => {
      if (cancelled) return
      setSavedItems(savedRes.data ?? [])
      setUsageCount(count)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [authLoading, isLoggedIn, user, navigate])

  if (authLoading || loading) {
    return <p className="py-24 text-center text-sm text-cream-subtext dark:text-night-text/60">불러오는 중...</p>
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-serif text-2xl font-semibold text-cream-text dark:text-night-text">마이페이지</h1>

      <div className="mt-4 rounded-3xl border border-cream-border bg-cream-card p-6 dark:border-night-border dark:bg-night-card">
        <p className="text-sm text-cream-subtext dark:text-night-text/70">오늘 사용 횟수</p>
        <p className="mt-1 font-serif text-2xl font-semibold text-cream-text dark:text-night-text">
          {usageCount} / {DAILY_LIMIT[tier]}
        </p>
        {/* TODO: 추후 리텐션 장치 추가 (연속 접속 보너스 등) */}
      </div>

      {tier === TIER.MEMBER && (
        <div className="mt-6">
          <SubscribeBanner />
        </div>
      )}

      <h2 className="mt-10 font-serif text-lg font-semibold text-cream-text dark:text-night-text">저장한 코디</h2>
      {savedItems.length === 0 ? (
        <p className="mt-3 text-sm text-cream-subtext dark:text-night-text/60">아직 저장한 코디가 없어요.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {savedItems.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-cream-border bg-cream-card p-4 dark:border-night-border dark:bg-night-card"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-cream-text dark:text-night-text">{item.title}</p>
                <Heart size={16} className="text-accent-green" fill="currentColor" />
              </div>
              <p className="mt-2 text-xs text-cream-subtext dark:text-night-text/70">{item.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
