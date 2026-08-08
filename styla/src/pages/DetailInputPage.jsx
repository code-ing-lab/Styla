import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { getTierById } from "../lib/tiers.js";
import {
  SEASON_OPTIONS,
  TPO_OPTIONS,
  PERSONAL_COLOR_OPTIONS,
  FACE_SHAPE_OPTIONS,
  BODY_COMPLEX_OPTIONS,
} from "../data/surveyQuestions.js";

const initialState = {
  age: "",
  height: "",
  weight: "",
  bust: "",
  waist: "",
  hip: "",
  legLength: "",
  personalColor: "",
  faceShape: "",
  bodyComplex: [],
  bodyComplexEtc: "",
  photo: null,
};

const inputClass =
  "w-full rounded-2xl border border-border-subtle bg-surface px-4 py-3 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-accent-green";

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-xs font-medium text-text-secondary">{label}</span>
      {children}
    </label>
  );
}

export default function DetailInputPage() {
  const navigate = useNavigate();
  const { report, surveyAnswers, setSurveyAnswers, selectedTier, orderEmail, setDetailInfo } =
    useApp();
  const tier = getTierById(selectedTier);

  const [values, setValues] = useState(initialState);
  const [season, setSeason] = useState("");
  const [tpo, setTpo] = useState("");

  useEffect(() => {
    if (!report) navigate("/", { replace: true });
    else if (!tier) navigate("/result", { replace: true });
    else if (!orderEmail) navigate("/checkout", { replace: true });
    else if (surveyAnswers) {
      setSeason(surveyAnswers.currentSeason);
      setTpo(surveyAnswers.tpo);
    }
  }, [report, tier, orderEmail, surveyAnswers, navigate]);

  if (!report || !tier || !orderEmail) return null;

  const update = (key, value) => setValues((prev) => ({ ...prev, [key]: value }));

  const toggleBodyComplex = (option) => {
    setValues((prev) => ({
      ...prev,
      bodyComplex: prev.bodyComplex.includes(option)
        ? prev.bodyComplex.filter((v) => v !== option)
        : [...prev.bodyComplex, option],
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    update("photo", file);
  };

  const goToReport = () => {
    // TODO: 여기서 수집한 상세 정보(치수·퍼스널컬러·사진 등)를 실제 AI API 호출 시
    // generateReport(surveyAnswers, detailInfo)처럼 함께 전달하도록 교체
    setDetailInfo(values);
    setSurveyAnswers((prev) => ({ ...prev, currentSeason: season, tpo }));
    navigate(`/report/${tier.id}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    goToReport();
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-16">
      <div className="mb-8 text-center">
        <span className="eyebrow">Detail Info</span>
        <h1 className="mt-2 font-report-title text-3xl font-semibold">
          더 정확한 분석을 위한 상세 정보
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          모두 선택 입력이에요. 자세히 입력할수록 리포트가 더 정교해져요.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-border-subtle bg-surface-card p-6 sm:p-8"
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="계절 · 날씨">
            <select
              className={inputClass}
              value={season}
              onChange={(e) => setSeason(e.target.value)}
            >
              {SEASON_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="TPO">
            <select className={inputClass} value={tpo} onChange={(e) => setTpo(e.target.value)}>
              {TPO_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="나이">
            <input
              type="number"
              className={inputClass}
              value={values.age}
              onChange={(e) => update("age", e.target.value)}
            />
          </Field>
          <Field label="키 (cm)">
            <input
              type="number"
              className={inputClass}
              value={values.height}
              onChange={(e) => update("height", e.target.value)}
            />
          </Field>
          <Field label="몸무게 (kg)">
            <input
              type="number"
              className={inputClass}
              value={values.weight}
              onChange={(e) => update("weight", e.target.value)}
            />
          </Field>
          <Field label="가슴둘레 (cm)">
            <input
              type="number"
              className={inputClass}
              value={values.bust}
              onChange={(e) => update("bust", e.target.value)}
            />
          </Field>
          <Field label="허리둘레 (cm)">
            <input
              type="number"
              className={inputClass}
              value={values.waist}
              onChange={(e) => update("waist", e.target.value)}
            />
          </Field>
          <Field label="엉덩이둘레 (cm)">
            <input
              type="number"
              className={inputClass}
              value={values.hip}
              onChange={(e) => update("hip", e.target.value)}
            />
          </Field>
          <Field label="다리길이 (cm)">
            <input
              type="number"
              className={inputClass}
              value={values.legLength}
              onChange={(e) => update("legLength", e.target.value)}
            />
          </Field>
        </div>

        <div className="mt-8 border-t border-border-subtle pt-6">
          <p className="eyebrow text-accent-gold">추가 프로필 정보</p>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <Field label="퍼스널컬러 · 톤">
              <select
                className={inputClass}
                value={values.personalColor}
                onChange={(e) => update("personalColor", e.target.value)}
              >
                <option value="">선택 안 함</option>
                {PERSONAL_COLOR_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="얼굴형">
              <select
                className={inputClass}
                value={values.faceShape}
                onChange={(e) => update("faceShape", e.target.value)}
              >
                <option value="">선택 안 함</option>
                {FACE_SHAPE_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-4">
            <Field label="체형 콤플렉스 (복수 선택 가능)">
              <div className="flex flex-wrap gap-2">
                {BODY_COMPLEX_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleBodyComplex(option)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      values.bodyComplex.includes(option)
                        ? "border-accent-green bg-accent-green/10 text-accent-green"
                        : "border-border-subtle text-text-secondary hover:border-accent-green"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="기타 직접입력"
                className={`${inputClass} mt-2`}
                value={values.bodyComplexEtc}
                onChange={(e) => update("bodyComplexEtc", e.target.value)}
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="사진 업로드 (선택 — 미업로드 시 신체정보만으로 분석)">
              <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-border-subtle bg-surface px-4 py-3 text-sm text-text-secondary hover:border-accent-green">
                {values.photo ? values.photo.name : "사진 선택하기"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            </Field>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="submit"
            className="flex-1 rounded-2xl bg-accent-green px-5 py-4 text-base font-semibold text-white transition hover:bg-accent-green-dark"
          >
            리포트 확인하기
          </button>
          <button
            type="button"
            onClick={goToReport}
            className="rounded-2xl border border-border-subtle px-5 py-4 text-base font-medium text-text-secondary transition hover:border-accent-green hover:text-text-primary"
          >
            건너뛰기
          </button>
        </div>
      </form>
    </div>
  );
}
