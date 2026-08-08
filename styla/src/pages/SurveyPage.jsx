import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProgressBar from "../components/ProgressBar.jsx";
import { useApp } from "../context/AppContext.jsx";
import { generateReport } from "../lib/generateReport.js";
import { getCurrentSeason } from "../lib/season.js";
import { saveSurveyAnswers } from "../lib/surveyStorage.js";
import {
  GENDER_OPTIONS,
  AGE_OPTIONS,
  HEIGHT_OPTIONS,
  WEIGHT_OPTIONS_BY_HEIGHT,
} from "../data/surveyQuestions.js";

const TOTAL_STEPS = 4;

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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const weightOptions = useMemo(
    () => WEIGHT_OPTIONS_BY_HEIGHT[answers.heightRange] ?? [],
    [answers.heightRange]
  );

  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const selectAndAdvance = async (key, value) => {
    const next = { ...answers, [key]: value };
    if (key === "heightRange") next.weightRange = "";
    setAnswers(next);

    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      return;
    }

    // 마지막 스텝(몸무게)까지 선택되면 바로 무료 미리보기용 리포트를 생성한다.
    setIsSubmitting(true);
    const finalAnswers = { ...next, currentSeason: getCurrentSeason() };
    const report = await generateReport(finalAnswers);
    saveSurveyAnswers(finalAnswers);
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
          {isSubmitting && (
            <p className="mt-4 text-center text-sm text-text-secondary">
              리포트 생성 중...
            </p>
          )}
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
