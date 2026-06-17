# Proofolio 무료 고정 배포 가이드

현재 `pnpm share`는 Cloudflare quick tunnel을 사용하므로 계정 없이 무료로 외부
공개가 가능하지만, URL은 임시 주소입니다. 고정 무료 사이트가 필요하면
Next.js 배포는 Vercel Hobby, 계정별 워크스페이스 저장은 Supabase Free 조합을
권장합니다.

## 현재 프로젝트 위치

현재 Proofolio 프로젝트의 실제 로컬 위치는 아래 경로입니다.

```bash
/Users/hyuk/Desktop/Python/proofolio
```

아래 명령은 모두 이 폴더에서 실행합니다.

```bash
cd "/Users/hyuk/Desktop/Python/proofolio"
```

연결할 때 확인할 주요 파일 위치는 다음과 같습니다.

- `.env.local`: Supabase 연결값을 직접 입력하는 파일입니다. 현재 템플릿이 생성되어 있습니다.
- `.env.example`: 필요한 환경변수 이름을 확인하는 예시 파일입니다.
- `scripts/check-supabase-storage.mjs`: Supabase 저장/읽기/삭제를 검증하는 스크립트입니다.
- `lib/auth/account-store.ts`: Supabase 연결값이 있으면 웹 저장소로 전환하는 서버 저장 로직입니다.
- `.proofolio-data/accounts.json`: Supabase 미연결 시 사용하는 로컬 계정 저장 파일입니다.

## 권장 구성

- 웹 호스팅: Vercel Hobby
- 계정 워크스페이스 저장: Supabase Free
- 로컬 개발/임시 터널: 기존 `.proofolio-data/accounts.json` 파일 저장 유지

Supabase 환경변수가 없으면 기존 로컬 파일 저장소를 사용합니다. 환경변수가
있으면 서버 API가 자동으로 Supabase REST 저장소를 사용합니다.

## Supabase 테이블 생성

Supabase 프로젝트를 만든 뒤 SQL Editor에서 아래 SQL을 실행합니다.

클릭 순서:

1. Supabase Dashboard에 로그인합니다.
2. `New project`를 눌러 프로젝트를 생성합니다.
3. 왼쪽 메뉴에서 `SQL Editor`를 엽니다.
4. `New query`를 누릅니다.
5. 아래 SQL을 그대로 붙여 넣습니다.
6. `Run`을 눌러 실행합니다.

```sql
create table if not exists public.proofolio_accounts (
  id text primary key,
  email text not null unique,
  name text not null,
  password_salt text not null,
  password_hash text not null,
  workspace jsonb not null,
  sessions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

alter table public.proofolio_accounts enable row level security;
```

별도 RLS policy는 만들지 않습니다. 앱 서버에서만 `SUPABASE_SECRET_KEY` 또는
레거시 `SUPABASE_SERVICE_ROLE_KEY`로 접근하고, 브라우저에는 이 키를 노출하지
않습니다.

## Supabase 키 확인

클릭 순서:

1. Supabase Dashboard에서 방금 만든 프로젝트를 엽니다.
2. 왼쪽 하단 또는 사이드바의 `Project Settings`를 엽니다.
3. `API Keys` 메뉴로 이동합니다.
4. `Project URL` 값을 복사해 `SUPABASE_URL`에 넣습니다.
5. 서버용 `secret` 키를 복사해 `SUPABASE_SECRET_KEY`에 넣습니다.
6. 오래된 Supabase 프로젝트라 `secret` 키가 보이지 않으면 `service_role` 키를
   `SUPABASE_SECRET_KEY` 또는 `SUPABASE_SERVICE_ROLE_KEY`에 넣습니다.

주의:

- `SUPABASE_SECRET_KEY` 또는 `service_role` 키는 브라우저에 노출하면 안 됩니다.
- 환경변수 이름에 `NEXT_PUBLIC_`을 붙이면 안 됩니다.
- `anon` 또는 `publishable` 키는 이 앱의 서버 저장소 연결용 키가 아닙니다.

## 로컬 연결

현재 프로젝트 위치에서 `.env.local` 파일을 엽니다.

```bash
cd "/Users/hyuk/Desktop/Python/proofolio"
open -a TextEdit .env.local
```

아래 형식으로 Supabase 값을 입력합니다.

```text
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SECRET_KEY=YOUR_SUPABASE_SECRET_KEY
PROOFOLIO_SUPABASE_ACCOUNTS_TABLE=proofolio_accounts
```

값을 저장한 뒤 연결을 확인합니다.

```bash
cd "/Users/hyuk/Desktop/Python/proofolio"
pnpm storage:check
```

