import { useState } from 'react'
import { Wrench, X } from 'lucide-react'
import { TIER } from '../lib/tiers'

// ⚠️ 개발자 테스트 전용 임시 컴포넌트. 실제 API 호출/이용 한도 없이 목업 데이터로
// 티어별 결과 화면(ResultView)을 미리 볼 수 있게 해준다. 테스트 끝나면
// - 이 파일
// - src/lib/devMockResults.js
// - Home.jsx에서 이 컴포넌트를 렌더링/사용하는 부분(DevPreviewPanel import, devTier state, onPreview 핸들러)
// 를 지우면 깨끗하게 제거된다(CLAUDE.md에도 안내해둠).
const TIER_LABEL = {
  [TIER.GUEST]: '게스트',
  [TIER.MEMBER]: '로그인',
  [TIER.PREMIUM]: '프리미엄',
}

export default function DevPreviewPanel({ onPreview, onExitPreview, previewTier }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open && (
        <div className="mb-2 w-56 rounded-2xl border border-cream-border bg-cream-card p-3 shadow-lg dark:border-night-border dark:bg-night-card">
          <p className="mb-2 text-xs font-semibold text-cream-subtext dark:text-night-text/60">
            🔧 개발자 전용 · 목업 미리보기
          </p>
          <div className="flex flex-col gap-1.5">
            {Object.values(TIER).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onPreview(t)}
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
          {previewTier && (
            <button
              type="button"
              onClick={onExitPreview}
              className="mt-2 w-full rounded-full border border-cream-border px-3 py-1.5 text-xs text-cream-subtext hover:text-cream-text dark:border-night-border dark:text-night-text/60"
            >
              미리보기 종료
            </button>
          )}
          <p className="mt-2 text-[10px] leading-relaxed text-cream-subtext/70 dark:text-night-text/50">
            실제 API 호출·이용 한도 없이 목업 데이터로만 화면을 보여줘요.
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
