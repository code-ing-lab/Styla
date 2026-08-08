import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import PricingModal from "../components/PricingModal.jsx";
import PlaceholderImage from "../components/PlaceholderImage.jsx";

function LockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
    </svg>
  );
}

function SectionLabel({ children }) {
  return (
    <h2 className="font-report-title text-xl font-semibold text-text-primary sm:text-2xl">
      {children}
    </h2>
  );
}

export default function ResultPage() {
  const navigate = useNavigate();
  const { report, surveyAnswers } = useApp();
  const [pricingOpen, setPricingOpen] = useState(false);

  useEffect(() => {
    if (!report || !surveyAnswers) {
      navigate("/", { replace: true });
    }
  }, [report, surveyAnswers, navigate]);

  if (!report || !surveyAnswers) return null;

  const currentSeasonLook = report.looksBySeason[surveyAnswers.currentSeason];
  const tpoLook = report.looksByTpo[surveyAnswers.tpo];

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
      <div className="mb-10 text-center">
        <span className="eyebrow">Your Style Report</span>
        <h1 className="mt-2 font-report-title text-3xl font-semibold sm:text-4xl">
          무료 미리보기
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          STEP 1은 무료로 전체 공개돼요. 전체 리포트는 요금제를 선택하면 확인할 수 있어요.
        </p>
      </div>

      {/* STEP 1 — 무료 공개 */}
      <section className="rounded-3xl border border-border-subtle bg-surface-card p-6 sm:p-8">
        <span className="eyebrow">Step 1</span>
        <SectionLabel>체형 &amp; 분위기 분석</SectionLabel>
        <p className="mt-4 text-base leading-relaxed text-text-primary">
          {report.bodyType.summary}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {report.bodyType.keywords.map((keyword) => (
            <span
              key={keyword}
              className="rounded-full border border-border-subtle bg-surface px-3 py-1 text-sm text-text-secondary"
            >
              #{keyword}
            </span>
          ))}
        </div>
      </section>

      {/* 이하 페이월 — 블러 처리 */}
      <div className="relative mt-10 max-h-[620px] overflow-hidden rounded-3xl">
        <div
          aria-hidden="true"
          className="pointer-events-none select-none space-y-10 blur-md"
        >
          <section>
            <span className="eyebrow">Color Palette</span>
            <SectionLabel>어울리는 컬러 팔레트</SectionLabel>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {report.colorPalette.map((color) => (
                <div
                  key={color.name}
                  className="rounded-2xl border border-border-subtle bg-surface-card p-4"
                >
                  <div
                    className="mb-3 h-16 w-full rounded-xl"
                    style={{ backgroundColor: color.hex }}
                  />
                  <p className="text-sm font-semibold text-text-primary">{color.name}</p>
                  <p className="mt-1 text-xs text-text-secondary">{color.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <span className="eyebrow">Season Look</span>
            <SectionLabel>{surveyAnswers.currentSeason} 추천 룩</SectionLabel>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {currentSeasonLook.items.map((item) => (
                <div key={item}>
                  <PlaceholderImage label={item} />
                  <p className="mt-2 text-center text-sm text-text-primary">{item}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-text-secondary">{currentSeasonLook.tip}</p>
          </section>

          <section>
            <span className="eyebrow">TPO Look</span>
            <SectionLabel>{surveyAnswers.tpo} 추천 룩</SectionLabel>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {tpoLook.items.map((item) => (
                <div key={item}>
                  <PlaceholderImage label={item} />
                  <p className="mt-2 text-center text-sm text-text-primary">{item}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-text-secondary">{tpoLook.tip}</p>
          </section>

          <section>
            <span className="eyebrow">Summary</span>
            <SectionLabel>최종 요약</SectionLabel>
            <p className="mt-4 text-base text-text-primary">{report.summary.oneLiner}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-text-secondary">
              {report.summary.keyFormulas.map((formula) => (
                <li key={formula}>{formula}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-surface/0 via-surface/70 to-surface" />

        <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
          <div className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-border-subtle bg-surface-card p-8 text-center shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-green/10 text-accent-green">
              <LockIcon className="h-6 w-6" />
            </div>
            <p className="mt-4 text-base font-semibold text-text-primary">
              컬러 팔레트, 추천 룩, 최종 요약이
              <br />
              잠겨 있어요
            </p>
            <button
              type="button"
              onClick={() => setPricingOpen(true)}
              className="mt-5 w-full rounded-2xl bg-accent-green px-5 py-4 text-base font-semibold text-white transition hover:bg-accent-green-dark"
            >
              3가지 요금제 중 선택하고
              <br />
              전체 리포트 확인하기
            </button>
          </div>
        </div>
      </div>

      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
    </div>
  );
}
