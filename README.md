# fo-mobile

Push의 iOS·Android 앱입니다. Expo Router로 화면을 구성하고, 탭은 홈, 허브, 소셜, 봇, 마이이고 탭 바에는 아이콘만 보입니다. 공고 상세와 허브 프로필 상세는 네이티브 크롬 안의 WebView로 fo-web을 엽니다.

화면 문구는 한국어이고, 글꼴은 Noto Sans KR입니다. 번들 ID는 iOS·Android 모두 `app.push.mobile`이고, URL 스킴은 `push`입니다.

## 주요 기능

- 홈·공고: 공고 목록과 섹션, 필터, 지원
- 허브: 프로필 탐색과 제안
- 소셜: 게시물 작성과 열람
- 봇: AI 채팅. 메시지는 SSE로 받고, 진행 중인 응답은 이어 받을 수 있습니다. 대화 목록은 탭 위에 쌓이는 스택 화면(`/sidebar`)으로 열려 탭 바까지 덮습니다
- 마이: 프로필, 서류, 활동, 북마크, 팔로우, 게시물, 제안, 설정
- 검색, 알림, 제안함, 설정(차단·공개 범위·약관)
- 로그인: Google, Apple(iOS만), GitHub, 휴대폰 번호. OAuth는 PKCE이고 콜백은 `push://auth/callback`입니다. `__DEV__` 빌드에서만 `EXPO_PUBLIC_DEV_AUTH_TOKEN`으로 들어갈 수 있습니다

기능 코드는 `src/features/`에 있고, 화면 컴포넌트는 `src/screens/`에 있습니다. 기능 디렉터리는 `auth`, `billing`, `bots`, `chat`, `home`, `hub`, `jobs`, `my`, `notifications`, `search`, `social`입니다.

## 기술 스택

| 영역 | 선택 |
| --- | --- |
| 앱 | Expo SDK 58, React Native 0.88, React 19.3, Expo Router 58 (Native Tabs, Stack) |
| 상태 | Zustand 5, TanStack Query 5 |
| UI | `@expo/ui`, `@push/design-system`, Noto Sans KR (`NotoSansKR-Regular`·`Medium`·`SemiBold`·`Bold`·`ExtraBold`) |
| HTTP | `@push/api-client` (ky) |
| 공통 | `@push/shared` |
| WebView | react-native-webview 14 |
| 테스트 | Vitest. 린트는 `expo lint` |
| 언어 | TypeScript 6.0 |

## 폴더 구조

```
src/
  app/            Expo Router 파일. 로그인 전 화면은 루트, 로그인 뒤는 (app)/(stack)
  screens/        화면 컴포넌트
  features/       기능 단위 코드
  shared/         컴포넌트, 인프라, 내비게이션
  providers/      Query Client
  theme/          토큰과 글꼴
  mock/           목업 API
assets/           아이콘, 탭 PNG, Noto Sans KR
.maestro/         Maestro E2E (flows/, visual/)
app.json
package.json
```

로그인 전 화면(`sign-in`, `phone`, `verify-phone`, `signup-terms`, `phone-registered`)은 `src/app/` 루트에 있습니다. 로그인 뒤 화면은 `(app)/(stack)` 아래에 있습니다. 그룹은 URL에 들어가지 않지만, typed routes 때문에 그룹을 쓰는 href는 `/(app)/(stack)/(tabs)/…` 전체를 적습니다.

탭 다섯 개 밖에 검색, 알림, 제안, 설정, 대화(`chat/[id]`), 게시물, 서류(`docs/[id]`)가 있습니다. 필터, 지원, 제안하기, 확인, 일정 추가, 실행 방식, 빠른 시작, 자료 같은 시트는 네이티브 폼 시트 라우트입니다.

## 개발 환경

