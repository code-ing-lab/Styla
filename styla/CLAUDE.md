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
| 게스트 | **평생 1회** (localStorage 영구 플래그, 날짜 리셋 아님) | 기본 체형 진단 리포트 (`bodyType.primary`/`keywords`/`basicStyleGuide`) | **없음** (아래 참고, 로그인 전환 유인 실험) |
| 로그인(member) | 하루 3회 (DB `usage_logs`) | 게스트와 같은 기본 진단 + 데일리 코디 제안(`styleTip`) 1개 추가 | 1장 (low quality) |
| 프리미엄 | 하루 5회 | bodyType/styleGuide/detailGuide/moodStyleGuide/summary 5섹션 심화 리포트 | 1장 (high quality) |

**게스트는 이미지를 아예 생성하지 않음(실험적 변경).** 텍스트 리포트만으로도 로그인 없이
받아볼 만한 가치가 있다고 판단했고, 이미지(가장 강한 후킹 요소)는 로그인해야만 주는
방식으로 전환율을 테스트해보기로 함. `generate-recommendation`의 `generateWithRetry`가
`tier === 'guest'`면 `callOpenAIImage` 자체를 호출하지 않고 `images: []`로 바로 반환.
`ResultView.jsx`에는 빈 이미지 자리 대신 `GuestImageTeaser`(잠금 아이콘 + "로그인하기" 버튼)를
넣어뒀음. **이 실험이 기대만큼 전환율을 못 끌어올리면 되돌릴 수 있는 변경**이니, 나중에
지표 보고 롤백할지 판단할 것.

**세 티어는 이용 한도뿐 아니라 출력 내용 자체도 다르다** — 각 티어의 시스템 프롬프트를
사용자가 직접 작성해서 줬고(`generate-recommendation/index.ts`의 `GUEST_SYSTEM_PROMPT`/
`MEMBER_SYSTEM_PROMPT`/`PREMIUM_SYSTEM_PROMPT`), OpenAI 호출도 `system` role로 이 프롬프트를
보내고 `user` role에는 `describeInput()`으로 만든 사용자 정보만 넣는 구조로 바꿨다.
(한때 "게스트=로그인 완전 동일 출력"으로 통일했었는데, 이 세 프롬프트를 받으면서 다시
차등화하는 쪽으로 뒤집혔음 — 최신 방향은 이 표가 맞음.)

- 게스트/로그인 스키마: `{ bodyType: { primary }, keywords: [3개], basicStyleGuide: { ratioAnalysis, fitRecommendation, tpoStylingTip }, styleTip? }` — `styleTip`은 로그인만 채워짐.
  `bodyType.primary`는 웨이브/스트레이트/내추럴 중 하나(이미지 컨설팅에서 쓰는 체형 분류 용어).
- 프리미엄 스키마: `{ bodyType: {primary, primaryPercent, secondary, secondaryPercent}, confidence, keywords: [4개], styleGuide: {top/bottom/dress/outer}, detailGuide: {neckline/sleeve/waistDetail/length}, moodStyleGuide: {moodKeyword, recommendedItems, colorPalette: [{name, hex}], reason}, summary: {oneLiner, keyFormulas} }`.
  `moodStyleGuide`가 이번에 새로 추가된 섹션 — **선호 무드·스타일 입력값을 여기서 실제로 반영**한다
  (예전엔 프로필 문자열에 나열만 되고 구체적 지시문이 없다는 게 미해결 과제였는데, 이번 프롬프트로 해결됨).
- 세 프롬프트 다 "얼굴형/퍼스널컬러가 입력 안 됐으면 절대 추측하지 말 것", "의료적 판단 금지",
  "부정적 표현 대신 순화된 표현 사용" 같은 공통 가드레일을 갖고 있음 — 새 프롬프트를 또 고칠 때도
  이 가드레일은 유지할 것.

### 입력 폼 필드 (RecommendForm, 전 티어 공통 구조)

`체형카드`(표준/마른/통통/근육형을 카드로 고르는 방식)는 **검토했다가 폐기**했다 — 대신
숫자로 키/몸무게를 직접 입력받는 원래 방식으로 유지하기로 함. 최종 폼 구조:

- **기본 정보**(항상 노출, 전 티어 공통): 성별·나이·키·몸무게 (성별/키/몸무게 필수)
- **"상세조건 더보기" 토글**(전 티어 공통, 기본은 접힘): 가슴/허리/엉덩이둘레·다리길이·
  **계절(1차 select)+세부 날씨(2차 select, 계절 고르기 전엔 비활성)**·**TPO(자유 문장 입력)**
  + 선호 무드·스타일 (**게스트/로그인만** 여기 노출됨, 프리미엄은 아래 섹션으로 이동)
- **"프리미엄 상세조건"**(프리미엄 전용, 항상 노출·접히지 않음): 얼굴형·퍼스널컬러·
  **선호 무드·스타일**·체형 콤플렉스(직접입력 텍스트)·사진 업로드

