-- 나이 정책·기관 가입·보호자 동의
-- 개인 가입은 만 19세 이상. 학생(만 19세 미만)은 학교·기관이 발급한 가입 코드로만 가입한다.
-- 만 14세 미만은 보호자(법정대리인) 동의가 확인되기 전까지 상담을 이용할 수 없다.
-- TODO(법률 검토): 보호자 동의 확인 방법, 학교와 회사의 개인정보 처리 역할(처리자/수탁자)

-- ───────── 기관 (교육청·학교·센터·기업·대학·지자체) ─────────
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('office_of_education', 'school', 'youth_center', 'company', 'university', 'public', 'other')),
  parent_id uuid references public.organizations on delete set null, -- 예: 학교 → 교육청
  allow_minors boolean not null default false,  -- 만 14~18세 가입 허용
  allow_under14 boolean not null default false, -- 만 14세 미만 가입 허용 (보호자 동의 필수)
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 기관 가입 코드 (학교·학급별로 여러 개 발급)
create table if not exists public.org_invite_codes (
  code text primary key,
  org_id uuid not null references public.organizations on delete cascade,
  label text,                       -- 예: 3학년 2반
  expires_at timestamptz,
  max_uses int,
  used_count int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ───────── 프로필: 생년월일·소속 기관 ─────────
alter table public.profiles
  add column if not exists birth_date date,
  add column if not exists org_id uuid references public.organizations on delete set null;

-- ───────── 보호자 동의 (만 14세 미만) ─────────
create table if not exists public.guardian_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  status text not null default 'requested'
    check (status in ('requested', 'submitted', 'confirmed', 'rejected', 'withdrawn')),
  method text check (method in ('online', 'paper')), -- 온라인 링크 / 학교 서면 동의서
  token text unique,                                 -- 보호자에게 보내는 동의 링크용
  token_expires_at timestamptz,
  guardian_name text,                                -- 확인에 필요한 최소 정보만 보관
  guardian_relation text,
  guardian_contact text,
  policy_version text,                               -- 보호자가 동의한 약관 버전
  submitted_at timestamptz,
  confirmed_at timestamptz,
  confirmed_by uuid references public.profiles on delete set null,
  memo text,
  created_at timestamptz not null default now()
);
create index if not exists guardian_consents_user_idx on public.guardian_consents (user_id, created_at desc);

-- ───────── 보안 (RLS) ─────────
alter table public.organizations enable row level security;
alter table public.org_invite_codes enable row level security;
alter table public.guardian_consents enable row level security;

-- 기관: 관리자는 전체, 사용자는 자기 소속 기관 이름만 읽기
create policy "admin organizations" on public.organizations for all using (is_admin()) with check (is_admin());
create policy "member reads own org" on public.organizations for select
  using (id = (select org_id from public.profiles where id = auth.uid()));
-- 가입 코드: 관리자만 (코드 확인은 서버에서 서비스 키로)
create policy "admin invite codes" on public.org_invite_codes for all using (is_admin()) with check (is_admin());
-- 보호자 동의: 본인은 읽기만, 관리자는 전체 (보호자 제출은 서버에서 서비스 키로)
create policy "own guardian consent" on public.guardian_consents for select using (user_id = auth.uid());
create policy "admin guardian consents" on public.guardian_consents for all using (is_admin()) with check (is_admin());

-- 사용자가 API로 직접 바꿀 수 있는 프로필 칸을 제한한다.
-- 생년월일·소속 기관·권한·약관 동의 기록은 서버가 검증한 뒤 서비스 키로만 저장한다 (나이 정책 우회 방지).
revoke update on public.profiles from authenticated;
grant update (nickname, tone_pref, consent_admin_view) on public.profiles to authenticated;
