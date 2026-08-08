import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { getTodayUsageCount } from '../lib/usageLogs'
import { DAILY_LIMIT, TIER, getTier } from '../lib/tiers'
import SubscribeBanner from '../components/SubscribeBanner'

const PROVIDER_LABEL = {
  email: '이메일',
  google: 'Google',
  kakao: '카카오',
}

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
        // items-start를 안 주면 grid가 같은 행의 카드 높이를 다 맞춰버려서, 카드 하나만
        // "전체 진단 보기"로 펼쳐도 옆 카드들까지 같이 늘어나 보인다 — 그걸 막기 위한 설정.
        <div className="mt-4 grid grid-cols-1 items-start gap-4 sm:grid-cols-3">
          {savedItems.map((item) => (
            <SavedItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <h2 className="mt-10 font-serif text-lg font-semibold text-cream-text dark:text-night-text">계정 관리</h2>
      <AccountManagement user={user} />
    </div>
  )
}

// 저장 당시 AI가 준 진단 내용(result, jsonb)을 나중에 다시 열어볼 수 있게
// 카드에 이미지 + 제목 + "전체 진단 보기" 토글을 둔다. 상단엔 짧은 정보만 두고,
// 나머지는 토글 안에서 (JSON 원문이 아니라) 읽기 좋게 정리해서 보여준다.
function SavedItemCard({ item }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-3xl border border-cream-border bg-cream-card p-4 dark:border-night-border dark:bg-night-card">
      {item.image_url && (
        <img
          src={item.image_url}
          alt={item.title}
          className="mb-3 aspect-[3/4] w-full rounded-2xl object-cover"
        />
      )}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-cream-text dark:text-night-text">{item.title}</p>
        <Heart size={16} className="text-accent-green" fill="currentColor" />
      </div>
      {(item.season || item.tpo) && (
        <p className="mt-1 text-xs text-cream-subtext dark:text-night-text/60">
          {[item.season, item.tpo].filter(Boolean).join(' · ')}
        </p>
      )}

      {item.result && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="mt-2 text-xs font-medium text-accent-green hover:underline"
          >
            {expanded ? '전체 진단 접기 ▲' : '전체 진단 보기 ▼'}
          </button>
          {expanded && <SavedResultDetail tier={item.tier} result={item.result} />}
        </>
      )}
    </div>
  )
}

