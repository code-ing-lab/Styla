import { ImageIcon } from 'lucide-react'

// TODO: 실제 코디 이미지 생성/소싱 연동 전까지 사용하는 플레이스홀더
export default function PlaceholderImage({ className = '' }) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl border border-cream-border bg-gradient-to-br from-cream-bg to-cream-border/40 text-cream-subtext dark:border-night-border dark:from-night-bg dark:to-night-border/40 dark:text-night-text/50 ${className}`}
    >
      <ImageIcon size={28} strokeWidth={1.5} />
    </div>
  )
}
