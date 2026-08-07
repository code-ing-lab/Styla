create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  gender text,
  age integer,
  height numeric,
  weight numeric,
  bust numeric,
  waist numeric,
  hip numeric,
  leg_length numeric,
  personal_color text,
  face_shape text,
  body_complex text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  description text,
  tags text[],
  image_url text,
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
create policy "usage_logs: 본인만" on usage_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "subscriptions: 본인만 조회" on subscriptions for select using (auth.uid() = user_id);
