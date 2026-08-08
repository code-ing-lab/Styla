import { Heart, Star } from 'lucide-react'
import PlaceholderImage from './PlaceholderImage'
import { TIER } from '../lib/tiers'

// AI가 생성한 이미지가 있으면 그대로 보여주고, 없으면(생성 실패/미연동 등) 플레이스홀더로 대체한다.
function ResultImage({ src, alt, className }) {
  if (!src) return <PlaceholderImage className={className} />
  return <img src={src} alt={alt} className={`rounded-2xl object-cover ${className}`} />
}

function SaveButton({ saved, onToggleSave }) {
  if (!onToggleSave) return null
  return (
    <button
      type="button"
      onClick={onToggleSave}
      aria-label="코디 저장"
      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-accent-green shadow dark:bg-night-card/90"
    >
      <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
    </button>
  )
}

export default function ResultView({ tier, result, saved = false, onToggleSave }) {
  if (!result) return null

  if (tier === TIER.GUEST) return <GuestResult result={result} />
  if (tier === TIER.MEMBER) return <MemberResult result={result} saved={saved} onToggleSave={onToggleSave} />
  return <PremiumResult result={result} saved={saved} onToggleSave={onToggleSave} />
}

function GuestResult({ result }) {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-cream-border bg-cream-card p-6 shadow-sm dark:border-night-border dark:bg-night-card">
      <ResultImage src={result.images?.[0]} alt="AI 코디 추천" className="aspect-[3/4] w-full" />
      <p className="mt-4 text-sm leading-relaxed text-cream-text dark:text-night-text">{result.description}</p>
    </div>
  )
}

// 로그인 무료 티어: 이미지 1장 + 매거진/블로그 스타일의 짧은 리포트
function MemberResult({ result, saved, onToggleSave }) {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-cream-border bg-cream-card p-6 shadow-sm dark:border-night-border dark:bg-night-card">
      <div className="relative">
        <ResultImage src={result.images?.[0]} alt={result.title} className="aspect-[3/4] w-full" />
        <SaveButton saved={saved} onToggleSave={onToggleSave} />
      </div>

      <h2 className="mt-4 font-serif text-xl font-semibold text-cream-text dark:text-night-text">{result.title}</h2>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {result.keywords?.map((kw) => (
          <span key={kw} className="rounded-full bg-accent-green/10 px-2 py-0.5 text-xs text-accent-green">
            #{kw}
          </span>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {result.paragraphs?.map((paragraph, i) => (
          <p key={i} className="text-sm leading-relaxed text-cream-text dark:text-night-text">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  )
}

function PremiumResult({ result, saved, onToggleSave }) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative mx-auto max-w-sm">
        <ResultImage src={result.images?.[0]} alt="AI 코디 추천" className="aspect-[3/4] w-full" />
        <SaveButton saved={saved} onToggleSave={onToggleSave} />
      </div>

      <div className="mt-8 rounded-3xl border border-accent-gold/40 bg-cream-card p-6 dark:border-accent-gold/30 dark:bg-night-card">
        <SectionTitle index={1} title="체형 분석 요약" />
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <p className="font-serif text-2xl font-semibold text-cream-text dark:text-night-text">
            {result.bodyType?.primary} {result.bodyType?.primaryPercent}%
            <span className="ml-2 text-base font-normal text-cream-subtext dark:text-night-text/60">
              / {result.bodyType?.secondary} {result.bodyType?.secondaryPercent}%
            </span>
          </p>
          <div className="flex items-center gap-1 text-accent-gold">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={16} fill={i < Math.round(result.confidence ?? 0) ? 'currentColor' : 'none'} />
            ))}
            <span className="ml-1 text-xs text-cream-subtext dark:text-night-text/60">신뢰도 {result.confidence}</span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {result.keywords?.map((kw) => (
            <span key={kw} className="rounded-full bg-accent-green/10 px-3 py-1 text-xs text-accent-green">
              #{kw}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-cream-border bg-cream-card p-6 dark:border-night-border dark:bg-night-card">
        <SectionTitle index={2} title="보완 스타일 가이드" />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {['top', 'bottom', 'dress', 'outer'].map((key) => (
            <GuideCard key={key} label={GUIDE_LABEL[key]} data={result.styleGuide?.[key]} />
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-cream-border bg-cream-card p-6 dark:border-night-border dark:bg-night-card">
        <SectionTitle index={3} title="디테일 가이드" />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {['neckline', 'sleeve', 'waistDetail', 'length'].map((key) => (
            <GuideCard key={key} label={DETAIL_LABEL[key]} data={result.detailGuide?.[key]} />
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-accent-green/30 bg-accent-green/5 p-6">
        <SectionTitle index={4} title="최종 요약" />
        <p className="mt-3 font-serif text-lg font-medium text-cream-text dark:text-night-text">
          {result.summary?.oneLiner}
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-cream-subtext dark:text-night-text/70">
          {result.summary?.keyFormulas?.map((formula, i) => (
            <li key={i}>{formula}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const GUIDE_LABEL = { top: '상의', bottom: '하의', dress: '원피스', outer: '아우터' }
const DETAIL_LABEL = { neckline: '넥라인', sleeve: '소매', waistDetail: '허리 디테일', length: '기장' }

function GuideCard({ label, data }) {
  if (!data) return null
  return (
    <div className="rounded-2xl border border-cream-border p-4 dark:border-night-border">
      <p className="font-serif text-sm font-semibold text-cream-text dark:text-night-text">{label}</p>
      <p className="mt-2 text-xs font-medium text-accent-green">추천: {data.recommended?.join(', ') || '-'}</p>
      <p className="mt-1 text-xs font-medium text-cream-subtext dark:text-night-text/60">
        비추천: {data.avoid?.join(', ') || '-'}
      </p>
      <p className="mt-2 text-xs text-cream-subtext dark:text-night-text/70">{data.reason}</p>
    </div>
  )
}

function SectionTitle({ index, title }) {
  return (
    <h3 className="font-serif text-lg font-semibold text-cream-text dark:text-night-text">
      <span className="text-accent-gold">0{index}</span> {title}
    </h3>
  )
}
