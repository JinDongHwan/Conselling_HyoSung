-- magic.ai initial schema
create extension if not exists vector;

-- ───────── 사용자 ─────────
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  nickname text,
  birth_year int,                -- 성인(만 19세 이상) 여부는 가입 화면에서 검증
  tone_pref text default 'warm' check (tone_pref in ('warm', 'plain')),
  role text not null default 'user' check (role in ('user', 'admin')),
  consent_admin_view boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- 가입 시 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, nickname)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'nickname'));
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ───────── 상담 ─────────
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  title text,
  summary text,
  topics text[] default '{}',
  mood_start int check (mood_start between 1 and 10),
  mood_end int check (mood_end between 1 and 10),
  risk_level text not null default 'low' check (risk_level in ('low', 'mid', 'high')),
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources jsonb default '[]',
  risk_flag text check (risk_flag in ('low', 'mid', 'high')),
  created_at timestamptz not null default now()
);

create table public.mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  score int not null check (score between 1 and 10),
  note text,
  created_at timestamptz not null default now()
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  type text not null,            -- 'PHQ-9', 'GAD-7' ...
  score int not null,
  answers jsonb,
  created_at timestamptz not null default now()
);

-- ───────── 관리자 ─────────
create table public.admin_alerts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  risk_level text not null,
  status text not null default 'new' check (status in ('new', 'checked', 'resolved')),
  memo text,
  handled_by uuid references profiles,
  created_at timestamptz not null default now()
);

create table public.admin_audit_logs (
  id bigint generated always as identity primary key,
  admin_id uuid not null references profiles,
  action text not null,          -- 'view_messages', 'update_alert', ...
  target_id uuid,
  created_at timestamptz not null default now()
);

-- ───────── 지식베이스 (RAG) ─────────
create table public.documents (
  id bigint generated always as identity primary key,
  content text not null,
  metadata jsonb not null default '{}',   -- title, category, source_url, chunk_index, file
  embedding vector(1536)                  -- OpenAI text-embedding-3-small
);
create index on public.documents using hnsw (embedding vector_cosine_ops);

create or replace function public.match_documents(
  query_embedding vector(1536),
  match_count int default 5,
  filter jsonb default '{}'
) returns table (id bigint, content text, metadata jsonb, similarity float)
language sql stable as $$
  select id, content, metadata, 1 - (embedding <=> query_embedding) as similarity
  from documents
  where metadata @> filter
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- ───────── RLS ─────────
alter table profiles enable row level security;
alter table sessions enable row level security;
alter table messages enable row level security;
alter table mood_logs enable row level security;
alter table assessments enable row level security;
alter table admin_alerts enable row level security;
alter table admin_audit_logs enable row level security;
alter table documents enable row level security;

-- 본인 데이터
-- 본인 프로필 수정 가능, 단 스스로 admin 으로 올릴 수는 없음
create policy "own profile" on profiles for all using (id = auth.uid()) with check (id = auth.uid() and (role = 'user' or is_admin()));
create policy "own sessions" on sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own messages" on messages for all
  using (exists (select 1 from sessions s where s.id = session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy "own moods" on mood_logs for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own assessments" on assessments for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 관리자: 요약·위험도는 열람, 원문은 high 위험 또는 동의한 경우만
create policy "admin read profiles" on profiles for select using (is_admin());
create policy "admin read sessions" on sessions for select using (is_admin());
create policy "admin read messages" on messages for select using (
  is_admin() and exists (
    select 1 from sessions s join profiles p on p.id = s.user_id
    where s.id = session_id and (s.risk_level = 'high' or p.consent_admin_view)
  )
);
create policy "admin read moods" on mood_logs for select using (is_admin());
create policy "admin read assessments" on assessments for select using (is_admin());
create policy "admin alerts" on admin_alerts for all using (is_admin()) with check (is_admin());
create policy "admin audit insert" on admin_audit_logs for insert with check (is_admin() and admin_id = auth.uid());
create policy "admin audit read" on admin_audit_logs for select using (is_admin());
create policy "admin documents" on documents for all using (is_admin()) with check (is_admin());
-- documents 검색은 서버(service role)에서 match_documents 호출