계절/날씨는 원래 "계절·날씨" 옵션 하나짜리 select였는데, 계절을 먼저 고르면 그 계절에 맞는
세부 날씨(`WEATHER_OPTIONS_BY_SEASON`, `RecommendForm.jsx`)를 고르는 2단계 select로 바꿈.
TPO는 원래 데일리/오피스/데이트 등 고정 옵션 select였는데, 선호 무드·스타일처럼 자유 문장으로
받도록 바꿈("친구 결혼식", "소개팅" 등 구체적 상황을 직접 쓸 수 있게).

**선호 무드·스타일**은 게스트/로그인/프리미엄 전 티어가 입력할 수 있고(프리미엄만 위치가
다름), `generate-recommendation`의 `describeInput()`을 거쳐 모든 티어의 AI 프롬프트에
"사용자 정보" 문자열의 일부로 포함된다. 프리미엄은 여기서 한 발 더 나가서 `moodStyleGuide`
섹션(무드 키워드/추천 아이템/컬러 팔레트)으로 이 값을 구체적으로 반영하도록 시스템
프롬프트에 명시돼 있음(위 "유저 티어 구조" 참고) — 예전에 "구체적 지시문이 없다"고
남겨뒀던 과제는 이 프롬프트로 해결됨.

**이미지 프롬프트에 나이가 빠져있던 버그 수정**: `buildImagePrompt`가 `age`를 아예 안 받고
있어서 사진에 나이가 전혀 반영이 안 되고 있었음(텍스트 리포트 쪽은 `describeInput`에 원래
포함돼 있어서 괜찮았음). `age`/`weather`를 `ImagePromptInput`에 추가해서 이미지 프롬프트에도
반영되도록 고침.

`RecommendForm`은 **DB 저장 없이 매 요청마다 다시 입력**받되, 이 브라우저에는 마지막 입력값을
`localStorage`에 기억해뒀다가 다음에 열 때 자동으로 채워준다(사진 제외, "초기화"로 지울 수
있음 — 위 "완료된 것" 참고). `profiles` 테이블 스키마(`season`/`tpo`/`preferred_mood` 컬럼
포함)는 만들어뒀지만 프론트에서 실제로 읽거나 쓰지는 않음 — 스키마만 맞춰둔 상태.

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
  `photoUrl` 필드도 정의만 돼 있고 프롬프트 어디에서도 안 쓰임. **`PREMIUM_SYSTEM_PROMPT`에는 "사진이
  첨부된 경우" 처리 지침이 명시돼 있는데, 사진이 애초에 서버까지 못 가니 이 분기는 지금 절대 안 탐** —
  사진 관련 지침은 사실상 "사진 없는 경우" 분기만 항상 실행되는 셈. Supabase Storage 업로드 + 이미지
  분석 연결이 필요한 별도 작업. 사용자에게 조만간 짚고 넘어갈 것.

## 완료된 것

프로젝트 초기화, 디자인 시스템, DB 스키마, 유저 권한 구조, 게스트/로그인/프리미엄 전체
플로우, 라우팅, 전환 유도 CTA, OAuth+이메일 인증, 비밀번호 재설정/변경, 회원탈퇴,
usage_logs 보안 강화, 이미지 1회=1장 개편, 입력 폼 간소화(상세조건 더보기 아코디언 +
프리미엄 상세조건 분리), `saved_items`에 tier/season/tpo/AI 원본 결과(jsonb) 저장,
**3티어 AI 시스템 프롬프트 도입**(게스트=기본 진단/로그인=+데일리 코디 제안/프리미엄=사진·
퍼스널컬러·무드 반영 심화 리포트, 사용자가 직접 작성한 프롬프트 3종 반영), 게스트 이미지
생성 제거(로그인 전환 유인 실험), **이미지 프롬프트 재작성**(캔디드 스냅 스타일 + 트렌드는
파일 대신 모델이 연도/계절 보고 알아서 판단하도록 위임), **텍스트+이미지 생성 병렬화**(이미지
프롬프트가 텍스트 결과에 더 이상 안 기대므로 `Promise.all`로 동시 호출 — 응답 속도 개선),
**로딩 화면**(`LoadingScreen.jsx`, 문구 순환 애니메이션), **저장 취소 기능**(Home.jsx 결과 화면
+ MyPage.jsx 저장 목록 양쪽 다 — 하트 다시 누르면 `saved_items` 행 삭제), **마이페이지 저장 카드
정리**(그리드에 `items-start` 줘서 카드 하나 펼쳐도 옆 카드 안 늘어나게, 상단 글밥 줄임, JSON
원문 대신 `SavedResultDetail`로 티어별 보기 좋게 렌더링), **입력 정보 불러오기**(`RecommendForm`이
직전 제출값을 `localStorage`에 저장해뒀다가 다음에 열 때 자동으로 채워줌, 사진은 직렬화가 안 돼서
제외, "초기화" 링크로 지울 수 있음 — DB 저장은 아니고 이 브라우저에만 남는 가벼운 방식),
**개발자 전용 도구 확장**(`DevPreviewPanel.jsx` 우측 하단 🔧 버튼):
1) "결과 화면 미리보기" — 실제 API 호출/한도 없이 목업 데이터로 3티어 결과 화면 확인
2) "조건 입력해서 실제 생성" — 폼으로 이동해 실제로 값을 입력하고 진짜 OpenAI를 호출(사진 포함)
   해볼 수 있음. 이용 한도 면제는 Edge Function의 `DEV_BYPASS_EMAIL` secret과 일치하는 계정으로
   로그인했을 때만 적용됨(서버가 이메일을 직접 확인하므로 다른 계정이 흉내낼 수 없음) — 설정
   안 하면 이 버튼을 눌러도 그냥 일반 사용자와 동일하게 한도가 걸림.
