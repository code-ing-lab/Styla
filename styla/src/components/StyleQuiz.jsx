import { useState } from 'react'
import { Share2 } from 'lucide-react'

const QUESTIONS = [
  {
    question: '선호하는 컬러 톤은?',
    options: [
      { label: '뉴트럴 · 무채색', type: 'minimal' },
      { label: '파스텔 톤', type: 'romantic' },
      { label: '비비드 컬러', type: 'casual' },
      { label: '블랙 · 딥톤', type: 'chic' },
    ],
  },
  {
    question: '좋아하는 실루엣은?',
    options: [
      { label: '심플 · 스트레이트', type: 'minimal' },
      { label: '러플 · 플레어', type: 'romantic' },
      { label: '오버사이즈 · 루즈', type: 'casual' },
      { label: '슬림 · 핏' , type: 'chic' },
    ],
  },
  {
    question: '원하는 분위기는?',
    options: [
      { label: '깔끔함', type: 'minimal' },
      { label: '우아함', type: 'romantic' },
      { label: '편안함', type: 'casual' },
      { label: '세련됨', type: 'chic' },
    ],
  },
  {
    question: '선호하는 액세서리는?',
    options: [
      { label: '미니멀 주얼리', type: 'minimal' },
      { label: '러블리 디테일', type: 'romantic' },
      { label: '실용적인 아이템', type: 'casual' },
      { label: '볼드한 아이템', type: 'chic' },
    ],
  },
]

const STYLE_TYPES = {
  minimal: {
    name: '미니멀리스트',
    description: '군더더기 없는 라인과 절제된 컬러로 완성하는 담백한 스타일을 선호해요.',
    hashtags: ['#미니멀', '#클린룩', '#뉴트럴톤'],
  },
  romantic: {
    name: '로맨틱 무드',
    description: '부드러운 실루엣과 디테일로 우아하고 여성스러운 분위기를 좋아해요.',
    hashtags: ['#로맨틱', '#러블리', '#파스텔톤'],
  },
  casual: {
    name: '캐주얼 이지룩',
    description: '편안하면서도 센스있는 밸런스를 중요하게 생각하는 타입이에요.',
    hashtags: ['#캐주얼', '#이지룩', '#데일리'],
  },
  chic: {
    name: '시크 앤 모던',
    description: '슬림한 핏과 딥톤 컬러로 세련되고 도시적인 무드를 추구해요.',
    hashtags: ['#시크', '#모던룩', '#블랙톤'],
  },
}

export default function StyleQuiz({ onComplete }) {
  const [step, setStep] = useState(0)
  const [scores, setScores] = useState({ minimal: 0, romantic: 0, casual: 0, chic: 0 })
  const [resultType, setResultType] = useState(null)

  const handleAnswer = (type) => {
    const nextScores = { ...scores, [type]: scores[type] + 1 }
    setScores(nextScores)

    if (step + 1 < QUESTIONS.length) {
      setStep(step + 1)
    } else {
      const top = Object.entries(nextScores).sort((a, b) => b[1] - a[1])[0][0]
      setResultType(top)
    }
  }

  const handleShare = async () => {
    const shareText = `저는 ${STYLE_TYPES[resultType].name} 타입이에요! Styla에서 내 스타일 유형을 확인해보세요.`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Styla 스타일 테스트', text: shareText, url: window.location.href })
      } catch {
        // 사용자가 공유를 취소한 경우 등은 무시
      }
    } else {
      await navigator.clipboard.writeText(shareText)
      alert('공유 문구가 클립보드에 복사되었습니다.')
    }
  }

  if (resultType) {
    const style = STYLE_TYPES[resultType]
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-cream-border bg-cream-card p-8 text-center shadow-sm dark:border-night-border dark:bg-night-card">
        <p className="font-serif text-sm text-cream-subtext dark:text-night-text/70">당신의 스타일 유형은</p>
        <h2 className="mt-2 font-serif text-3xl font-semibold text-cream-text dark:text-night-text">
          {style.name}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-cream-subtext dark:text-night-text/70">
          {style.description}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {style.hashtags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-accent-green/10 px-3 py-1 text-xs font-medium text-accent-green dark:text-accent-green/80"
            >
              {tag}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={handleShare}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-cream-border px-4 py-2 text-sm text-cream-text hover:bg-cream-bg dark:border-night-border dark:text-night-text dark:hover:bg-night-bg"
        >
          <Share2 size={16} /> 결과 공유하기
        </button>
        <button
          type="button"
          onClick={() => onComplete(resultType)}
          className="mt-4 block w-full rounded-full bg-accent-green px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          AI 코디 추천 받아보기
        </button>
      </div>
    )
  }

  const current = QUESTIONS[step]

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-cream-border bg-cream-card p-8 shadow-sm dark:border-night-border dark:bg-night-card">
      <p className="text-xs font-medium text-cream-subtext dark:text-night-text/60">
        {step + 1} / {QUESTIONS.length}
      </p>
      <h2 className="mt-2 font-serif text-xl font-semibold text-cream-text dark:text-night-text">
        {current.question}
      </h2>
      <div className="mt-6 flex flex-col gap-3">
        {current.options.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => handleAnswer(option.type)}
            className="rounded-2xl border border-cream-border px-4 py-3 text-left text-sm text-cream-text transition-colors hover:border-accent-green hover:bg-accent-green/5 dark:border-night-border dark:text-night-text dark:hover:border-accent-green"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
