# magic.ai — RAG 기반 심리상담 챗봇 개발 계획

> 레퍼런스: https://sangnyang.ai (히어로 + CTA 버튼 → 서비스 흐름 → 주요 기능 → 활용 분야 → 푸터 구조)

---

## 0. 전체 흐름

```
[1] Cowork + Chrome 스킬로 크롤링
        ↓  (출처별 원문 수집)
[2] Markdown 정리 (knowledge/*.md, frontmatter 메타데이터 포함)
        ↓
[3] 청킹 → 임베딩 → 벡터DB(pgvector) 적재
        ↓
[4] 웹앱 (랜딩 → 대시보드: 상담 / 마이페이지 / 데이터 / 과거기록)
        ↓
[5] 상담 요청 → 위기 감지 → 벡터 검색 → OpenAI(ChatGPT) 응답 생성(스트리밍) → 기록 저장
```

---

## 1. 기술 스택 (추천)

| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | **Next.js 16 (App Router) + TypeScript** | 랜딩·대시보드·API를 한 프로젝트로 |
| UI | Tailwind CSS + shadcn/ui, Recharts(차트) | 상냥이 같은 부드러운 카드형 UI를 빠르게 |
| 인증·DB | **Supabase** (Auth + Postgres + **pgvector**) | 회원·상담기록·벡터검색을 한 곳에서 |
| LLM | **OpenAI API** (상담 `gpt-5.5`, 위기분류·요약 `gpt-5.4-mini` — `.env.local`에서 변경 가능) | 임베딩과 같은 SDK·키 하나로 통일 |
| 임베딩 | **OpenAI `text-embedding-3-small`** (1536차원) | 한국어 성능·비용 균형 |
| 로그인 | Supabase Auth — **이메일 + 카카오 OAuth** | Supabase가 Kakao provider 기본 지원 |
| 배포 | Vercel + Supabase Cloud | 설정 최소 |

---

## 2. 폴더 구조

```
magic.ai/
├─ PLAN.md
├─ crawl/                      # 1단계: 크롤링 원자료
│  ├─ sources.md               # 수집 대상 URL·카테고리·라이선스 메모
│  └─ raw/                     # Cowork가 저장한 원문(.md)
├─ knowledge/                  # 2단계: 정제된 지식베이스
│  ├─ 01_우울/
│  ├─ 02_불안·공황·트라우마/
│  ├─ 03_스트레스·번아웃/
│  ├─ 04_수면/
│  ├─ 05_대인관계·가족·직장/
│  ├─ 06_자존감·정서조절/
│  ├─ 07_상담기법(CBT·마음챙김)/
│  └─ 99_위기대응·기관안내/
├─ web/scripts/
│  └─ ingest.ts                # 3단계: npm run ingest (web 폴더)
├─ supabase/migrations/        # 테이블·pgvector·RLS
└─ web/                        # 4단계: Next.js 앱
   ├─ app/
   │  ├─ page.tsx              # 랜딩 (magic.ai 홈)
   │  ├─ login/
   │  ├─ dashboard/
   │  │  ├─ layout.tsx         # 사이드바
   │  │  ├─ page.tsx           # 대시보드 홈(요약)
   │  │  ├─ counsel/           # 심리상담 채팅
   │  │  ├─ records/           # 과거 상담 기록
   │  │  ├─ data/              # 감정·검사 데이터 시각화
   │  │  └─ mypage/            # 마이페이지
   │  ├─ admin/                # 관리자(상담사) 화면 — role=admin만 접근
   │  │  ├─ page.tsx           # 운영 현황
   │  │  ├─ alerts/            # 위기 알림
   │  │  ├─ users/             # 사용자 관리
   │  │  ├─ knowledge/         # 지식베이스 관리
   │  │  └─ reports/           # 통계·리포트
   │  └─ api/chat/route.ts     # RAG + 스트리밍
   └─ lib/ (rag.ts, safety.ts, supabase.ts, prompts.ts)
```