// item.result를 JSON 그대로 덤프하지 않고, 티어별 스키마에 맞춰 읽기 좋게 정리해서 보여준다.
function SavedResultDetail({ tier, result }) {
  if (tier === 'premium') {
    return (
      <div className="mt-2 space-y-2 rounded-xl bg-cream-bg p-3 text-xs leading-relaxed text-cream-subtext dark:bg-night-bg dark:text-night-text/70">
        {result.bodyType?.primary && (
          <p>
            <span className="font-semibold text-cream-text dark:text-night-text">체형</span>{' '}
            {result.bodyType.primary} {result.bodyType.primaryPercent}%
            {result.bodyType.secondary && ` / ${result.bodyType.secondary} ${result.bodyType.secondaryPercent}%`}
          </p>
        )}
        {result.moodStyleGuide?.moodKeyword && (
          <p>
            <span className="font-semibold text-cream-text dark:text-night-text">무드</span>{' '}
            {result.moodStyleGuide.moodKeyword}
          </p>
        )}
        {result.summary?.oneLiner && <p className="italic text-cream-text dark:text-night-text">"{result.summary.oneLiner}"</p>}
        {result.summary?.keyFormulas?.length > 0 && (
          <ul className="list-disc space-y-0.5 pl-4">
            {result.summary.keyFormulas.map((formula, i) => (
              <li key={i}>{formula}</li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  // 게스트/로그인 공통 스키마
  return (
    <div className="mt-2 space-y-2 rounded-xl bg-cream-bg p-3 text-xs leading-relaxed text-cream-subtext dark:bg-night-bg dark:text-night-text/70">
      {result.bodyType?.primary && (
        <p>
          <span className="font-semibold text-cream-text dark:text-night-text">체형</span> {result.bodyType.primary}
        </p>
      )}
      {result.basicStyleGuide?.ratioAnalysis && <p>{result.basicStyleGuide.ratioAnalysis}</p>}
      {result.basicStyleGuide?.fitRecommendation && <p>{result.basicStyleGuide.fitRecommendation}</p>}
      {result.basicStyleGuide?.tpoStylingTip && <p>{result.basicStyleGuide.tpoStylingTip}</p>}
      {result.styleTip && <p className="font-medium text-accent-green">{result.styleTip}</p>}
    </div>
  )
}

function AccountManagement({ user }) {
  const navigate = useNavigate()
  const provider = user.app_metadata?.provider ?? 'email'
  const providerLabel = PROVIDER_LABEL[provider] ?? provider
  const joinedAt = new Date(user.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState(null)
  const [passwordError, setPasswordError] = useState(null)

  const [deleteConfirming, setDeleteConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordMessage(null)
    setPasswordError(null)

    if (newPassword.length < 6) {
      setPasswordError('비밀번호는 6자 이상이어야 해요.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('비밀번호가 일치하지 않아요.')
      return
    }

    setPasswordSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordSubmitting(false)

    if (error) {
      setPasswordError('비밀번호 변경에 실패했습니다. 잠시 후 다시 시도해주세요.')
      return
    }
    setPasswordMessage('비밀번호가 변경되었습니다.')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setDeleteError(null)

    // auth.users 삭제는 Edge Function(delete-account)에서 서비스 롤 키로 처리한다.
    // profiles/saved_items/usage_logs/subscriptions는 FK의 on delete cascade로 자동 삭제된다.
    const { error } = await supabase.functions.invoke('delete-account')

    if (error) {
      setDeleting(false)
      setDeleteError('회원탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.')
      return
    }

    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <>
      <section className="mt-4 rounded-3xl border border-cream-border bg-cream-card p-6 dark:border-night-border dark:bg-night-card">
        <h3 className="font-serif text-base font-semibold text-cream-text dark:text-night-text">계정 정보</h3>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-cream-subtext dark:text-night-text/60">이메일</dt>
            <dd className="text-cream-text dark:text-night-text">{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-cream-subtext dark:text-night-text/60">가입 방법</dt>
            <dd className="text-cream-text dark:text-night-text">{providerLabel}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-cream-subtext dark:text-night-text/60">가입일</dt>
            <dd className="text-cream-text dark:text-night-text">{joinedAt}</dd>
          </div>
        </dl>
      </section>

      {provider === 'email' && (
        <section className="mt-4 rounded-3xl border border-cream-border bg-cream-card p-6 dark:border-night-border dark:bg-night-card">
          <h3 className="font-serif text-base font-semibold text-cream-text dark:text-night-text">비밀번호 변경</h3>
          <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3">
            <input
              type="password"
              required
              minLength={6}
              placeholder="새 비밀번호 (6자 이상)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-cream-border bg-cream-bg px-3 py-2 text-sm text-cream-text outline-none focus:border-accent-green dark:border-night-border dark:bg-night-bg dark:text-night-text"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="새 비밀번호 확인"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-cream-border bg-cream-bg px-3 py-2 text-sm text-cream-text outline-none focus:border-accent-green dark:border-night-border dark:bg-night-bg dark:text-night-text"
            />
            <button
              type="submit"
              disabled={passwordSubmitting}
              className="w-full rounded-full bg-accent-green px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {passwordSubmitting ? '변경 중...' : '비밀번호 변경'}
            </button>
            {passwordMessage && <p className="text-xs text-accent-green">{passwordMessage}</p>}
            {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
          </form>
        </section>
      )}

      <section className="mt-4 rounded-3xl border border-red-200 bg-cream-card p-6 dark:border-red-900/40 dark:bg-night-card">
        <h3 className="font-serif text-base font-semibold text-red-500">회원탈퇴</h3>
        <p className="mt-2 text-sm text-cream-subtext dark:text-night-text/70">
          탈퇴하면 저장한 코디, 이용 기록 등 모든 데이터가 즉시 삭제되며 복구할 수 없어요.
        </p>

        {!deleteConfirming ? (
          <button
            type="button"
            onClick={() => setDeleteConfirming(true)}
            className="mt-4 rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/20"
          >
            회원탈퇴
          </button>
        ) : (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-red-500">정말 탈퇴하시겠어요? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? '처리 중...' : '네, 탈퇴할게요'}
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirming(false)}
                disabled={deleting}
                className="rounded-full border border-cream-border px-4 py-2 text-sm text-cream-text dark:border-night-border dark:text-night-text"
              >
                취소
              </button>
            </div>
            {deleteError && <p className="text-xs text-red-500">{deleteError}</p>}
          </div>
        )}
      </section>
    </>
  )
}
