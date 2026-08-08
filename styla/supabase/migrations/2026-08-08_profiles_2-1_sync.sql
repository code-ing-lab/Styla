-- 2-1(초기 입력 폼 간소화)에 맞춰 profiles 테이블 스키마를 정리하는 마이그레이션.
-- Supabase 대시보드 → SQL Editor에서 그대로 실행하면 된다.
-- 기존 데이터를 지우지 않고 ALTER로만 맞추도록 작성했고, 두 번 실행해도 안전하다(idempotent).

-- 1. 테이블 자체가 아직 없으면(처음 세팅하는 경우) 최신 스키마로 새로 만든다.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  gender text,
  age integer,
  height numeric,
  weight numeric,
  bust numeric,
  waist numeric,
  hip numeric,
  leg_length numeric,
  season text,
  tpo text,
  preferred_mood text,
  personal_color text,
  face_shape text,
  body_complex text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. 예전 스키마로 이미 테이블이 있었다면 부족한 컬럼만 추가한다.
alter table profiles add column if not exists season text;
alter table profiles add column if not exists tpo text;
alter table profiles add column if not exists preferred_mood text;

-- 3. body_complex가 예전처럼 text[]였다면 text(직접입력)로 변환한다.
--    이미 text 타입이면(방금 새로 만든 테이블 등) 아무 것도 하지 않는다.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'profiles' and column_name = 'body_complex' and data_type = 'ARRAY'
  ) then
    alter table profiles alter column body_complex type text using array_to_string(body_complex, ', ');
  end if;
end $$;

-- 4. RLS: 본인 프로필만 조회/수정 가능 (테이블이 방금 생성됐어도, 이미 있었어도 안전하게 재적용)
alter table profiles enable row level security;

drop policy if exists "profiles: 본인만" on profiles;
create policy "profiles: 본인만" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
