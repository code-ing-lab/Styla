# Styla — AI 패션 코디 추천 웹앱

이 문서는 새 Claude Code 세션이 이어서 작업할 수 있도록 지금까지의 진행 상황을
정리한 것이다. 새 세션을 시작하면 이 파일부터 읽고 작업을 이어가면 된다.

## 스택

- Vite + React (Next.js 아님) + Tailwind CSS (v3, `darkMode: 'class'`)
- Supabase: Auth(이메일+비밀번호 기본, Google OAuth 보조) / Postgres / Edge Functions
- 배포: Netlify (`netlify.toml`이 리포 루트에 있음, base=`styla`)
- AI: OpenAI — 텍스트 `gpt-4o-mini`, 이미지 `gpt-image-1-mini`
  (모델명은 `supabase/functions/_shared/config.ts` 한 곳에서만 관리, 하드코딩 금지)
- 작업 브랜치: `claude/claude-md-reading-nn8tx0` (GitHub: `code-ing-lab/Styla`, 실제 앱 코드는 `styla/` 하위 폴더)

## 디자인 시스템

- 크림 럭셔리 톤. 라이트: bg `#FBF7F0` / card `#FFFFFF` / border `#E8E0D3` / text `#2B2620` / subtext `#8A8070`
- 다크: bg `#1C1A17` / card `#26231F` / border `#3A362F` / text `#F5EFE6`
- Accent: 딥그린 `#3F5D48`(버튼/강조), 골드 `#B8935A`(프리미엄 전용 포인트만)
- 폰트: 본문 Pretendard, 타이틀/숫자 강조는 Noto Serif KR 혼용
- `rounded-3xl`, Header 우측 다크모드 토글, 로고 "Styla" 옆 accent 스파클 아이콘

## 유저 티어 구조 (현재 최종 스펙)

| 티어 | 한도 | 결과 | 이미지 |
|---|---|---|---|
| 게스트 | **평생 1회** (localStorage 영구 플래그, 날짜 리셋 아님) | title/keywords/paragraphs 블로그·매거진 스타일 리포트 | 1장 (low quality) |
| 로그인(member) | 하루 3회 (DB `usage_logs`) | 게스트와 완전히 동일한 리포트 | 1장 (low quality) |
| 프리미엄 | 하루 5회 | bodyType/styleGuide/detailGuide/summary 4섹션 심화 리포트 | 1장 (high quality) |

**게스트와 로그인의 차이는 오직 이용 한도뿐**이다. 출력 스키마·이미지 화질·입력 폼 전부
동일하게 통일했다(원래 게스트만 JSON 없이 2~3문장 텍스트만 주는 별도 경로였는데 통합함).

### 입력 폼 필드 (RecommendForm, 전 티어 공통 구조)

`체형카드`(표준/마른/통통/근육형을 카드로 고르는 방식)는 **검토했다가 폐기**했다 — 대신
숫자로 키/몸무게를 직접 입력받는 원래 방식으로 유지하기로 함. 최종 폼 구조:

- **기본 정보**(항상 노출, 전 티어 공통): 성별·나이·키·몸무게 (성별/키/몸무게 필수)
- **"상세조건 더보기" 토글**(전 티어 공통, 기본은 접힘): 가슴/허리/엉덩이둘레·다리길이·계절/날씨·TPO
  + 선호 무드·스타일 (**게스트/로그인만** 여기 노출됨, 프리미엄은 아래 섹션으로 이동)
- **"프리미엄 상세조건"**(프리미엄 전용, 항상 노출·접히지 않음): 얼굴형·퍼스널컬러·
  **선호 무드·스타일**·체형 콤플렉스(직접입력 텍스트)·사진 업로드

**선호 무드·스타일**은 게스트/로그인/프리미엄 전 티어가 입력할 수 있고(프리미엄만 위치가
다름), `generate-recommendation`의 `describeInput()`을 거쳐 모든 티어의 AI 프롬프트에
"사용자 정보" 문자열의 일부로 포함된다 — 즉 AI가 코디를 추천할 때 이미 이 값을 참고하고
있다. 다만 지금은 필드 값이 단순히 프롬프트 텍스트에 나열되는 수준이고, "프리미엄 리포트가
선호 무드·스타일을 어떻게 구체적으로 반영해야 하는지"에 대한 별도 지시문은 아직 없음 —
사용자가 줄 프롬프트 구조화 작업(아래 "다음 할 일" 참고)에서 다듬을 예정.

DB 저장 없이 **매 요청마다 다시 입력**받는 방식이다(로그인 프로필에 1회 저장 후 재사용하는
방식은 채택 안 함). `profiles` 테이블 스키마(`season`/`tpo`/`preferred_mood` 컬럼 포함)는
만들어뒀지만 프론트에서 실제로 읽거나 쓰지는 않음 — 스키마만 맞춰둔 상태.

