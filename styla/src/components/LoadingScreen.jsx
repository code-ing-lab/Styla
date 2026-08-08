import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

const LOADING_MESSAGES = [
  'AI가 체형 데이터를 분석하고 있어요...',
  '어울리는 실루엣과 컬러를 찾는 중이에요...',
  '트렌드를 반영해서 코디를 구성하고 있어요...',
  '이미지를 그리고 있어요, 조금만 기다려주세요...',
]

// 게스트/로그인/프리미엄 전 티어 공통 로딩 화면. 심심하지 않게 문구를 몇 초마다 바꿔준다.
export default function LoadingScreen() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % LOADING_MESSAGES.length)
    }, 2200)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl border border-cream-border bg-cream-card px-8 py-16 text-center shadow-sm dark:border-night-border dark:bg-night-card">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green/30" />
        <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-accent-green/10 text-accent-green">
          <Sparkles size={22} className="animate-pulse" />
        </span>
      </div>
      <p className="font-serif text-lg font-semibold text-cream-text dark:text-night-text">AI 코디 분석 중</p>
      <p className="min-h-[1.25rem] text-sm text-cream-subtext dark:text-night-text/70">{LOADING_MESSAGES[index]}</p>
      <div className="flex gap-1.5">
        {LOADING_MESSAGES.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              i === index ? 'bg-accent-green' : 'bg-cream-border dark:bg-night-border'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
