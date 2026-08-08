import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProgressBar from "../components/ProgressBar.jsx";
import { useApp } from "../context/AppContext.jsx";
import { generateReport } from "../lib/generateReport.js";
import { getCurrentSeason } from "../lib/season.js";
import {
  GENDER_OPTIONS,
  AGE_OPTIONS,
  HEIGHT_OPTIONS,
  WEIGHT_OPTIONS_BY_HEIGHT,
  TPO_OPTIONS,
} from "../data/surveyQuestions.js";

const TOTAL_STEPS = 6;

function OptionButton({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border px-5 py-4 text-left text-base font-medium transition ${
        selected
          ? "border-accent-green bg-accent-green text-white"
          : "border-border-subtle bg-surface-card text-text-primary hover:border-accent-green"
      }`}
    >
      {label}
    </button>
  );
}

export default function SurveyPage() {
  const navigate = useNavigate();
  const { setSurveyAnswers, setReport } = useApp();

  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    gender: "",
    ageGroup: "",
    heightRange: "",
    weightRange: "",
    tpo: "",
    schedule: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const weightOptions = useMemo(
    () => WEIGHT_OPTIONS_BY_HEIGHT[answers.heightRange] ?? [],
    [answers.heightRange]
  );

  const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const selectAndAdvance = (key, value) => {
    setAnswers((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "heightRange") next.weightRange = "";
      return next;
    });
    goNext();
  };

  const finishSurvey = async (overrides = {}) => {
    setIsSubmitting(true);
    const finalAnswers = {
      ...answers,
      ...overrides,
      currentSeason: getCurrentSeason(),
    };
    const report = await generateReport(finalAnswers);
    setSurveyAnswers(finalAnswers);
    setReport(report);
    navigate("/result");
  };

  return (
    <div className="mx-auto max-w-xl px-5 py-10 sm:px-8 sm:py-16">
      <ProgressBar step={step} total={TOTAL_STEPS} />

      {step > 1 && (
        <button
          type="button"
          onClick={goBack}
          className="mb-6 text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          ← 이전
        </button>
      )}

      {step === 1 && (
        <StepCard title="성별을 알려주세요">
          <div className="grid grid-cols-2 gap-3">
            {GENDER_OPTIONS.map((opt) => (
              <OptionButton
                key={opt.value}
                label={opt.label}
                selected={answers.gender === opt.value}
                onClick={() => selectAndAdvance("gender", opt.value)}
              />
            ))}
          </div>
        </StepCard>
      )}

      {step === 2 && (
        <StepCard title="연령대를 알려주세요">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {AGE_OPTIONS.map((opt) => (
              <OptionButton
                key={opt.value}
                label={opt.label}
                selected={answers.ageGroup === opt.value}
                onClick={() => selectAndAdvance("ageGroup", opt.value)}
              />
            ))}
          </div>
        </StepCard>
      )}

      {step === 3 && (
        <StepCard title="키 구간을 알려주세요">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {HEIGHT_OPTIONS.map((opt) => (
              <OptionButton
                key={opt.value}
                label={opt.label}
                selected={answers.heightRange === opt.value}
                onClick={() => selectAndAdvance("heightRange", opt.value)}
              />
            ))}
          </div>
        </StepCard>
      )}

      {step === 4 && (
        <StepCard title="몸무게 구간을 알려주세요">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {weightOptions.map((opt) => (
              <OptionButton
                key={opt.value}
                label={opt.label}
                selected={answers.weightRange === opt.value}
                onClick={() => selectAndAdvance("weightRange", opt.value)}
              />
            ))}
          </div>
        </StepCard>
      )}

      {step === 5 && (
        <StepCard title="어떤 상황의 스타일이 궁금하신가요?">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TPO_OPTIONS.map((opt) => (
              <OptionButton
                key={opt.value}
                label={opt.label}
                selected={answers.tpo === opt.value}
                onClick={() => selectAndAdvance("tpo", opt.value)}
              />
            ))}
          </div>
        </StepCard>
      )}

      {step === 6 && (
        <StepCard
          title="다가오는 특별한 일정이 있나요?"
          subtitle="선택 입력이에요. 있다면 알려주세요 (예: 소개팅, 결혼식, 여행 등)"
        >
          <textarea
            value={answers.schedule}
            onChange={(e) =>
              setAnswers((prev) => ({ ...prev, schedule: e.target.value }))
            }
            placeholder="예: 다음 주 소개팅이 있어요"
            rows={4}
            className="w-full rounded-2xl border border-border-subtle bg-surface-card px-4 py-3 text-base text-text-primary outline-none placeholder:text-text-secondary focus:border-accent-green"
          />
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={finishSurvey}
              className="flex-1 rounded-2xl bg-accent-green px-5 py-4 text-base font-semibold text-white transition hover:bg-accent-green-dark disabled:opacity-60"
            >
              {isSubmitting ? "리포트 생성 중..." : "결과 보기"}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => finishSurvey({ schedule: "" })}
              className="rounded-2xl border border-border-subtle px-5 py-4 text-base font-medium text-text-secondary transition hover:border-accent-green hover:text-text-primary disabled:opacity-60"
            >
              건너뛰기
            </button>
          </div>
        </StepCard>
      )}
    </div>
  );
}

function StepCard({ title, subtitle, children }) {
  return (
    <div className="rounded-3xl border border-border-subtle bg-surface-card p-6 sm:p-8">
      <h1 className="font-report-title text-2xl font-semibold text-text-primary sm:text-3xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>
      )}
      <div className="mt-6">{children}</div>
    </div>
  );
}