- **"1회 요청 = 이미지 1장"** 원칙 (전 티어 공통). 예전엔 member 3장/premium 6장이었으나 원가 문제로 축소.
- 프리미엄 "다시 뽑기"는 별도 크레딧 시스템 없이, 기존 "다시 추천받기" 버튼이 하루 한도 안에서 재사용되는 것으로 처리(추가 구현 없음).
- 게스트→로그인, 로그인→구독 전환 유도 모달/배너 구현됨.

## 인증

- 기본: 이메일+비밀번호 (회원가입/로그인 탭 전환), 하단에 Google 로그인 보조.
- 카카오 로그인: **보류 중**. 사업자 등록이 없는 개인 개발자는 카카오 "이메일" 동의항목을 못 받아서, 사업자 등록 전까지 화면에서 뺀 상태.
- 비밀번호 재설정(`resetPasswordForEmail`) → `/reset-password`에서 새 비밀번호 설정.
- 마이페이지 "계정 관리" 섹션에 계정정보/비밀번호 변경(이메일 가입자만)/회원탈퇴 포함. 별도 `/settings` 페이지는 없앰.
- 회원탈퇴: `supabase/functions/delete-account` Edge Function이 서비스 롤 키로 `auth.admin.deleteUser` 호출. 나머지 테이블은 FK `on delete cascade`로 자동 정리.

## ⚠️ 보안 관련 중요 결정 (반드시 유지할 것)

`usage_logs` 테이블은 클라이언트에서 **직접 쓰기 금지**(RLS `select`만 허용). 예전엔
클라이언트가 직접 `upsert`로 카운트를 올렸는데, RLS가 `for all`로 열려 있으면
로그인 유저가 브라우저 콘솔에서 자기 사용량을 마음대로 조작해 한도를 무력화할 수
있었음. 지금은 **한도 체크와 증가를 전부 `generate-recommendation` Edge Function이
서비스 롤 키로만 수행**하고, 초과 시 429 + `{error:'limit_exceeded'}` 반환.
프론트(`src/lib/ai.js`)는 이를 `LimitExceededError`로 구분해서 처리함.

새로운 "횟수 제한" 류 기능을 또 만들 때는 반드시 서버(Edge Function/서비스 롤)에서
검증하고, 클라이언트에는 읽기 권한만 주는 패턴을 따를 것.

## 폴더 구조 (`styla/` 안)

- `src/pages` — `/`, `/login`, `/reset-password`, `/subscribe`, `/mypage`
- `src/components` — StyleQuiz, RecommendForm(기본 정보+상세조건 더보기+프리미엄 상세조건), ResultView(게스트/로그인 공통 레이아웃 + 프리미엄 전용 레이아웃), Header, LimitModal, SubscribeBanner, PlaceholderImage
- `src/context` — AuthContext(세션+isPremium), ThemeContext(다크모드)
- `src/lib` — supabaseClient, tiers(TIER/DAILY_LIMIT/getTier), guestUsage(게스트 평생1회 플래그), usageLogs(조회 전용), ai(requestRecommendation)
- `supabase/schema.sql` — DB 스키마 (profiles/saved_items/usage_logs/subscriptions + RLS) — 새로 세팅할 때 기준
- `supabase/migrations/` — 이미 배포된 DB에 스키마 변경을 반영할 때 쓰는 1회성 SQL 파일들
- `supabase/functions/_shared/config.ts` — AI 모델/화질/이미지수/일일한도 공유 설정
- `supabase/functions/generate-recommendation` — AI 추천 생성 (OpenAI 실연동 완료)
- `supabase/functions/delete-account` — 회원탈퇴

## 배포 관련 알아둘 것

- Edge Function 배포: `cd styla && npm run functions:deploy` (함수명 생략하면 `_shared` 제외하고 전부 배포됨). **주의**: 로컬 브랜치가 최신 작업 브랜치로 전환·pull된 상태인지 먼저 확인할 것 — 예전 브랜치에서 배포하면 옛날 코드가 올라감.
- Secrets: `supabase secrets set OPENAI_API_KEY=sk-...` (SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY는 Supabase가 자동 주입, 별도 설정 불필요)
- Supabase 대시보드 Authentication → URL Configuration → Redirect URLs에 Netlify 도메인 와일드카드(`https://사이트.netlify.app/**`) 등록 필요 (OAuth·매직링크·비밀번호재설정 전부 이 리다이렉트를 씀)
- `.env`는 gitignore됨. Netlify에는 `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`를 대시보드 Environment variables에 직접 등록해야 함(붙여넣을 때 앞뒤 공백/줄바꿈 주의 — 한 번 이걸로 401 "No API key found" 디버깅한 적 있음)

## 지금까지 겪은 실제 트러블슈팅 (재발 방지용 기록)

