import { useState } from 'react'
import { Upload } from 'lucide-react'
import { TIER } from '../lib/tiers'

const SEASON_OPTIONS = ['봄', '여름', '가을', '겨울']
const TPO_OPTIONS = ['데일리', '오피스', '데이트', '모임 · 파티', '여행']
const PERSONAL_COLOR_OPTIONS = ['봄 웜톤', '여름 쿨톤', '가을 웜톤', '겨울 쿨톤']
const FACE_SHAPE_OPTIONS = ['계란형', '둥근형', '각진형', '긴형', '하트형']
const BODY_COMPLEX_OPTIONS = ['어깨가 넓어요', '하체가 두꺼워요', '허리가 밋밋해요', '키가 작아요', '팔뚝이 신경쓰여요']

const initialState = {
  gender: '',
  height: '',
  weight: '',
  age: '',
  bust: '',
  waist: '',
  hip: '',
  legLength: '',
  season: '',
  tpo: '',
  personalColor: '',
  faceShape: '',
  bodyComplex: [],
  bodyComplexEtc: '',
  photo: null,
}

export default function RecommendForm({ tier, onSubmit, submitting }) {
  const [values, setValues] = useState(initialState)
  const isPremium = tier === TIER.PREMIUM

  const update = (key, value) => setValues((prev) => ({ ...prev, [key]: value }))

  const toggleBodyComplex = (option) => {
    setValues((prev) => ({
      ...prev,
      bodyComplex: prev.bodyComplex.includes(option)
        ? prev.bodyComplex.filter((v) => v !== option)
        : [...prev.bodyComplex, option],
    }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0] ?? null
    update('photo', file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!values.gender || !values.height || !values.weight) return
    onSubmit(values)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-2xl rounded-3xl border border-cream-border bg-cream-card p-8 shadow-sm dark:border-night-border dark:bg-night-card"
    >
      <h2 className="font-serif text-2xl font-semibold text-cream-text dark:text-night-text">
        {isPremium ? '사진 분석 · 심화 리포트를 위한 정보를 입력해주세요' : '코디 추천을 위한 정보를 입력해주세요'}
      </h2>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <Field label="성별" required>
          <select
            className={selectClass}
            value={values.gender}
            onChange={(e) => update('gender', e.target.value)}
            required
          >
            <option value="">선택</option>
            <option value="female">여성</option>
            <option value="male">남성</option>
            <option value="unspecified">선택 안 함</option>
          </select>
        </Field>

        <Field label="나이">
          <input type="number" className={inputClass} value={values.age} onChange={(e) => update('age', e.target.value)} />
        </Field>

        <Field label="키 (cm)" required>
          <input
            type="number"
            className={inputClass}
            value={values.height}
            onChange={(e) => update('height', e.target.value)}
            required
          />
        </Field>

        <Field label="몸무게 (kg)" required>
          <input
            type="number"
            className={inputClass}
            value={values.weight}
            onChange={(e) => update('weight', e.target.value)}
            required
          />
        </Field>

        <Field label="가슴둘레 (cm)">
          <input type="number" className={inputClass} value={values.bust} onChange={(e) => update('bust', e.target.value)} />
        </Field>

        <Field label="허리둘레 (cm)">
          <input type="number" className={inputClass} value={values.waist} onChange={(e) => update('waist', e.target.value)} />
        </Field>

        <Field label="엉덩이둘레 (cm)">
          <input type="number" className={inputClass} value={values.hip} onChange={(e) => update('hip', e.target.value)} />
        </Field>

        <Field label="다리길이 (cm)">
          <input
            type="number"
            className={inputClass}
            value={values.legLength}
            onChange={(e) => update('legLength', e.target.value)}
          />
        </Field>

        <Field label="계절 · 날씨">
          <select className={selectClass} value={values.season} onChange={(e) => update('season', e.target.value)}>
            <option value="">선택</option>
            {SEASON_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field label="TPO">
          <select className={selectClass} value={values.tpo} onChange={(e) => update('tpo', e.target.value)}>
            <option value="">선택</option>
            {TPO_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {isPremium && (
        <div className="mt-8 border-t border-cream-border pt-6 dark:border-night-border">
          <p className="font-serif text-sm font-semibold text-accent-gold">프리미엄 전용 정보</p>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <Field label="퍼스널컬러 · 톤">
              <select
                className={selectClass}
                value={values.personalColor}
                onChange={(e) => update('personalColor', e.target.value)}
              >
                <option value="">선택</option>
                {PERSONAL_COLOR_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="얼굴형">
              <select className={selectClass} value={values.faceShape} onChange={(e) => update('faceShape', e.target.value)}>
                <option value="">선택</option>
                {FACE_SHAPE_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="체형 콤플렉스 (복수 선택 가능)" className="mt-4">
            <div className="flex flex-wrap gap-2">
              {BODY_COMPLEX_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleBodyComplex(option)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    values.bodyComplex.includes(option)
                      ? 'border-accent-green bg-accent-green/10 text-accent-green'
                      : 'border-cream-border text-cream-subtext dark:border-night-border dark:text-night-text/70'
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
              onChange={(e) => update('bodyComplexEtc', e.target.value)}
            />
          </Field>

          <Field label="사진 업로드 (선택 — 미업로드 시 신체정보만으로 분석)" className="mt-4">
            <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-cream-border px-4 py-3 text-sm text-cream-subtext hover:border-accent-green dark:border-night-border dark:text-night-text/70">
              <Upload size={16} />
              {values.photo ? values.photo.name : '사진 선택하기'}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
          </Field>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-8 w-full rounded-full bg-accent-green px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? '분석 중...' : 'AI 코디 추천 받기'}
      </button>
    </form>
  )
}

const inputClass =
  'w-full rounded-xl border border-cream-border bg-cream-bg px-3 py-2 text-sm text-cream-text focus:border-accent-green focus:outline-none dark:border-night-border dark:bg-night-bg dark:text-night-text'
const selectClass = inputClass

function Field({ label, required, children, className = '' }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block text-xs font-medium text-cream-subtext dark:text-night-text/70">
        {label}
        {required && <span className="text-accent-green"> *</span>}
      </span>
      {children}
    </label>
  )
}
