-- 약관 동의 기록: 어떤 버전에, 언제 동의했는지 남긴다 (법적 증빙)
-- 약관이 바뀌면 코드의 POLICY_VERSION만 올리면, 버전이 다른 사용자는 다음 접속 때 다시 동의한다.
alter table public.profiles
  add column if not exists policy_version text,          -- 동의한 약관 버전 (예: 2026-10-05)
  add column if not exists terms_agreed_at timestamptz,  -- 이용약관 동의 시각
  add column if not exists privacy_agreed_at timestamptz, -- 개인정보 수집·이용 동의 시각
  add column if not exists sensitive_agreed_at timestamptz; -- 민감정보(상담 내용) 처리 동의 시각
