import { useState } from 'react'
import { Upload } from 'lucide-react'
import { TIER } from '../lib/tiers'

const SEASON_OPTIONS = ['봄', '여름', '가을', '겨울']
const TPO_OPTIONS = ['데일리', '오피스', '데이트', '모임 · 파티', '여행']
const PERSONAL_COLOR_OPTIONS = ['봄 웜톤', '여름 쿨톤', '가을 웜톤', '겨울 쿨톤']
const FACE_SHAPE_OPTIONS = ['계란형', '둥근형', '각진형', '긴형', '하트형']

const initialState = {
  gender: '',
  age: '',
  height: '',
  weight: '',
  bust: '',
  waist: '',
  hip: '',
  legLength: '',
  season: '',
  tpo: '',
  preferredMood: '',
  faceShape: '',
  personalColor: '',
  bodyComplex: '',
  photo: null,
}

// 기본 정보(성별/나이/키/몸무게)만 항상 보이고, 그 외 치수·계절·TPO·선호 무드는
// "상세조건 더보기"로 접어둔다 (게스트/로그인/프리미엄 공통). 프리미엄은 거기에 더해
// 얼굴형/퍼스널컬러/선호 무드/체형 콤플렉스/사진을 묻는 "프리미엄 상세조건" 섹션이 추가된다.
export default function RecommendForm({ tier, onSubmit, submitting }) {
  const [values, setValues] = useState(initialState)
  const [showDetails, setShowDetails] = useState(false)
  const isPremium = tier === TIER.PREMIUM

  const update = (key, value) => setValues((prev) => ({ ...prev, [key]: value }))

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
      </div>

      <button
        type="button"
        onClick={() => setShowDetails((prev) => !prev)}
        className="mt-4 text-xs font-medium text-accent-green hover:underline"
      >
        {showDetails ? '상세조건 접기 ▲' : '상세조건 더보기 ▼'}
      </button>

      {showDetails && (
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-cream-border pt-4 dark:border-night-border">
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

          {!isPremium && (
            <Field label="선호 무드 · 스타일" className="col-span-2">
              <input
                type="text"
                placeholder="예: 미니멀, 러블리, 스트릿..."
                className={inputClass}
                value={values.preferredMood}
                onChange={(e) => update('preferredMood', e.target.value)}
              />
            </Field>
          )}
        </div>
      )}

      {isPremium && (
        <div className="mt-8 border-t border-cream-border pt-6 dark:border-night-border">
          <p className="font-serif text-sm font-semibold text-accent-gold">프리미엄 상세조건</p>

          <div className="mt-4 grid grid-cols-2 gap-4">
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

            <Field label="선호 무드 · 스타일" className="col-span-2">
              <input
                type="text"
                placeholder="예: 미니멀, 러블리, 스트릿..."
                className={inputClass}
                value={values.preferredMood}
                onChange={(e) => update('preferredMood', e.target.value)}
              />
            </Field>
          </div>

          <Field label="체형 콤플렉스 (직접입력)" className="mt-4">
            <input
              type="text"
              placeholder="예: 어깨가 넓은 편이라 커버하고 싶어요"
              className={inputClass}
              value={values.bodyComplex}
              onChange={(e) => update('bodyComplex', e.target.value)}
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