---

## 3. 단계별 계획

### Phase 1 — 크롤링 (Cowork + Chrome 스킬)

**수집 대상 (공공·신뢰 출처 우선)**
- 국가정신건강정보포털 (mentalhealth.go.kr) — 질환 정보, 자가검진
- 보건복지부 / 국립정신건강센터 / 중앙자살예방센터
- 한국상담심리학회·한국심리학회 공개 자료
- WHO, NIMH 등 해외 공개 자료(번역·요약)
- 공개된 표준 척도 설명(PHQ-9, GAD-7 등 — 문항 사용은 라이선스 확인)

**Cowork 작업 지시 템플릿**
```
Chrome으로 [URL]에 접속해서 [카테고리] 관련 페이지들을 순회해줘.
각 페이지 본문만 추출해서 crawl/raw/[카테고리]/[slug].md 로 저장하고,
맨 위에 frontmatter로 title, source_url, category, crawled_at 을 적어줘.
광고·메뉴·푸터는 제외해.
```

**주의**
- robots.txt·이용약관 확인, 원문 전재 대신 **요약·재구성**해서 저장 (저작권)
- 출처 URL은 반드시 남겨서 챗봇 답변에 근거로 표시

### Phase 2 — Markdown 정리

각 문서 형식:
```markdown
---
title: 우울증의 주요 증상
category: 우울
tags: [증상, 자가점검]
source_url: https://...
audience: 일반 성인
updated: 2026-09-30
---
## 핵심 요약
## 증상
## 스스로 할 수 있는 대처
## 전문가 도움이 필요한 신호
```
- Cowork로 raw → knowledge 로 정제(중복 제거, 소제목 통일)
- `99_위기대응·기관안내` 는 **사람이 직접 검수**
  (자살예방상담 109, 정신건강위기상담 1577-0199, 청소년 1388, 응급 119)

### Phase 3 — RAG 파이프라인

1. **청킹**: `##` 헤더 단위 + 최대 ~500토큰, 100토큰 오버랩, 메타데이터 유지
2. **임베딩 → Supabase `documents` 테이블** (`content, embedding vector, metadata jsonb`)
3. **검색**: `match_documents` RPC (코사인 유사도 top-k=5) + 카테고리 필터
4. **생성**: 시스템 프롬프트(공감적 상담 톤, 진단·처방 금지, 근거 기반) + 검색 문맥 + 최근 대화 → OpenAI 스트리밍
5. **출처 표시**: 답변 하단에 참고한 문서 제목·링크

### Phase 4 — 안전장치 (필수)

- 매 메시지마다 **위기 분류**(Haiku): 자해·자살·타해·학대 신호 → 위험도 low/mid/high
- high → LLM 답변 대신 **고정 위기 안내 카드**(109 / 1577-0199 / 119) 우선 노출, 기록에 플래그
- 첫 진입 시 고지: "AI는 전문 상담·의료를 대체하지 않습니다"
- 개인정보: 상담 내용은 민감정보 → 동의 절차, Supabase RLS로 본인만 조회, 삭제 기능 제공

### Phase 5 — 웹 페이지

**랜딩 (`/`) — sangnyang.ai 구성 참고**
1. 헤더: magic.ai 로고 / 로그인
2. 히어로: 메인 카피 + **[상담 시작하기] 버튼 → `/dashboard`** (비로그인 시 `/login`)
3. 신뢰 지표 섹션 (지식베이스 문서 수, 24시간 이용 등)
4. 서비스 흐름: 대화 → AI 분석 → 맞춤 콘텐츠·리포트
5. 주요 기능 카드: AI 상담 / 자가진단 / 감정 기록 / 위기 연계
6. 활용 분야 · FAQ · 푸터(개인정보처리방침, 이용약관, 위기상담 번호)

