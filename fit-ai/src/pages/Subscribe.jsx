import { Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  '하루 5회 코디 추천',
  '사진 업로드 기반 체형 분석',
  '퍼스널컬러 · 얼굴형 맞춤 추천',
  '구조화된 심화 스타일 리포트 4종',
  '보완 스타일 · 디테일 가이드',
]

export default function Subscribe() {
  const { isPremium } = useAuth()

  const handleSubscribe = () => {
    // TODO: PG 연동
    alert('결제 연동은 준비 중입니다.')
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <p className="font-serif text-sm font-semibold text-accent-gold">STYLA PREMIUM</p>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-cream-text dark:text-night-text">
        사진 분석 · 심화 리포트
      </h1>
      <p className="mt-3 text-sm text-cream-subtext dark:text-night-text/70">
        횟수보다 중요한 건 깊이예요. 내 체형과 분위기를 정밀하게 분석한 리포트를 받아보세요.
      </p>

      <div className="mt-8 rounded-3xl border border-accent-gold/40 bg-cream-card p-6 text-left dark:border-accent-gold/30 dark:bg-night-card">
        <ul className="space-y-3">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-cream-text dark:text-night-text">
              <Check size={16} className="mt-0.5 shrink-0 text-accent-green" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={handleSubscribe}
        disabled={isPremium}
        className="mt-8 w-full rounded-full bg-accent-green px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPremium ? '이미 구독 중이에요' : '구독하기'}
      </button>
    </div>
  )
}