제거 방법은 `DevPreviewPanel.jsx` 상단 주석 참고. — 전부 완료 및 브랜치에 푸시됨. DB는
`2026-08-08_full_reset.sql`로 리셋 완료, `OPENAI_API_KEY` secret 등록 완료. Netlify Production
branch를 `claude/claude-md-reading-nn8tx0`로 맞춰서 프론트엔드도 정상 배포되는 상태 확인함.

## 다음 할 일 (Styla+ 개선 우선순위)

- [ ] 🔴 **Edge Function 재배포** — 텍스트/이미지 생성 병렬화, `DEV_BYPASS_EMAIL` 로직,
  이미지 프롬프트 나이 반영 버그 수정, `weather` 필드 반영이 아직 배포 안 됐음.
  `npm run functions:deploy`로 반영할 것.
  - 디버깅 팁: 화면에 `bodyType.primary`나 리포트 문장이 비어 보이면, 십중팔구 "로컬은 최신인데
    Edge Function 배포가 안 됐거나 예전 버전"인 경우다 — `git pull`로 로컬이 최신인지 먼저
    확인하고, 확실히 하려면 그냥 한 번 더 `functions:deploy`.
- [ ] 🟡 **`DEV_BYPASS_EMAIL` secret 등록** (선택) — 개발자 계정 이메일로
  `supabase secrets set DEV_BYPASS_EMAIL=본인이메일` 실행하면, 그 계정으로 로그인했을 때
  개발자 패널의 "조건 입력해서 실제 생성"이 이용 한도 없이 동작함. 등록 안 해도 앱은 정상
  동작하고, 그 기능만 일반 사용자처럼 한도가 걸림.
- [ ] 🟡 **개발자 전용 도구 제거 확인** — 실서비스 오픈 전에 `DevPreviewPanel.jsx`/
  `devMockResults.js`, `Home.jsx`의 관련 부분(`devTier` state, `DevPreviewPanel` 렌더링,
  `handleDevMockPreview`/`handleDevFormPreview`/`handleExitDevPreview`, `handleSubmit`의 devTier
  분기), Edge Function의 `DEV_BYPASS_EMAIL` 관련 코드를 지우고 `supabase secrets unset
  DEV_BYPASS_EMAIL`까지 할 것 — 실제 유저에게는 안 보여야 함.
- [ ] 🟡 마이페이지에 계절/TPO 필터 탭 추가 — DB 컬럼과 저장 로직은 이미 완료, 남은 건 `MyPage.jsx`의 필터 탭 UI뿐
- [ ] 🟡 결과 리빌 애니메이션(fade-in/카드 flip) — 로딩 스켈레톤/로딩 화면은 이번에 완료, 결과가
  뜨는 순간의 전환 효과는 아직
- [ ] 🔵 추후 검토(보류): LLM 모델 경량화, 제휴 마케팅 링크, `/blog` SEO 페이지, 광고 시청 보상형 충전, 게이미피케이션+퀴즈 개편
- [ ] ⚪ 별도 진행(코드 작업 아님): 커스텀 도메인 구매+Netlify 연결, 구글 애드센스 신청, 제휴 마케팅 프로그램 가입

**진행 방식**: 사용자가 "1번부터 순서대로, 항목 끝날 때마다 diff 보여주고 다음으로"를
선호함. 큰 설계 판단이 필요하면 추측하지 말고 먼저 물어볼 것.

## 아직 사용자가 안 했을 수도 있는 것 (재확인 필요)

- **병렬화 + DEV_BYPASS_EMAIL 반영을 위한 Edge Function 재배포** — 위 "다음 할 일" 맨 위 항목과 동일.
- `DEV_BYPASS_EMAIL` secret 등록 — 안 하면 "조건 입력해서 실제 생성" 기능이 한도 면제가 안 됨.
- 새 이미지 프롬프트(캔디드 스냅 스타일) 실제 결과물이 기대만큼 자연스럽게 나오는지 — 아직 미확인.
- 저장 취소(하트 다시 누르기, 결과 화면·마이페이지 양쪽), 마이페이지 카드 UI, 입력 정보 불러오기,
  개발자 도구 — 전부 코드는 완료했지만 사용자가 실제 화면에서 눈으로 확인한 적은 아직 없음.