**대시보드 (`/dashboard`) — 좌측 사이드바**
| 메뉴 | 내용 |
|---|---|
| 홈 | 오늘의 기분 체크, 최근 상담 요약, 이번 주 감정 그래프 |
| 💬 심리상담 | 채팅 UI(스트리밍), 대화 시작 시 기분 선택, 출처 표시, 위기 카드 |
| 📊 데이터 | 감정 추이 차트, 자주 나온 주제, 자가진단(PHQ-9/GAD-7) 점수 변화 |
| 🗂 과거 기록 | 세션 목록(날짜·주제·AI 요약), 검색, 상세 대화 보기, 삭제 |
| 👤 마이페이지 | 프로필, 상담 선호 톤(따뜻하게/담백하게), 알림, 데이터 내보내기·탈퇴 |

**관리자 (`/admin`) — `profiles.role = 'admin'` 만 접근 (미들웨어 + RLS)**
| 메뉴 | 내용 |
|---|---|
| 운영 현황 | 가입자 수, 일간 상담 수, 평균 기분 점수, 위험도 분포 |
| 🚨 위기 알림 | risk_level=high 세션 실시간 목록, 확인/조치 메모, 처리 상태 |
| 사용자 관리 | 사용자 목록, 상담 횟수·최근 위험도, 계정 정지 |
| 지식베이스 | knowledge 문서 목록, 업로드·수정 후 재임베딩, 검색 테스트 |
| 리포트 | 주제별 상담 빈도, 자가진단 점수 추이, 월간 리포트 |

> 개인정보 원칙: 관리자는 기본적으로 **AI 요약·위험도만** 열람. 대화 원문은 위기(high) 세션 + 가입 시 동의한 경우에만 열람, 열람 이력은 `admin_audit_logs`에 기록.

### Phase 6 — DB 스키마

```
profiles        (id, nickname, birth_year, tone_pref, role 'user'|'admin', consent_admin_view, created_at)
admin_alerts    (id, session_id, user_id, risk_level, status 'new'|'checked'|'resolved', memo, handled_by, created_at)
admin_audit_logs(id, admin_id, action, target_id, created_at)
sessions        (id, user_id, title, summary, mood_start, mood_end, risk_level, created_at)
messages        (id, session_id, role, content, sources jsonb, risk_flag, created_at)
mood_logs       (id, user_id, score 1-10, note, created_at)
assessments     (id, user_id, type, score, answers jsonb, created_at)
documents       (id, content, embedding vector(1536), metadata jsonb)
```
- 세션 종료 시 OpenAI로 요약·주제 태그 자동 생성 → 과거기록/데이터 페이지에 활용

---

## 4. 일정 (예시, 4주)

| 주차 | 작업 |
|---|---|
| 1주 | 출처 선정, Cowork 크롤링, md 정제, 위기대응 문서 검수 |
| 2주 | Next.js·Supabase 세팅, 스키마, ingest 스크립트, `/api/chat` RAG |
| 3주 | 랜딩, 대시보드 4개 페이지, 이메일·카카오 인증 |
| 4주 | 관리자 화면(위기 알림·지식베이스), 위기감지·안전 테스트, 답변 품질 평가(질문 50개 셋), 배포 |

---

## 5. 확정 사항 (2026-09-30)

- [x] 대상 사용자: **성인** (만 19세 이상 — 가입 시 연령 확인)
- [x] 임베딩: **OpenAI text-embedding-3-small**
- [x] 로그인: **이메일 + 카카오**
- [x] 관리자(상담사) 화면: **포함** (`/admin`)

## 6. 준비물 (API 키 — `.env.local`에 직접 입력)

- `OPENAI_API_KEY` — platform.openai.com
- Supabase 프로젝트 URL / anon key / service role key — supabase.com
- 카카오 REST API 키 + Client Secret — developers.kakao.com (Redirect URI: `https://<supabase-project>.supabase.co/auth/v1/callback`)