이 저장소만으로는 설치하지 않습니다. 패키지 설치, 실행, 테스트는 [push-fe](https://github.com/push-dot/push-fe) 워크스페이스 루트에서 합니다. `pnpm-lock.yaml`과 `patches/expo-router@58.0.24.patch`는 push-fe 루트에만 있습니다.

```bash
git clone --recurse-submodules https://github.com/push-dot/push-fe.git
cd push-fe
pnpm install
pnpm --filter @push/fo-mobile start
```

Expo 패키지를 더할 때는 이 앱 디렉터리에서 `npx expo install <package>`를 씁니다. 이어서 push-fe 루트에서 `pnpm install`하고 `pnpm-lock.yaml`을 커밋합니다. 규칙이 더 있으면 `AGENTS.md`에 있습니다.

의존성을 바꾸면 이 저장소의 `package.json`과 push-fe의 `pnpm-lock.yaml`을 각각 커밋합니다. 잠금 파일을 바꾼 push-fe 브랜치나 커밋은 PR 본문에 한 줄로 적습니다.

    push-fe-ref: <branch-or-sha>

`workflow_dispatch` 입력 `push-fe-ref`가 이 줄을 덮어씁니다. 기본값은 `develop`입니다. 패키지 매니저는 pnpm 11.0.4입니다.

`expo-router` 58.0.24에는 push-fe의 pnpm 패치(`patches/expo-router@58.0.24.patch`)가 있습니다. Android 탭 아이콘이 `renderingMode="original"`이면 색을 입히지 않게 하는 한 줄입니다.

### 환경 변수

예시는 `.env.example`이고, 복사 대상은 `.env.local`입니다. 값은 적지 않습니다. 비우면 `src/shared/infrastructure/config.ts`의 기본 주소를 씁니다.

| 이름 | 읽는 곳 |
| --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | `src/shared/infrastructure/config.ts` |
| `EXPO_PUBLIC_WEB_BASE_URL` | 같은 파일. WebView로 여는 fo-web 주소 |
| `EXPO_PUBLIC_API_MOCK` | `1`이면 `src/mock`을 사용 |
| `EXPO_PUBLIC_DEV_AUTH_TOKEN` | `__DEV__` 빌드의 개발 로그인 |

## 스크립트

워크스페이스 루트에서 실행합니다.

```bash
pnpm --filter @push/fo-mobile start      # Expo 개발 서버 (기본 API 주소)
pnpm --filter @push/fo-mobile start:test # 스테이징 API로 개발 서버
pnpm --filter @push/fo-mobile ios        # expo run:ios
pnpm --filter @push/fo-mobile android    # expo run:android
pnpm --filter @push/fo-mobile test
pnpm --filter @push/fo-mobile lint       # expo lint
pnpm --filter @push/fo-mobile typecheck
```

## 테스트

단위 테스트는 Vitest입니다.

```bash
pnpm --filter @push/fo-mobile test
pnpm --filter @push/fo-mobile lint
pnpm --filter @push/fo-mobile typecheck
```

화면 문구는 `에이전트` 대신 `봇`을 씁니다. `src`나 `.maestro`에 `에이전트`가 남아 있으면 `src/shared/__tests__/bot-copy.test.ts`가 실패합니다. `node scripts/bot-copy.mjs`는 조사까지 맞춰 바꾸고, `--check`를 붙이면 남은 줄만 보여 줍니다. 약관 원문은 push-fe `packages/shared`에 있어 이 검사 밖입니다. 같은 원문을 앱 렌더링은 `봇`으로, 웹 렌더링은 `에이전트`로 보여 줍니다.

Maestro 플로우는 `.maestro/`에 있습니다. `.maestro/config.yaml`은 `flows/*`를 실행하고, `_*.yaml` 서브플로와 `visual/`(디자인 비교용 스크린샷)은 제외합니다. iOS 시뮬레이터와 Android 에뮬레이터에서 돌립니다. `.env.local`에 `EXPO_PUBLIC_API_MOCK=1`과 `EXPO_PUBLIC_DEV_AUTH_TOKEN`을 넣고 Metro를 띄운 뒤, push-fe 루트에서 `maestro test apps/fo-mobile/.maestro`를 실행합니다. npm 스크립트와 CI에는 연결되어 있지 않습니다.

## CI/배포

`.github/workflows/ci.yml`은 PR과 `develop`·`main` push, `workflow_dispatch`에서 돌아갑니다. 워크플로는 [push-fe](https://github.com/push-dot/push-fe)를 받고(기본 `develop`), `apps/fo-web` 서브모듈을 초기화한 뒤, 검사 대상 커밋을 `apps/fo-mobile`에 둡니다. 이어서 push-fe 루트에서 `pnpm install --frozen-lockfile`과 `pnpm exec turbo run typecheck lint test --filter=@push/fo-mobile...`를 실행합니다. `@push/fo-mobile`에는 `build` 스크립트가 없어서 이 워크플로는 빌드하지 않습니다.

의존성이 바뀌었는데 잠금 파일이 없으면 frozen install이 실패합니다. 그때는 위의 `push-fe-ref` 줄을 사용합니다. 이 저장소에는 스토어 제출 워크플로가 없습니다.

## 브랜치 규칙

기본 브랜치는 `develop`입니다. 작업 브랜치는 `develop`에서 만들고, PR은 `develop`으로 엽니다. `main`에는 릴리스 PR로만 반영합니다.

## 관련 저장소

- [push-be](https://github.com/push-dot/push-be) — API
- [push-fe](https://github.com/push-dot/push-fe) — 웹·모바일 모노레포
- [fo-web](https://github.com/push-dot/fo-web) — 웹 앱
- [fo-mobile](https://github.com/push-dot/fo-mobile) — 이 저장소
- [push-workspace](https://github.com/push-dot/push-workspace) — 통합 워크스페이스와 제품 문서
- [push-langdig](https://github.com/push-dot/push-langdig) — 랜딩 페이지