1. Netlify 404 → `netlify.toml`에 `base="styla"` + SPA 리다이렉트(`/* → /index.html`) 없어서였음. 리포 루트에 추가함.
2. 로그인 후에도 게스트 화면 뜨는 버그 → `Home.jsx`의 `step` state를 `isLoggedIn` 초기값으로 useState에 넣어서, OAuth 리다이렉트 직후 세션 반영 타이밍과 어긋났음. `step`을 `null`로 시작 + `useEffect`로 authLoading 완료 후 결정하도록 수정.
3. Netlify 환경변수에 anon key 붙여넣을 때 개행 섞여서 `apikey` 헤더가 아예 안 실리는 401 발생 → 재입력으로 해결.
4. `usage_logs` RLS `for all` → 클라이언트가 직접 한도 조작 가능했던 보안 구멍 → 위 "보안 관련 중요 결정" 참고.
5. `saved_items.result`에 AI 응답 전체를 그대로 저장하면서 `images`(base64, 수백KB~1MB)까지
   같이 들어가 `image_url`과 이미지가 중복 저장되던 버그 → `images`를 뺀 결과만 `result` 컬럼에 저장하도록 수정함(코드 리뷰로 발견).

## ⚠️ 알려진 미완성 기능 (고치기 전 인지만 해둘 것)

- **프리미엄 "사진 업로드"가 실제로는 동작하지 않음.** `RecommendForm`에서 `values.photo`는 `File` 객체
  그대로 state에 들어가는데, `ai.js`의 `requestRecommendation`이 그냥 JSON 직렬화해서 보내기 때문에
  `File` 객체는 빈 객체(`{}`)로 사라짐 — 서버에 사진이 전혀 전달되지 않음. `generate-recommendation`의
  `photoUrl` 필드도 정의만 돼 있고 프롬프트 어디에서도 안 쓰임. Supabase Storage 업로드 + 이미지
  분석 연결이 필요한 별도 작업. 프롬프트 작업 들어갈 때 사용자에게 짚고 넘어갈 것.

## 완료된 것

프로젝트 초기화, 디자인 시스템, DB 스키마, 유저 권한 구조, 게스트/로그인/프리미엄 전체
플로우, 라우팅, 전환 유도 CTA, OAuth+이메일 인증, 비밀번호 재설정/변경, 회원탈퇴,
usage_logs 보안 강화, 이미지 1회=1장 개편, 입력 폼 간소화(상세조건 더보기 아코디언 +
프리미엄 상세조건 분리), 게스트/로그인 출력 통일, `saved_items`에 tier/season/tpo/AI
원본 결과(jsonb) 저장 + 마이페이지 이미지·전체 진단 보기 — 전부 완료 및 브랜치에 푸시됨.
DB는 사용자가 `2026-08-08_full_reset.sql`로 리셋 완료, Edge Function도 재배포 완료 확인함.

## 다음 할 일 (Styla+ 개선 우선순위)

- [ ] 🔴 **AI 프롬프트 재작성** — 사용자가 "AI가 분석해야 할 내용을 구획한 프롬프트"를 정리해서
  줄 예정. 그걸 받으면 `supabase/functions/generate-recommendation/index.ts`의
  `buildTextPrompt`/`buildImagePrompts`(그리고 필요하면 `describeInput`)를 다시 짤 것.
  이때 짚고 넘어가야 할 것:
  - 선호 무드·스타일이 지금은 프로필 문자열에 나열만 되는 수준 — 프리미엄 스타일 가이드가
    이 값을 얼마나 적극적으로 반영해야 하는지 구체적 지시문 필요.
  - 프리미엄 사진 업로드가 실제로 AI에 전달되지 않는 문제(위 "알려진 미완성 기능" 참고) —
    프롬프트 작업과 별개로 Storage 업로드 연동이 필요한지 사용자에게 확인.
- [ ] 🟡 결과 리빌 애니메이션(fade-in/카드 flip) + 로딩 스켈레톤 (새 라이브러리 추가 없이 Tailwind transition으로)
- [ ] 🟡 마이페이지에 계절/TPO 필터 탭 추가 — DB 컬럼과 저장 로직은 이미 완료, 남은 건 `MyPage.jsx`의 필터 탭 UI뿐
- [ ] 🔵 추후 검토(보류): LLM 모델 경량화, 제휴 마케팅 링크, `/blog` SEO 페이지, 광고 시청 보상형 충전, 게이미피케이션+퀴즈 개편
- [ ] ⚪ 별도 진행(코드 작업 아님): 커스텀 도메인 구매+Netlify 연결, 구글 애드센스 신청, 제휴 마케팅 프로그램 가입

**진행 방식**: 사용자가 "1번부터 순서대로, 항목 끝날 때마다 diff 보여주고 다음으로"를
선호함. 큰 설계 판단이 필요하면 추측하지 말고 먼저 물어볼 것.

## 아직 사용자가 안 했을 수도 있는 것 (재확인 필요)

- `OPENAI_API_KEY` secret 등록 여부 — 아직 미확인. `supabase secrets set OPENAI_API_KEY=sk-...`로
  등록돼 있어야 실제 AI 호출이 됨.
- 실제 OpenAI 이미지 화질(low) 눈으로 확인 후 만족스러운지 — 아직 미확인.
- **게스트/로그인 출력 통일 반영을 위한 Edge Function 재배포** — `generate-recommendation` 코드가
  바뀌었으니 `npm run functions:deploy` 다시 실행 필요 (직전 배포 이후에 바뀐 부분).
