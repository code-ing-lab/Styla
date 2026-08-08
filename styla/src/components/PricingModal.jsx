import { useNavigate } from "react-router-dom";
import { TIERS } from "../lib/tiers.js";
import { useApp } from "../context/AppContext.jsx";

export default function PricingModal({ open, onClose }) {
  const navigate = useNavigate();
  const { setSelectedTier } = useApp();

  if (!open) return null;

  const handleSelect = (tierId) => {
    setSelectedTier(tierId);
    navigate("/checkout");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
      <div className="relative w-full max-w-3xl rounded-3xl border border-border-subtle bg-surface-card p-6 sm:p-10">
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-black/5 hover:text-text-primary dark:hover:bg-white/10"
        >
          ✕
        </button>

        <div className="mb-8 text-center">
          <span className="eyebrow">Choose Your Plan</span>
          <h2 className="mt-2 font-report-title text-2xl font-semibold sm:text-3xl">
            요금제를 선택해주세요
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative flex flex-col rounded-3xl border p-6 ${
                tier.badge
                  ? "border-accent-gold shadow-lg shadow-accent-gold/10"
                  : "border-border-subtle"
              }`}
            >
              {tier.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent-gold px-3 py-1 text-xs font-semibold text-white">
                  {tier.badge}
                </span>
              )}

              <h3 className="font-report-title text-lg font-semibold text-text-primary">
                {tier.name}
              </h3>
              <p className="mt-2 text-2xl font-bold text-text-primary">
                {tier.price.toLocaleString()}원
              </p>

              <ul className="mt-4 flex-1 space-y-2 text-sm text-text-secondary">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-0.5 text-accent-green">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handleSelect(tier.id)}
                className={`mt-6 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  tier.badge
                    ? "bg-accent-gold text-white hover:brightness-95"
                    : "bg-accent-green text-white hover:bg-accent-green-dark"
                }`}
              >
                선택하기
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
