import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { generateReport } from "../lib/generateReport.js";
import { getCurrentSeason } from "../lib/season.js";
import { TIERS } from "../lib/tiers.js";

// 개발 중 결제 플로우를 매번 반복하지 않고 유료 화면을 바로 확인하기 위한 패널.
// 로컬 dev 서버에서는 항상 보이고, 배포된 사이트에서는 ?dev=1일 때만 보인다.
const BASE_MOCK_ANSWERS = {
  gender: "female",
  ageGroup: "20s",
  heightRange: "160to170",
  weightRange: "50to55",
};

const navButtonClass =
  "w-full rounded-lg border border-border-subtle px-2.5 py-1.5 text-left text-text-primary transition hover:border-accent-green hover:bg-accent-green/5";

export default function DevPanel() {
  const navigate = useNavigate();
  const { setSurveyAnswers, setReport, setSelectedTier, setOrderEmail } = useApp();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // path === "/additional-info" 로 갈 때는 TPO/일정 없이 기본 정보만 채워서
  // 그 페이지의 입력 플로우를 처음부터 테스트할 수 있게 한다.
  // path === "/report/:tier" 로 바로 갈 때는 TPO/일정까지 채워서 AdditionalInfoPage를 건너뛴다.
  const seedAndGo = async (path, tierId, includeAdditionalInfo) => {
    setLoading(true);
    const baseAnswers = { ...BASE_MOCK_ANSWERS, currentSeason: getCurrentSeason() };
    const finalAnswers = includeAdditionalInfo
      ? { ...baseAnswers, tpo: "데이트룩", schedule: "다음 주 소개팅이 있어요" }
      : baseAnswers;
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
          <p className="mb-2 font-bold tracking-wide text-red-500">DEV MODE — 화면 바로가기</p>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => seedAndGo("/result", null, false)}
              className={navButtonClass}
            >
              무료 미리보기 (/result)
            </button>
            <button
              type="button"
              onClick={() => seedAndGo("/checkout", "tier2", false)}
              className={navButtonClass}
            >
              체크아웃 (/checkout)
            </button>
            {TIERS.map((tier) => (
              <button
                key={`additional-${tier.id}`}
                type="button"
                onClick={() => seedAndGo("/additional-info", tier.id, false)}
                className={navButtonClass}
              >
                추가정보 입력 ({tier.name})
              </button>
            ))}
            {TIERS.map((tier) => (
              <button
                key={`report-${tier.id}`}
                type="button"
                onClick={() => seedAndGo(`/report/${tier.id}`, tier.id, true)}
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
