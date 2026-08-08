export default function ProgressBar({ step, total }) {
  const percent = Math.round((step / total) * 100);

  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between">
        <span className="eyebrow">Style Survey</span>
        <span className="text-sm font-medium text-text-secondary">
          {step}/{total}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-subtle">
        <div
          className="h-full rounded-full bg-accent-green transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
