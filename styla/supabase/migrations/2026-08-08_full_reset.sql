-- ⚠️ 파괴적 작업(destructive): 기존 테이블(profiles/saved_items/usage_logs/subscriptions)과
-- 그 안의 모든 데이터를 전부 삭제한 뒤, 최신 스키마(schema.sql과 동일한 내용)로 다시 만든다.
-- Supabase 대시보드 → SQL Editor에서 "한 번만" 실행하는 용도. 실행하면 지금까지 저장된
-- 프로필/찜한 코디/사용량 기록/구독 정보가 전부 사라지고 되돌릴 수 없으니, 정말 다 지우고
-- 새로 시작해도 되는 상황(예: 개발 중 테스트 데이터만 있는 상태)에서만 실행할 것.
-- 실행 후에는 이 파일 대신 schema.sql이 최신 스키마의 기준(source of truth)이 된다.

drop table if exists saved_items cascade;
drop table if exists usage_logs cascade;
drop table if exists subscriptions cascade;
drop table if exists profiles cascade;

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  -- 기본 정보 (모든 티어 공통, 항상 입력)
  gender text,
  age integer,
  height numeric,
  weight numeric,
  -- "상세조건 더보기"로 접어둔 선택 입력 (모든 티어 공통)
  bust numeric,
  waist numeric,
  hip numeric,
  leg_length numeric,
  season text,
  tpo text,
  preferred_mood text,
  -- 프리미엄 상세조건 (프리미엄 전용)
  personal_color text,
  face_shape text,
  body_complex text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  tier text,              -- 'member' | 'premium' (result 컬럼의 JSON 형태가 티어별로 다름)
  title text,
  description text,
  tags text[],
  image_url text,
  season text,            -- 마이페이지 필터용 메타데이터 (2-3)
  tpo text,
  result jsonb,            -- AI가 생성한 원본 결과 전체 (나중에 진단 내용 복기용)
  saved_at timestamptz default now()
);

create table usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  usage_date date default current_date,
  count integer default 0,
  unique (user_id, usage_date)
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  plan text default 'free',
  status text default 'inactive',
  started_at timestamptz,
  expires_at timestamptz
);

alter table profiles enable row level security;
alter table saved_items enable row level security;
alter table usage_logs enable row level security;
alter table subscriptions enable row level security;

create policy "profiles: 본인만" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "saved_items: 본인만" on saved_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- usage_logs는 클라이언트가 직접 쓰면 사용자가 자기 한도를 마음대로 조작할 수 있으므로
-- 조회(select)만 허용한다. 실제 증가/체크는 서비스 롤 키를 쓰는 generate-recommendation
-- Edge Function에서만 수행한다 (RLS를 우회하는 서비스 롤이라 이 정책의 영향을 받지 않음).
create policy "usage_logs: 본인만 조회" on usage_logs for select using (auth.uid() = user_id);
create policy "subscriptions: 본인만 조회" on subscriptions for select using (auth.uid() = user_id);
