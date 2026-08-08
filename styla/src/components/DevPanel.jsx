import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { generateReport } from "../lib/generateReport.js";
import { getCurrentSeason } from "../lib/season.js";
import { TIERS } from "../lib/tiers.js";

// 개발 중 결제 플로우를 매번 반복하지 않고 유료 화면을 바로 확인하기 위한 패널.
// import.meta.env.DEV가 false인 프로덕션 빌드에는 포함되지 않는다.
const MOCK_ANSWERS = {
  gender: "female",
  ageGroup: "20s",
  heightRange: "160to170",
  weightRange: "50to55",
  tpo: "데이트룩",
  schedule: "다음 주 소개팅이 있어요",
};

const navButtonClass =
  "w-full rounded-lg border border-border-subtle px-2.5 py-1.5 text-left text-text-primary transition hover:border-accent-green hover:bg-accent-green/5";

export default function DevPanel() {
  const navigate = useNavigate();
  const { setSurveyAnswers, setReport, setSelectedTier, setOrderEmail } = useApp();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const seedAndGo = async (path, tierId) => {
    setLoading(true);
    const finalAnswers = { ...MOCK_ANSWERS, currentSeason: getCurrentSeason() };
    const report = await generateReport(finalAnswers);
    setSurveyAnswers(finalAnswers);
    setReport(report);
    if (tierId) setSelectedTier(tierId);
    setOrderEmail("dev@styla.test");
    setLoading(false);
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 font-mono text-xs">
      {open && (
        <div className="mb-2 w-60 rounded-2xl border border-dashed border-red-400 bg-surface-card p-3 shadow-xl">
          <p className="mb-2 font-bold tracking-wide text-red-500">DEV MODE — 유료 화면 바로가기</p>
          <div className="flex flex-col gap-1.5">
            <button type="button" onClick={() => seedAndGo("/result")} className={navButtonClass}>
              무료 미리보기 (/result)
            </button>
            <button
              type="button"
              onClick={() => seedAndGo("/checkout", "tier2")}
              className={navButtonClass}
            >
              체크아웃 (/checkout)
            </button>
            {TIERS.map((tier) => (
              <button
                key={`details-${tier.id}`}
                type="button"
                onClick={() => seedAndGo("/details", tier.id)}
                className={navButtonClass}
              >
                상세정보 입력 ({tier.name})
              </button>
            ))}
            {TIERS.map((tier) => (
              <button
                key={`report-${tier.id}`}
                type="button"
                onClick={() => seedAndGo(`/report/${tier.id}`, tier.id)}
                className={navButtonClass}
              >
                최종 리포트 ({tier.name})
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full border border-dashed border-red-400 bg-surface-card px-4 py-2 font-bold text-red-500 shadow-lg"
      >
        {loading ? "..." : "DEV"}
      </button>
    </div>
  );
}
