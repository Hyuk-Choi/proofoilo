# Proofolio

Proofolio는 프로젝트 파일과 활동 기록을 채용 담당자가 이해할 수 있는
직무 역량 중심의 커리어 콘텐츠로 전환하는 SaaS형 웹앱입니다.

업로드한 파일을 먼저 분석 리포트로 정리한 뒤, 사용자가 검토한 분석 결과를
바탕으로 포트폴리오, 자기소개서, 이력서 문장, 전문가 피드백, 면접 질문,
개인 브랜딩, 스킬 분석, Export 문서를 생성합니다.

Proofolio 화면에서는 커리어 브랜딩 워크스페이스만 노출합니다.

## 현재 파일 위치

현재 이 프로젝트의 실제 로컬 위치는 아래 경로입니다.

```bash
/Users/hyuk/Desktop/Python/proofolio
```

Supabase 웹 저장소를 연결할 때 수정하거나 확인할 파일은 다음과 같습니다.

- 환경변수 입력: `/Users/hyuk/Desktop/Python/proofolio/.env.local`
- 환경변수 예시: `/Users/hyuk/Desktop/Python/proofolio/.env.example`
- 무료 배포 가이드: `/Users/hyuk/Desktop/Python/proofolio/docs/free-site-deployment.md`
- 저장소 연결 테스트: `/Users/hyuk/Desktop/Python/proofolio/scripts/check-supabase-storage.mjs`
- 로컬 계정 저장 파일: `/Users/hyuk/Desktop/Python/proofolio/.proofolio-data/accounts.json`

`.env.local`은 Supabase 키를 붙여 넣을 수 있도록 템플릿으로 생성되어 있습니다.
이전 작업 경로였던 `/Users/hyuk/Desktop/Marketing Management/Python`가 아니라
현재 경로에서 명령을 실행해야 합니다.

## 실행

다음 명령을 사용합니다.

```bash
cd "/Users/hyuk/Desktop/Python/proofolio"
pnpm install
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

같은 와이파이 안의 다른 기기에서 접속 테스트를 할 때는 다음 명령을 사용할 수
있습니다.

```bash
cd "/Users/hyuk/Desktop/Python/proofolio"
pnpm dev:public
```

## 외부 공개

Finder에서 `Proofolio 외부 공개.command`를 더블클릭하거나 다음 명령을
실행하면 프로덕션 빌드와 Cloudflare 무료 임시 HTTPS 터널이 실행됩니다.

```bash
cd "/Users/hyuk/Desktop/Python/proofolio"
pnpm share
```

터미널에 표시되는
`https://...trycloudflare.com` 주소를 외부 사용자에게 공유할 수 있습니다.

공개 주소는 해당 터미널 창과 Mac이 켜져 있는 동안만 유지됩니다. 각 사용자의
프로젝트 데이터와 프로필 정보는 비로그인 상태에서는 해당 브라우저
`localStorage`에 저장되고, 로그인 상태에서는 같은 계정 워크스페이스와
동기화됩니다.

Cloudflare quick tunnel은 계정 없이 무료로 공유하기 위한 임시 공개 방식입니다.
고정 URL 또는 장기 운영 배포가 필요하면 Vercel, Cloudflare named tunnel,
Supabase/Firebase 같은 무료 티어 계정과 관리형 저장소를 연결해야 합니다.

무료 고정 사이트 배포는 Vercel Hobby + Supabase Free 조합을 기준으로 준비되어
있습니다. 자세한 연결 절차는
[`docs/free-site-deployment.md`](docs/free-site-deployment.md)를 참고하세요.
Supabase 환경변수를 연결한 뒤 `pnpm storage:check`로 웹 저장소 저장/읽기/삭제
상태를 점검할 수 있습니다.

## 주요 기능

- 파일 업로드 및 삭제
- AI 분석 리포트
- 개인 브랜딩 프로필
- 스킬 능력 분석
- 포트폴리오 생성
- 자기소개서 생성
- 이력서 문장 생성
- 전문가 피드백
- 면접 예상 질문
- Export 텍스트 미리보기와 복사

초기 상태에는 Proofolio 사용 흐름을 보여주기 위한 샘플 프로젝트가 포함되어
있습니다. 원본 파일 바이너리는 저장하지 않으며, 업로드 목록과 분석/생성 결과는
브라우저 저장소 또는 로그인 계정 워크스페이스에 저장됩니다.
