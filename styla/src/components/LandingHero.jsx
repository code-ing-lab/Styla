import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { generateReport } from "../lib/generateReport.js";
import { getCurrentSeason } from "../lib/season.js";
import {
  getSavedSurveyAnswers,
  saveSurveyAnswers,
  getLastReport,
} from "../lib/surveyStorage.js";
import { getTierById } from "../lib/tiers.js";

const VALUE_PROPS = [
  { icon: "⚡", label: "3분 완성" },
  { icon: "🎨", label: "AI 맞춤 분석" },
  { icon: "💰", label: "커피 한 잔 값" },
];

export default function LandingHero({ onStart }) {
  const navigate = useNavigate();
  const { setSurveyAnswers, setReport, setSelectedTier } = useApp();

  const savedAnswers = getSavedSurveyAnswers();
  const lastReport = getLastReport();
  const lastTier = lastReport ? getTierById(lastReport.tier) : null;

  const handleContinueSaved = async () => {
    const finalAnswers = { ...savedAnswers, currentSeason: getCurrentSeason() };
    const report = await generateReport(finalAnswers);
    saveSurveyAnswers(finalAnswers);
    setSurveyAnswers(finalAnswers);
    setReport(report);
    navigate("/result");
  };

  const handleViewLastReport = () => {
    if (!lastReport) return;
    setReport(lastReport.report);
    setSurveyAnswers(lastReport.surveyAnswers);
    setSelectedTier(lastReport.tier);
    navigate(`/report/${lastReport.tier}`);
  };

  return (
    <div className="mx-auto max-w-5xl px-5 pb-16 pt-10 sm:px-8 sm:pt-16">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <span className="eyebrow">Your Style Report</span>
          <h1
            className="mt-3 font-report-title text-3xl font-semibold text-text-primary sm:text-4xl lg:text-[2.75rem]"
            style={{ lineHeight: 1.4 }}
          >
            나에게 어울리는 스타일,
            <br />
            데이터로 증명합니다
          </h1>
          <p className="mt-4 text-base leading-relaxed text-text-secondary sm:text-lg">
            체형 분석부터 계절별 추천 코디, 나만의 퍼스널 컬러 팔레트까지 —
            3분이면 완성되는 나만의 스타일 리포트예요.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent-gold/50 bg-accent-gold/10 px-4 py-2 text-sm font-semibold text-accent-gold">
            2,900원부터 시작하는 내 스타일 리포트
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
            {VALUE_PROPS.map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-border-subtle bg-surface-card px-2 py-4 text-center"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-medium text-text-secondary sm:text-sm">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <button
              type="button"
              onClick={onStart}
              className="w-full rounded-2xl bg-accent-green px-6 py-4 text-base font-semibold text-white transition hover:bg-accent-green-dark sm:w-auto sm:px-10"
            >
              내 스타일 진단 시작하기
            </button>

            {savedAnswers && (
              <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-dashed border-border-subtle bg-surface-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-text-primary">
                  이전에 입력한 정보로 바로 볼까요?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleContinueSaved}
                    className="rounded-xl bg-accent-green px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-green-dark"
                  >
                    네, 이걸로 계속하기
                  </button>
                  <button
                    type="button"
                    onClick={onStart}
                    className="rounded-xl border border-border-subtle px-4 py-2 text-xs font-medium text-text-secondary transition hover:border-accent-green hover:text-text-primary"
                  >
                    새로 입력할게요
                  </button>
                </div>
              </div>
            )}

            {lastReport && lastTier && (
              <button
                type="button"
                onClick={handleViewLastReport}
                className="mt-4 block text-sm font-medium text-text-secondary underline underline-offset-4 hover:text-accent-green"
              >
                지난번 리포트 다시 보기 ({lastTier.name})
              </button>
            )}
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-xs flex-col gap-6">
          <div className="rotate-[2deg] rounded-3xl border border-border-subtle bg-surface-card p-5 shadow-xl">
            <span className="eyebrow">Color Palette</span>
            <p className="mt-1 font-report-title text-base font-semibold text-text-primary">
              어울리는 컬러 팔레트
            </p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              <div className="aspect-square rounded-lg" style={{ backgroundColor: "#F7C8CE" }} />
              <div className="aspect-square rounded-lg" style={{ backgroundColor: "#A8D5BA" }} />
              <div className="aspect-square rounded-lg" style={{ backgroundColor: "#F5D547" }} />
              <div className="aspect-square rounded-lg" style={{ backgroundColor: "#7EC8E3" }} />
            </div>
          </div>

          <div className="ml-auto w-4/5 -rotate-[3deg] rounded-2xl border border-border-subtle bg-surface-card p-4 shadow-xl">
            <span className="eyebrow text-[0.6rem]">Season Look</span>
            <p className="mt-1 text-sm font-semibold text-text-primary">여름 추천 코디</p>
            <div className="mt-3 aspect-[4/5] rounded-xl bg-black/5 dark:bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
