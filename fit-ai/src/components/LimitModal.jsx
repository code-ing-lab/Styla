import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'

export default function LimitModal({ open, onClose, title, description, ctaLabel, ctaTo }) {
  const navigate = useNavigate()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-sm rounded-3xl border border-cream-border bg-cream-card p-8 text-center shadow-lg dark:border-night-border dark:bg-night-card">
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-4 top-4 text-cream-subtext hover:text-cream-text dark:text-night-text/60 dark:hover:text-night-text"
        >
          <X size={18} />
        </button>
        <h3 className="font-serif text-xl font-semibold text-cream-text dark:text-night-text">{title}</h3>
        <p className="mt-3 text-sm text-cream-subtext dark:text-night-text/70">{description}</p>
        <button
          type="button"
          onClick={() => navigate(ctaTo)}
          className="mt-6 w-full rounded-full bg-accent-green px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  )
}