성공 메시지:

```text
Supabase 웹 저장소 연결 확인 완료: proofolio_accounts 테이블에 저장/읽기/삭제가 정상 동작합니다.
```

그 다음 앱을 다시 빌드하고 실행합니다.

```bash
pnpm build
pnpm start
```

브라우저에서 아래 주소를 열어 저장소 상태를 확인합니다.

```text
http://localhost:3000/api/storage/status
```

또는 현재 공유 서버를 3100번 포트로 실행 중이라면:

```text
http://127.0.0.1:3100/api/storage/status
```

정상 연결이면 응답의 `label`이 `Supabase 웹 저장소`로 표시됩니다.

## Vercel 환경변수

Vercel 프로젝트의 Environment Variables에 아래 값을 추가합니다.

```text
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SECRET_KEY=YOUR_SUPABASE_SECRET_KEY
PROOFOLIO_SUPABASE_ACCOUNTS_TABLE=proofolio_accounts
```

`SUPABASE_SECRET_KEY`는 Supabase Project Settings > API Keys에서 서버용 Secret
key를 만들어 입력합니다. 레거시 프로젝트라면 `SUPABASE_SERVICE_ROLE_KEY`도
지원합니다. 이 값은 서버 전용 비밀 키이므로 `NEXT_PUBLIC_` 접두사를 붙이지
마세요.

클릭 순서:

1. Vercel Dashboard에서 Proofolio 프로젝트를 엽니다.
2. `Settings`로 이동합니다.
3. `Environment Variables`를 엽니다.
4. 아래 3개 값을 추가합니다.
5. Environment는 우선 `Production`, `Preview`, `Development` 모두 선택합니다.
6. 저장 후 `Deployments`에서 최신 배포를 `Redeploy`합니다.

추가할 값:

```text
SUPABASE_URL
SUPABASE_SECRET_KEY
PROOFOLIO_SUPABASE_ACCOUNTS_TABLE
```

Vercel 배포 후 확인 주소:

```text
https://YOUR_VERCEL_DOMAIN.vercel.app/api/storage/status
```

정상 연결이면 `Supabase 웹 저장소`가 표시됩니다.

## 연결 확인

환경변수를 `.env.local`에 넣은 뒤 아래 명령으로 Supabase 테이블에 저장/읽기/삭제가
되는지 확인할 수 있습니다.

```bash
cd "/Users/hyuk/Desktop/Python/proofolio"
pnpm storage:check
```

앱에서는 `/login` 화면의 저장소 상태 박스 또는 `/api/storage/status` 응답으로
현재 저장 방식이 `Supabase 웹 저장소`인지 확인할 수 있습니다.

## 연결 실패 시 확인할 것

- `pnpm storage:check`에서 `Supabase 연결값이 없습니다`가 나오면 `.env.local`
  파일에 `SUPABASE_URL`과 `SUPABASE_SECRET_KEY`가 비어 있는 상태입니다.
- `Supabase 계정 저장소를 읽지 못했습니다`가 나오면 SQL 테이블 이름,
  `PROOFOLIO_SUPABASE_ACCOUNTS_TABLE`, API 키를 확인합니다.
- `/api/storage/status`가 `로컬 파일 저장소`로 나오면 Supabase 환경변수가 현재
  실행 중인 서버에 적용되지 않은 상태입니다. 서버를 재시작하거나 Vercel에서
  Redeploy해야 합니다.
- Vercel에서만 안 되면 Environment Variables가 `Production` 환경에 들어갔는지
  확인합니다.
- `SUPABASE_SECRET_KEY` 대신 `anon` 키를 넣으면 서버 저장 권한이 부족할 수
  있습니다.

## Vercel 배포

1. 이 폴더를 GitHub 저장소에 올립니다.
2. Vercel에서 `Add New Project`를 선택하고 GitHub 저장소를 가져옵니다.
3. Framework는 Next.js로 자동 감지됩니다.
4. 위 Supabase 환경변수를 추가합니다.
5. Deploy를 실행합니다.
6. 배포 URL에서 `/login`에 접속해 계정을 생성하고, 업로드/분석 진행 상태가
   같은 계정에서 유지되는지 확인합니다.

## 현재 임시 무료 공개

계정 없이 바로 외부에 보여줄 때는 계속 아래 명령을 사용할 수 있습니다.

```bash
pnpm share
```

이 방식은 Mac과 터미널이 켜져 있는 동안만 유지됩니다. 장기 운영용 고정 URL은
Vercel 또는 Cloudflare의 계정 기반 배포가 필요합니다.
