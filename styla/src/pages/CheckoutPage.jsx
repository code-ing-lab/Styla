import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { getTierById } from "../lib/tiers.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { report, selectedTier, setOrderEmail } = useApp();
  const tier = getTierById(selectedTier);

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!report) {
      navigate("/", { replace: true });
    } else if (!tier) {
      navigate("/result", { replace: true });
    }
  }, [report, tier, navigate]);

  if (!report || !tier) return null;

  const handlePayment = async () => {
    if (!EMAIL_REGEX.test(email)) {
      setError("올바른 이메일 형식을 입력해주세요.");
      return;
    }
    setError("");
    setIsProcessing(true);

    // TODO: Polar 체크아웃 세션으로 교체
    setOrderEmail(email);
    await new Promise((resolve) => setTimeout(resolve, 500));
    navigate("/additional-info");
  };

  return (
    <div className="mx-auto max-w-md px-5 py-10 sm:px-8 sm:py-16">
      <div className="mb-8 text-center">
        <span className="eyebrow">Checkout</span>
        <h1 className="mt-2 font-report-title text-3xl font-semibold">결제하기</h1>
      </div>

      <div className="rounded-3xl border border-border-subtle bg-surface-card p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div>
            <p className="text-sm text-text-secondary">선택한 요금제</p>
            <p className="mt-1 font-report-title text-lg font-semibold text-text-primary">
              {tier.name}
            </p>
          </div>
          <p className="text-xl font-bold text-text-primary">
            {tier.price.toLocaleString()}원
          </p>
        </div>

        <div className="mt-6">
          <label htmlFor="email" className="block text-sm font-medium text-text-primary">
            PDF를 받으실 이메일을 입력해주세요
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full rounded-2xl border border-border-subtle bg-surface px-4 py-3 text-base text-text-primary outline-none placeholder:text-text-secondary focus:border-accent-green"
          />
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          <p className="mt-2 text-xs text-text-secondary">
            결제 완료 시 화면에서 즉시 다운로드도 가능해요.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePayment}
          disabled={isProcessing}
          className="mt-6 w-full rounded-2xl bg-accent-green px-5 py-4 text-base font-semibold text-white transition hover:bg-accent-green-dark disabled:opacity-60"
        >
          {isProcessing ? "결제 처리 중..." : `${tier.price.toLocaleString()}원 결제하기`}
        </button>
      </div>
    </div>
  );
}
