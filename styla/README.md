# Styla

AI 패션 코디 추천 웹앱. Vite + React + Tailwind CSS + Supabase.

## 시작하기

```bash
npm install
cp .env.example .env   # VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 입력
npm run dev
```

## 폴더 구조

- `src/pages` — 라우트별 페이지 (`/`, `/login`, `/subscribe`, `/mypage`)
- `src/components` — StyleQuiz, RecommendForm, ResultView 등 UI 컴포넌트
- `src/context` — Auth/Theme 전역 상태
- `src/lib` — Supabase 클라이언트, 티어/사용량 로직, AI 요청 헬퍼
- `supabase/schema.sql` — DB 스키마
- `supabase/functions/generate-recommendation` — AI 코디 추천 Edge Function
