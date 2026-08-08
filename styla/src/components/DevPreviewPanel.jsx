import { useState } from 'react'
import { Wrench, X } from 'lucide-react'
import { TIER } from '../lib/tiers'

// ⚠️ 개발자 테스트 전용 임시 컴포넌트.
// - "결과 화면 미리보기": 실제 API 호출/이용 한도 없이 목업 데이터로 티어별 결과 화면만 확인.
// - "조건 입력해서 실제 생성": 폼으로 이동해서 실제로 값을 입력하고 진짜 API를 호출해볼 수 있음
//   (사진 포함). 실제 호출이라 이용 한도가 걸리는데, Edge Function의 DEV_BYPASS_EMAIL 계정으로
//   로그인한 상태에서만 한도가 면제된다 — 설정 안 했으면 이 버튼을 눌러도 일반 사용자와 동일하게
//   한도 체크가 걸린다(supabase secrets set DEV_BYPASS_EMAIL=본인이메일로 등록).
// 테스트 끝나면
// - 이 파일
// - src/lib/devMockResults.js
// - Home.jsx에서 이 컴포넌트를 렌더링/사용하는 부분(DevPreviewPanel import, devTier state,
//   handleDevMockPreview/handleDevFormPreview/handleExitDevPreview, RecommendForm/handleSubmit의
//   devTier 분기)
// - Edge Function의 DEV_BYPASS_EMAIL 관련 코드(generate-recommendation/index.ts)
// 를 지우고 `supabase secrets unset DEV_BYPASS_EMAIL`까지 하면 깨끗하게 제거된다(CLAUDE.md 참고).
const TIER_LABEL = {
  [TIER.GUEST]: '게스트',
  [TIER.MEMBER]: '로그인',
  [TIER.PREMIUM]: '프리미엄',
}

export default function DevPreviewPanel({ onMockPreview, onFormPreview, onExitPreview, previewTier }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open && (
        <div className="mb-2 w-64 rounded-2xl border border-cream-border bg-cream-card p-3 shadow-lg dark:border-night-border dark:bg-night-card">
          <p className="mb-2 text-xs font-semibold text-cream-subtext dark:text-night-text/60">🔧 개발자 전용</p>

          <p className="mb-1 text-[10px] font-medium text-cream-subtext/80 dark:text-night-text/50">결과 화면 미리보기 (목업)</p>
          <div className="flex flex-col gap-1.5">
            {Object.values(TIER).map((t) => (
              <button
                key={`mock-${t}`}
                type="button"
                onClick={() => onMockPreview(t)}
                className={`rounded-full border px-3 py-1.5 text-left text-xs transition-colors ${
                  previewTier === t
                    ? 'border-accent-green bg-accent-green/10 text-accent-green'
                    : 'border-cream-border text-cream-text hover:border-accent-green dark:border-night-border dark:text-night-text'
                }`}
              >
                {TIER_LABEL[t]} 결과 미리보기
              </button>
            ))}
          </div>

          <p className="mb-1 mt-3 text-[10px] font-medium text-cream-subtext/80 dark:text-night-text/50">
            조건 입력해서 실제 생성
          </p>
          <div className="flex flex-col gap-1.5">
            {Object.values(TIER).map((t) => (
              <button
                key={`form-${t}`}
                type="button"
                onClick={() => onFormPreview(t)}
                className="rounded-full border border-cream-border px-3 py-1.5 text-left text-xs text-cream-text transition-colors hover:border-accent-gold dark:border-night-border dark:text-night-text"
              >
                {TIER_LABEL[t]} 폼으로 실제 생성
              </button>
            ))}
          </div>

          {previewTier && (
            <button
              type="button"
              onClick={onExitPreview}
              className="mt-3 w-full rounded-full border border-cream-border px-3 py-1.5 text-xs text-cream-subtext hover:text-cream-text dark:border-night-border dark:text-night-text/60"
            >
              미리보기 종료
            </button>
          )}
          <p className="mt-2 text-[10px] leading-relaxed text-cream-subtext/70 dark:text-night-text/50">
            "실제 생성"은 진짜 OpenAI를 호출해요 — DEV_BYPASS_EMAIL 계정 로그인 상태에서만 이용
            한도가 면제됩니다.
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="개발자 미리보기 패널"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-text text-white shadow-lg hover:opacity-90 dark:bg-night-text dark:text-night-bg"
      >
        {open ? <X size={16} /> : <Wrench size={16} />}
      </button>
    </div>
  )
}
