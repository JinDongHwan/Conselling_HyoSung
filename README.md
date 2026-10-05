# magic.ai

성인을 위한 **RAG 기반 AI 심리상담 웹서비스**입니다.
공공기관 정신건강 자료를 지식베이스로 삼아 근거 있는 답변을 하고, 위기 신호가 보이면 전문 상담 창구를 먼저 안내합니다.

> ⚠️ magic.ai는 전문 상담이나 의료 서비스를 대체하지 않습니다.
> 위기 상황이라면 **자살예방상담전화 109**, **정신건강위기상담 1577-0199**, **응급 119**로 연락하세요.

---

## 주요 기능

**사용자 (`/dashboard`)**
- **심리상담**: 실시간 스트리밍 답변, 참고 자료 출처 표시, 상담 종료 시 AI 요약·주제 분류
- **과거 기록**: 상담 요약·대화 전문 보기, 검색, 주제 필터, 삭제
- **데이터**: 기분 점수 추이, PHQ-9(우울)·GAD-7(불안) 자가진단과 점수 변화, 자주 나온 주제
- **마이페이지**: AI 말투(따뜻하게/담백하게), 상담사 원문 열람 동의, 탈퇴

**상담사·관리자 (`/admin`)**
- 운영 현황, 위기 알림(처리 상태·조치 메모), 사용자 관리, 지식베이스 검색 테스트, 리포트
- 관리자는 기본적으로 AI 요약과 위험도만 볼 수 있습니다. 대화 원문은 위기 세션이거나 사용자가 동의한 경우에만 DB 규칙(RLS)으로 열리며, 열람할 때마다 기록이 남습니다.

**안전장치**
- 메시지마다 키워드 검사 + AI 분류로 위험도(안정/주의/위기)를 판단
- 위기로 판단되면 AI 답변 대신 고정 안내(109·1577-0199·119)를 보여 주고 관리자에게 알림
- 만 19세 이상만 가입, 민감정보 수집 동의 절차

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 웹 | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| AI | OpenAI 호환 API — **Open AI Service Hub(open.hasa.re.kr)** 기본: 상담 `exaone-4.0-32b`, 분류·요약 `gpt-oss-20b`, 임베딩 `bge-m3` / OpenAI로 전환 가능 |
| DB·인증 | Supabase (Postgres + pgvector, Auth: 이메일·카카오) |
| 디자인 | Pretendard, sangnyang.ai 구성 참고 |

## 동작 흐름

```
사용자 메시지
  → 위기 분류 (키워드 + gpt-5.4-mini)
      ├─ 위기: 고정 안내 + 관리자 알림
      └─ 그 외: 질문 임베딩 → pgvector 유사 문서 검색(top 5)
               → 시스템 프롬프트 + 참고 자료 + 최근 대화 → gpt-5.5 스트리밍 답변
  → 대화 저장 → 상담 종료 시 요약·주제 태깅
```

## 폴더 구조

```
magic.ai/
├─ PLAN.md                  개발 계획서
├─ crawl/
│  ├─ sources.md            크롤링 대상 목록 + Cowork 작업 지시문
│  └─ raw/                  크롤링 원문 (카테고리별)
├─ knowledge/               정제된 지식베이스 md (챗봇이 참고하는 문서)
├─ supabase/migrations/     DB 스키마, pgvector, RLS
└─ web/                     Next.js 앱
   ├─ app/                  페이지 (/, /login, /dashboard/*, /admin/*, /api/*)
   ├─ components/           공통 UI (사이드바, 차트, 위기 안내 카드 등)
   ├─ lib/                  RAG, 안전 분류, 프롬프트, 데이터 접근, Supabase
   └─ scripts/ingest.ts     knowledge → 임베딩 → Supabase 적재
```

## 시작하기

### 1. 설치와 실행

```bash
cd web
npm install
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.
API 키가 없으면 **데모 모드**로 실행되어, 로그인 없이 예시 데이터로 모든 화면을 둘러볼 수 있습니다.

### 2. Supabase 설정

1. [supabase.com](https://supabase.com)에서 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase/migrations/0001_init.sql`을 실행합니다.
3. 카카오 로그인: [developers.kakao.com](https://developers.kakao.com)에서 앱을 만들고, Supabase 대시보드 → Authentication → Providers → Kakao에 REST API 키와 Client Secret을 입력합니다.
   - Redirect URI: `https://<프로젝트>.supabase.co/auth/v1/callback`

### 3. 환경 변수

`web/.env.example`을 `web/.env.local`로 복사한 뒤 값을 채웁니다.

```bash
HASA_API_KEY=          # open.hasa.re.kr 개발키 (있으면 우선 사용)
OPENAI_API_KEY=        # 또는 OpenAI 키
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
# 선택: AI_CHAT_MODEL, AI_UTILITY_MODEL, AI_EMBEDDING_MODEL
```

> `.env.local`과 키가 담긴 파일은 `.gitignore`로 제외되어 있습니다. 절대 커밋하지 마세요.

### 4. 지식베이스 적재

1. `knowledge/카테고리/` 폴더에 md 파일을 넣거나 고친 뒤 `git push` 합니다. 배포할 때 문서가 자동으로 묶여 함께 올라갑니다(`web/scripts/bundle-knowledge.mjs`).
2. 관리자 화면 **/admin/knowledge** 에서 **[지식베이스 갱신]** 을 누르면 바뀐 문서만 임베딩해서 Supabase에 저장합니다. 키는 Vercel 서버에만 있으면 됩니다.

로컬에서 직접 넣으려면(키를 `web/.env.local` 에 둬야 함):

```bash
cd web
npm run ingest          # 변경분만
npm run ingest -- --all # 전체 다시
```

md 파일 형식:

```markdown
---
title: 우울증의 주요 증상
category: 01_우울
source_url: https://...
---
## 핵심 요약
## 주요 내용
## 스스로 할 수 있는 대처
## 전문가 도움이 필요한 신호
```

### 5. 관리자 지정

가입 후 Supabase의 `profiles` 테이블에서 해당 계정의 `role`을 `admin`으로 바꾸면 `/admin`에 접근할 수 있습니다.

## 스크립트 (`web/`)

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run ingest` | 지식베이스 임베딩 적재 |

## 배포 전 확인할 것

- [ ] `knowledge/99_위기대응·기관안내/crisis.md`의 연락처 최신 여부 확인 후 `reviewed: true`
- [ ] PHQ-9·GAD-7 문항을 타당도가 검증된 한국어판으로 교체 (`web/lib/assessments.ts`)
- [ ] 사용할 OpenAI 모델이 계정에서 사용 가능한지 확인
- [ ] 개인정보처리방침·이용약관 작성 (민감정보 처리 포함)
- [ ] 위기 대응 시나리오 테스트
