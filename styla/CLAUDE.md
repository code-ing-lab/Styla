# Styla — AI 패션 코디 추천 웹앱

이 문서는 새 Claude Code 세션이 이어서 작업할 수 있도록 지금까지의 진행 상황을
정리한 것이다. 새 세션을 시작하면 이 파일부터 읽고 작업을 이어가면 된다.

## 스택

- Vite + React (Next.js 아님) + Tailwind CSS (v3, `darkMode: 'class'`)
- Supabase: Auth(이메일+비밀번호 기본, Google OAuth 보조) / Postgres / Edge Functions
- 배포: Netlify (`netlify.toml`이 리포 루트에 있음, base=`styla`)
- AI: OpenAI — 텍스트 `gpt-4o-mini`, 이미지 `gpt-image-1-mini`
  (모델명은 `supabase/functions/_shared/config.ts` 한 곳에서만 관리, 하드코딩 금지)
- 작업 브랜치: `claude/prompt-generation-5849zj` (GitHub: `code-ing-lab/Styla`, 실제 앱 코드는 `styla/` 하위 폴더)

## 디자인 시스템

- 크림 럭셔리 톤. 라이트: bg `#FBF7F0` / card `#FFFFFF` / border `#E8E0D3` / text `#2B2620` / subtext `#8A8070`
- 다크: bg `#1C1A17` / card `#26231F` / border `#3A362F` / text `#F5EFE6`
- Accent: 딥그린 `#3F5D48`(버튼/강조), 골드 `#B8935A`(프리미엄 전용 포인트만)
- 폰트: 본문 Pretendard, 타이틀/숫자 강조는 Noto Serif KR 혼용
- `rounded-3xl`, Header 우측 다크모드 토글, 로고 "Styla" 옆 accent 스파클 아이콘

## 유저 티어 구조

| 티어 | 한도 | 입력 | 결과 | 이미지 |
|---|---|---|---|---|
| 게스트 | **평생 1회** (localStorage 영구 플래그, 날짜 리셋 아님) | 성별/나이/키/몸무게(성별·키·몸무게 필수) + "상세조건 더보기": 가슴·허리·엉덩이둘레/다리길이/계절·날씨/TPO/선호 무드·스타일 | 짧은 텍스트 2~3문장 | 1장 (low quality) |
| 로그인(member) | 하루 3회 (DB `usage_logs`) | 게스트와 동일 | title/keywords/paragraphs 블로그·매거진 스타일 리포트 | 1장 (low quality) |
| 프리미엄 | 하루 5회 | 위 상세조건 더보기(단, 선호 무드·스타일은 제외) + "프리미엄 상세조건": 얼굴형/퍼스널컬러/선호 무드·스타일/체형콤플렉스(직접입력)/사진(선택) | bodyType/styleGuide/detailGuide/summary 4섹션 심화 리포트 | 1장 (high quality) |

- **"1회 요청 = 이미지 1장"** 원칙 (전 티어 공통, 최근 개편). 예전엔 member 3장/premium 6장이었으나 원가 문제로 축소.
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
- `src/components` — StyleQuiz, RecommendForm(티어별 조건부 필드), ResultView(티어별 완전히 다른 레이아웃), Header, LimitModal, SubscribeBanner, PlaceholderImage
- `src/context` — AuthContext(세션+isPremium), ThemeContext(다크모드)
- `src/lib` — supabaseClient, tiers(TIER/DAILY_LIMIT/getTier), guestUsage(게스트 평생1회 플래그), usageLogs(조회 전용), ai(requestRecommendation)
- `supabase/schema.sql` — DB 스키마 (profiles/saved_items/usage_logs/subscriptions + RLS)
- `supabase/functions/_shared/config.ts` — AI 모델/화질/이미지수/일일한도 공유 설정
- `supabase/functions/generate-recommendation` — AI 추천 생성 (OpenAI 실연동 완료)
- `supabase/functions/delete-account` — 회원탈퇴

## 배포 관련 알아둘 것

- Edge Function 배포: `cd styla && npm run functions:deploy` (함수명 생략하면 `_shared` 제외하고 전부 배포됨)
- Secrets: `supabase secrets set OPENAI_API_KEY=sk-...` (SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY는 Supabase가 자동 주입, 별도 설정 불필요)
- Supabase 대시보드 Authentication → URL Configuration → Redirect URLs에 Netlify 도메인 와일드카드(`https://사이트.netlify.app/**`) 등록 필요 (OAuth·매직링크·비밀번호재설정 전부 이 리다이렉트를 씀)
- `.env`는 gitignore됨. Netlify에는 `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`를 대시보드 Environment variables에 직접 등록해야 함(붙여넣을 때 앞뒤 공백/줄바꿈 주의 — 한 번 이걸로 401 "No API key found" 디버깅한 적 있음)

## 지금까지 겪은 실제 트러블슈팅 (재발 방지용 기록)

1. Netlify 404 → `netlify.toml`에 `base="styla"` + SPA 리다이렉트(`/* → /index.html`) 없어서였음. 리포 루트에 추가함.
2. 로그인 후에도 게스트 화면 뜨는 버그 → `Home.jsx`의 `step` state를 `isLoggedIn` 초기값으로 useState에 넣어서, OAuth 리다이렉트 직후 세션 반영 타이밍과 어긋났음. `step`을 `null`로 시작 + `useEffect`로 authLoading 완료 후 결정하도록 수정.
3. Netlify 환경변수에 anon key 붙여넣을 때 개행 섞여서 `apikey` 헤더가 아예 안 실리는 401 발생 → 재입력으로 해결.
4. `usage_logs` RLS `for all` → 클라이언트가 직접 한도 조작 가능했던 보안 구멍 → 위 "보안 관련 중요 결정" 참고.

