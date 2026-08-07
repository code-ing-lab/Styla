import { useEffect, useRef, useState } from 'react'
import StyleQuiz from '../components/StyleQuiz'
import RecommendForm from '../components/RecommendForm'
import ResultView from '../components/ResultView'
import LimitModal from '../components/LimitModal'
import SubscribeBanner from '../components/SubscribeBanner'
import { useAuth } from '../context/AuthContext'
import { getTier, TIER, DAILY_LIMIT } from '../lib/tiers'
import { getGuestUsageCount, incrementGuestUsage } from '../lib/guestUsage'
import { getTodayUsageCount, incrementTodayUsage } from '../lib/usageLogs'
import { requestRecommendation } from '../lib/ai'
import { supabase } from '../lib/supabaseClient'

export default function Home() {
  const { isLoggedIn, isPremium, user, loading: authLoading } = useAuth()
  const tier = getTier({ isLoggedIn, isPremium })

  // step은 authLoading이 끝나기 전엔 알 수 없으므로 null로 시작한다.
  // (OAuth 로그인 리디렉션 직후에는 세션 반영이 살짝 늦게 끝날 수 있어서,
  //  isLoggedIn을 useState 초기값으로 바로 써버리면 로그인 상태인데도
  //  게스트용 스타일 테스트 화면이 뜨는 문제가 생긴다.)
  const [step, setStep] = useState(null)
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [savedIndexes, setSavedIndexes] = useState(new Set())
  const prevIsLoggedIn = useRef(null)

  // 로그인/로그아웃으로 티어가 바뀌면 그 티어의 기본 화면으로 되돌린다.
  useEffect(() => {
    if (authLoading) return
    if (step === null || prevIsLoggedIn.current !== isLoggedIn) {
      setStep(isLoggedIn ? 'form' : 'quiz')
      prevIsLoggedIn.current = isLoggedIn
    }
  }, [authLoading, isLoggedIn, step])

  if (authLoading || step === null) {
    return <p className="py-24 text-center text-sm text-cream-subtext dark:text-night-text/60">불러오는 중...</p>
  }

  const handleQuizComplete = () => setStep('form')

  const handleSubmit = async (values) => {
    setError(null)

    // 일일 한도 체크
    if (tier === TIER.GUEST) {
      if (getGuestUsageCount() >= DAILY_LIMIT[TIER.GUEST]) {
        setShowLimitModal(true)
        return
      }
    } else {
      const count = await getTodayUsageCount(user.id).catch(() => 0)
      if (count >= DAILY_LIMIT[tier]) {
        if (tier === TIER.MEMBER) {
          setShowLimitModal(true)
        } else {
          setError('오늘의 프리미엄 이용 횟수를 모두 사용했습니다. 내일 다시 시도해주세요.')
        }
        return
      }
    }

    setSubmitting(true)
    try {
      const data = await requestRecommendation(values)
      setResult(data)
      setSavedIndexes(new Set())
      setStep('result')

      if (tier === TIER.GUEST) {
        incrementGuestUsage()
      } else {
        await incrementTodayUsage(user.id)
      }
    } catch (err) {
      console.error(err)
      setError('AI 추천 생성에 실패했습니다. Supabase Edge Function 연동 설정을 확인해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleSave = async (index) => {
    const item = result?.items?.[index]
    if (!item) return

    const next = new Set(savedIndexes)
    const alreadySaved = next.has(index)

    try {
      if (!alreadySaved) {
        await supabase.from('saved_items').insert({
          user_id: user.id,
          title: item.keywords?.join(' · ') ?? '저장된 코디',
          description: item.shortDescription,
          tags: item.keywords ?? [],
          image_url: null,
        })
        next.add(index)
      } else {
        next.delete(index)
      }
      setSavedIndexes(next)
    } catch (err) {
      console.error('저장 실패:', err)
    }
  }

  return (
    <div className="px-6 py-12">
      {step === 'quiz' && <StyleQuiz onComplete={handleQuizComplete} />}

      {step === 'form' && (
        <RecommendForm tier={tier} onSubmit={handleSubmit} submitting={submitting} />
      )}

      {step === 'result' && (
        <div className="space-y-8">
          <ResultView tier={tier} result={result} savedIndexes={savedIndexes} onToggleSave={handleToggleSave} />
          {tier === TIER.MEMBER && <SubscribeBanner />}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setStep('form')}
              className="text-sm text-cream-subtext underline underline-offset-4 hover:text-cream-text dark:text-night-text/60 dark:hover:text-night-text"
            >
              다시 추천받기
            </button>
          </div>
        </div>
      )}

      {error && <p className="mx-auto mt-4 max-w-md text-center text-sm text-red-500">{error}</p>}

      <LimitModal
        open={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        title={tier === TIER.GUEST ? '오늘의 무료 추천을 모두 사용했어요' : '오늘의 이용 횟수를 모두 사용했어요'}
        description={
          tier === TIER.GUEST
            ? '로그인하면 하루 3회까지 코디 추천을 받고, 마음에 드는 코디를 저장할 수 있어요.'
            : '프리미엄으로 업그레이드하면 사진 분석과 심화 스타일 리포트를 받아볼 수 있어요.'
        }
        ctaLabel={tier === TIER.GUEST ? '로그인하기' : '프리미엄 구독하기'}
        ctaTo={tier === TIER.GUEST ? '/login' : '/subscribe'}
      />
    </div>
  )
}
