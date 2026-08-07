import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export default function SubscribeBanner({ message = '사진 분석과 심화 리포트, 하루 5회까지 이용하고 싶다면?' }) {
  return (
    <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 rounded-3xl border border-accent-gold/40 bg-accent-gold/5 px-6 py-4">
      <div className="flex items-center gap-3">
        <Sparkles size={20} className="text-accent-gold" />
        <div>
          <p className="font-serif text-sm font-semibold text-cream-text dark:text-night-text">Styla 프리미엄</p>
          <p className="text-xs text-cream-subtext dark:text-night-text/70">{message}</p>
        </div>
      </div>
      <Link
        to="/subscribe"
        className="shrink-0 rounded-full bg-accent-gold px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
      >
        구독하기
      </Link>
    </div>
  )
}
