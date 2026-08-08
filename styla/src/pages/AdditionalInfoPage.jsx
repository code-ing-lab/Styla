import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { generateReport } from "../lib/generateReport.js";
import { saveLastReport } from "../lib/surveyStorage.js";
import { getTierById } from "../lib/tiers.js";
import { TPO_OPTIONS } from "../data/surveyQuestions.js";

export default function AdditionalInfoPage() {
  const navigate = useNavigate();
  const { report, surveyAnswers, setSurveyAnswers, setReport, selectedTier, orderEmail } =
    useApp();
  const tier = getTierById(selectedTier);
  const isTpoUnlimited = tier?.id === "tier3";

  const [tpo, setTpo] = useState("");
  const [schedule, setSchedule] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tpoError, setTpoError] = useState("");

  useEffect(() => {
    if (!report) navigate("/", { replace: true });
    else if (!tier) navigate("/result", { replace: true });
    else if (!orderEmail) navigate("/checkout", { replace: true });
  }, [report, tier, orderEmail, navigate]);

  if (!report || !tier || !orderEmail) return null;

  const finish = async (scheduleOverride) => {
    if (!isTpoUnlimited && !tpo) {
      setTpoError("TPO 상황을 하나 선택해주세요.");
      return;
    }
    setIsSubmitting(true);
    const finalAnswers = {
      ...surveyAnswers,
      tpo: isTpoUnlimited ? surveyAnswers.tpo : tpo,
      schedule: scheduleOverride ?? schedule,
    };
    const fullReport = await generateReport(finalAnswers);
    setSurveyAnswers(finalAnswers);
    setReport(fullReport);
    saveLastReport(fullReport, tier.id, finalAnswers);
    navigate(`/report/${tier.id}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    finish();
  };

  return (
    <div className="mx-auto max-w-xl px-5 py-10 sm:px-8 sm:py-16">
      <div className="mb-8 text-center">
        <span className="eyebrow">Almost There</span>
        <h1 className="mt-2 font-report-title text-3xl font-semibold">
          당신에게 딱 맞는 리포트를 위해
          <br />몇 가지만 더 알려주세요
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-border-subtle bg-surface-card p-6 sm:p-8"
      >
        <div>
          <p className="text-sm font-semibold text-text-primary">
            어떤 상황의 스타일이 궁금하신가요?
          </p>

          {isTpoUnlimited ? (
            <div className="mt-3 rounded-2xl border border-accent-gold bg-accent-gold/10 px-4 py-3 text-sm text-text-primary">
              VIP TPO 프리패스는 오피스룩부터 하객룩까지, 모든 상황을 다 받으실 수 있어요.
            </div>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {TPO_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setTpo(opt.value);
                      setTpoError("");
                    }}
                    className={`w-full rounded-2xl border px-5 py-4 text-left text-base font-medium transition ${
                      tpo === opt.value
                        ? "border-accent-green bg-accent-green text-white"
                        : "border-border-subtle bg-surface text-text-primary hover:border-accent-green"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {tpoError && <p className="mt-2 text-sm text-red-500">{tpoError}</p>}
            </>
          )}
        </div>

        <div className="mt-8 border-t border-border-subtle pt-6">
          <label htmlFor="schedule" className="block text-sm font-semibold text-text-primary">
            다가오는 특별한 일정이 있나요?
          </label>
          <p className="mt-1 text-xs text-text-secondary">
            선택 입력이에요. 있다면 알려주세요 (예: 소개팅, 결혼식, 여행 등)
          </p>
          <textarea
            id="schedule"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            placeholder="예: 다음 주 소개팅이 있어요"
            rows={4}
            className="mt-3 w-full rounded-2xl border border-border-subtle bg-surface px-4 py-3 text-base text-text-primary outline-none placeholder:text-text-secondary focus:border-accent-green"
          />
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-2xl bg-accent-green px-5 py-4 text-base font-semibold text-white transition hover:bg-accent-green-dark disabled:opacity-60"
          >
            {isSubmitting ? "리포트 생성 중..." : "완료하고 리포트 보기"}
          </button>
          {isTpoUnlimited && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => finish("")}
              className="rounded-2xl border border-border-subtle px-5 py-4 text-base font-medium text-text-secondary transition hover:border-accent-green hover:text-text-primary disabled:opacity-60"
            >
              건너뛰기
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