## 완료된 것 (Phase 0~7 + 추가 개선)

프로젝트 초기화, 디자인 시스템, DB 스키마, 유저 권한 구조, 게스트/로그인/프리미엄
전체 플로우, 라우팅, 전환 유도 CTA, OAuth+이메일 인증, 비밀번호 재설정/변경,
회원탈퇴, usage_logs 보안 강화, 이미지 1회=1장 개편(1-1), 초기 입력 폼 간소화(2-1)
— 전부 완료 및 브랜치에 푸시됨.

## 진행 중 / 다음 할 일 (Styla+ 개선 우선순위, 사용자가 준 순서)

- [x] 🔴 1-1: 이미지 1회=1장 전환, 화질 조정, 로그인 티어 블로그 리포트화 — **완료**
- [x] 🟡 2-1: 초기 입력 폼 간소화 — **완료** (최종 확정 스펙 기준, 중간에 한 번 갈아엎었음 — 이전에
  시도했던 "체형카드+2단계 페이지 분리" 버전은 폐기하고 아래 방식으로 다시 구현했음).
  `RecommendForm`은 **단일 폼 + 아코디언**(2단계 페이지 전환 없음) 구조:
  - 기본 정보(항상 노출, 전 티어 공통): 성별·나이·키·몸무게 (성별/키/몸무게 필수)
  - "상세조건 더보기" 토글(전 티어 공통, 접힘 기본값): 가슴/허리/엉덩이둘레·다리길이·계절/날씨·TPO
    + 선호 무드·스타일(**게스트/로그인만** 이 안에 노출, 프리미엄은 아래 섹션으로 이동)
  - "프리미엄 상세조건"(프리미엄 전용, 상시 노출·접히지 않음): 얼굴형·퍼스널컬러·선호 무드·스타일·
    체형 콤플렉스(멀티선택 칩 없애고 **직접입력 텍스트**로 단순화)·사진 업로드
  - **DB 저장 없이 매 요청마다 재입력**하는 방식(프로필 1회 저장 후 재사용 방식은 채택 안 함).
  `generate-recommendation` Edge Function의 `RecommendRequestBody`/`describeInput()`도 위 필드에 맞춰
  재정리했고(`season`/`preferredMood` 복원, `bodyComplex`는 string), 이미 있었지만 코드에서 안 쓰이던
  `profiles` 테이블 스키마도 이 필드 구성에 맞춰 `season`/`tpo`/`preferred_mood` 컬럼 추가 + `body_complex`를
  `text[]`→`text`로 변경함 (단, `profiles` 테이블은 여전히 프론트에서 실제로 읽거나 쓰지 않음 — 스키마만
  맞춰둔 상태). CSS/전환 효과(아코디언 애니메이션 등)는 2-2에서 다룰 예정이라 미적용.
- [ ] 🟡 2-2: 결과 리빌 애니메이션(fade-in/카드 flip) + 로딩 스켈레톤 (새 라이브러리 추가 없이 Tailwind transition으로)
- [ ] 🟡 2-3: 저장한 코디에 계절/TPO 메타데이터 저장 + 마이페이지 필터 탭 — **`saved_items` 테이블에 `season`/`tpo` 컬럼 추가하는 마이그레이션 SQL 필요** (사용자가 Supabase SQL Editor에서 직접 실행해야 함)
- [ ] 🔵 추후 검토(보류): LLM 모델 경량화, 제휴 마케팅 링크, `/blog` SEO 페이지, 광고 시청 보상형 충전, 게이미피케이션+퀴즈 개편
- [ ] ⚪ 별도 진행(코드 작업 아님): 커스텀 도메인 구매+Netlify 연결, 구글 애드센스 신청, 제휴 마케팅 프로그램 가입

**진행 방식**: 사용자가 "1번부터 순서대로, 항목 끝날 때마다 diff 보여주고 다음으로"를
선호함. 큰 설계 판단(예: 프리미엄 재뽑기를 크레딧으로 할지 횟수제한으로 할지)이
필요하면 추측하지 말고 먼저 물어볼 것 — 지금까지 대화에서 이 패턴을 계속 따라왔음.

## 아직 사용자가 안 했을 수도 있는 것 (재확인 필요)

- `profiles` 테이블을 이미 Supabase에 만들어뒀다면(예전 `schema.sql`로 생성한 경우), 2-1에서 바뀐
  컬럼을 맞추기 위해 아래 마이그레이션 SQL을 Supabase SQL Editor에서 직접 실행해야 함(테이블을 아직
  안 만들었다면 최신 `schema.sql`로 새로 만들면 되므로 생략 가능):
  ```sql
  alter table profiles add column if not exists season text;
  alter table profiles add column if not exists tpo text;
  alter table profiles add column if not exists preferred_mood text;
  alter table profiles alter column body_complex type text using array_to_string(body_complex, ', ');
  ```
- Edge Function 실제 배포 여부 (`npm run functions:deploy`)
- `OPENAI_API_KEY` secret 등록 여부
- `usage_logs` RLS 정책 마이그레이션 SQL 실행 여부:
  ```sql
  drop policy "usage_logs: 본인만" on usage_logs;
  create policy "usage_logs: 본인만 조회" on usage_logs for select using (auth.uid() = user_id);
  ```
- 실제 OpenAI 이미지 화질(low) 눈으로 확인 후 만족스러운지
