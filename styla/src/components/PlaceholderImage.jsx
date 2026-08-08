// TODO: gpt-image-1-mini로 실제 플랫레이 이미지 생성 후 교체
export default function PlaceholderImage({ label, className = "" }) {
  return (
    <div
      className={`flex aspect-[4/5] w-full items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-black/5 dark:bg-white/5 ${className}`}
    >
      <span className="px-2 text-center text-xs text-text-secondary">
        {label ?? "이미지 준비 중"}
      </span>
    </div>
  );
}
